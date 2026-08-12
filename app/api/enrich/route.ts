import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/pricing";
import { parseVertexConfig, getVertexAccessToken } from "@/lib/vertexAuth";
import { checkEndpointUrl, chatCompletionsUrl } from "@/lib/customEndpoint";

/*
 * Thin proxy. It forwards the user's key to the chosen provider and returns the
 * parsed result. It logs nothing: no keys, no prompts, no row data. See CLAUDE.md.
 *
 * It does forward the provider's HTTP status and Retry-After, because the client
 * needs those to tell a rate limit (worth retrying, with backoff) from a bad
 * request (retrying will fail identically five more times).
 */

const MAX_OUTPUT_TOKENS = 4096;
/** Reasoning models spend this budget on thinking before the answer. */
const REASONING_OUTPUT_TOKENS = 8192;

/** Provider failure with the upstream status preserved. */
class UpstreamError extends Error {
  status: number;
  retryAfterMs?: number;
  constructor(message: string, status: number, retryAfterMs?: number) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function parseRetryAfter(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(raw);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

/** Truncate provider error bodies so we surface a useful message, not a wall of JSON. */
function briefly(text: string, limit = 400): string {
  const trimmed = text.trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed;
}

async function assertOk(res: Response, provider: string): Promise<void> {
  if (res.ok) return;
  const body = await res.text().catch(() => "");
  let message = briefly(body) || `${provider} returned ${res.status}`;
  // Providers nest the human-readable reason differently; try the common shapes.
  try {
    const parsed = JSON.parse(body);
    message = briefly(parsed?.error?.message ?? parsed?.error ?? parsed?.message ?? message);
  } catch {
    /* body was not JSON — the truncated text is the best we have */
  }
  throw new UpstreamError(message, res.status, parseRetryAfter(res));
}

/**
 * Pull the JSON object out of a model response. Models wrap it in prose or
 * ```json fences often enough that a bare JSON.parse fails regularly.
 * Scans for the outermost balanced braces rather than a greedy regex, so
 * trailing commentary after the object doesn't break parsing.
 */
function extractJSON(text: string): Record<string, string> {
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");

  let depth = 0;
  let start = -1;
  let candidate = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        candidate = cleaned.slice(start, i + 1);
        break;
      }
    }
  }

  if (!candidate) {
    throw new UpstreamError(
      `Model did not return JSON. Response began: "${briefly(cleaned, 120)}"`,
      422
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new UpstreamError(`Model returned malformed JSON: "${briefly(candidate, 120)}"`, 422);
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    // Flatten nested objects/arrays rather than rendering "[object Object]" into a cell.
    result[key] =
      value === null || value === undefined
        ? "N/A"
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Anthropic                                                          */
/* ------------------------------------------------------------------ */

async function callAnthropic(apiKey: string, modelId: string, prompt: string, useWebSearch: boolean) {
  const model = getModel(modelId);
  const searchToolType = model?.webSearchToolType ?? "web_search_20250305";

  const body: Record<string, unknown> = {
    model: modelId,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [{ role: "user", content: prompt }],
  };

  if (useWebSearch) {
    body.tools = [{ type: searchToolType, name: "web_search", max_uses: 3 }];
  }

  // Opus 5 and Sonnet 5 think by default. Left alone, every row would pay for
  // reasoning a one-line lookup doesn't need. Low effort keeps adaptive thinking
  // available for the genuinely ambiguous rows without spending it on the rest.
  // We keep thinking *on* rather than disabling it: with thinking disabled these
  // models occasionally emit a tool call as plain text, which means the web
  // search silently never runs and the row comes back unresearched.
  if (model?.supportsAdaptiveThinking) {
    body.thinking = { type: "adaptive" };
    body.output_config = { effort: "low" };
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  await assertOk(res, "Anthropic");

  const data = await res.json();

  // Safety classifiers can decline with HTTP 200 and an empty content array.
  if (data.stop_reason === "refusal") {
    throw new UpstreamError(
      `Model declined this request${data.stop_details?.category ? ` (${data.stop_details.category})` : ""}. Try rewording the prompt.`,
      422
    );
  }

  const text = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");

  return {
    data: extractJSON(text),
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Google Gemini                                                      */
/* ------------------------------------------------------------------ */

function geminiBody(prompt: string, useWebSearch: boolean, modelId: string) {
  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  };
  if (useWebSearch) body.tools = [{ googleSearch: {} }];

  // 2.5-series models think by default and can spend the whole output budget on
  // it, returning empty text. thinkingBudget:0 is the documented 2.5 opt-out.
  // The 3.x knob differs and is left at its default rather than guessed at.
  if (modelId.startsWith("gemini-2.5")) {
    (body.generationConfig as Record<string, unknown>).thinkingConfig = { thinkingBudget: 0 };
  }
  return body;
}

function readGeminiResponse(data: {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}) {
  const candidate = data.candidates?.[0];
  const text = (candidate?.content?.parts ?? []).map((p) => p.text ?? "").join("");

  if (!text && candidate?.finishReason && candidate.finishReason !== "STOP") {
    throw new UpstreamError(`Gemini stopped early (${candidate.finishReason}) with no output.`, 422);
  }

  return {
    data: extractJSON(text),
    inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

/**
 * Vertex serves the Gemini 3.x models only from the `global` location, on the
 * un-prefixed host. Using the regional host for those returns a 404 that reads
 * like a bad model id, which is a genuinely confusing way to fail.
 */
function vertexEndpoint(modelId: string, projectId: string, location: string): string {
  if (modelId.startsWith("gemini-3")) {
    return `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${modelId}:generateContent`;
  }
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
}

async function callGemini(apiKey: string, modelId: string, prompt: string, useWebSearch: boolean) {
  const vertex = parseVertexConfig(apiKey);

  if (vertex) {
    const accessToken = await getVertexAccessToken(vertex);
    const res = await fetch(vertexEndpoint(modelId, vertex.projectId, vertex.location), {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(geminiBody(prompt, useWebSearch, modelId)),
    });
    await assertOk(res, "Vertex AI");
    return readGeminiResponse(await res.json());
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(geminiBody(prompt, useWebSearch, modelId)),
    }
  );
  await assertOk(res, "Gemini");
  return readGeminiResponse(await res.json());
}

/* ------------------------------------------------------------------ */
/*  Responses API — shared by OpenAI and xAI                           */
/* ------------------------------------------------------------------ */

interface ResponsesPayload {
  status?: string;
  incomplete_details?: { reason?: string };
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

/** xAI implements OpenAI's Responses shape, so one reader serves both. */
function readResponsesApi(data: ResponsesPayload, provider: string) {
  let text = "";
  for (const item of data.output ?? []) {
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const block of item.content) {
        if (block.type === "output_text") text += block.text ?? "";
      }
    }
  }

  // Reasoning tokens count against max_output_tokens, so a truncated response
  // is a real failure mode worth naming rather than a confusing parse error.
  if (!text && data.status === "incomplete") {
    throw new UpstreamError(
      `${provider} response was cut off (${data.incomplete_details?.reason ?? "incomplete"}) before any text was produced.`,
      422
    );
  }

  return {
    data: extractJSON(text),
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  };
}

async function callGrok(apiKey: string, modelId: string, prompt: string, useWebSearch: boolean) {
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modelId,
      input: [{ role: "user", content: prompt }],
      max_output_tokens: MAX_OUTPUT_TOKENS,
      ...(useWebSearch ? { tools: [{ type: "web_search" }] } : {}),
    }),
  });
  await assertOk(res, "xAI");
  return readResponsesApi(await res.json(), "xAI");
}

/* ------------------------------------------------------------------ */
/*  OpenAI                                                             */
/* ------------------------------------------------------------------ */

async function callOpenAI(apiKey: string, modelId: string, prompt: string, useWebSearch: boolean) {
  const model = getModel(modelId);

  const body: Record<string, unknown> = {
    model: modelId,
    input: [{ role: "user", content: prompt }],
    // Reasoning tokens are drawn from this budget, so the cap is higher than
    // the other providers' to leave room for the answer itself.
    max_output_tokens: REASONING_OUTPUT_TOKENS,
    ...(useWebSearch ? { tools: [{ type: "web_search" }] } : {}),
  };

  // The GPT-5 family reasons by default. "low" rather than "minimal": web
  // search refuses minimal effort, and every row would otherwise be billed for
  // reasoning that a one-line lookup does not need.
  if (model?.supportsReasoningEffort) {
    body.reasoning = { effort: "low" };
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  await assertOk(res, "OpenAI");
  return readResponsesApi(await res.json(), "OpenAI");
}

/* ------------------------------------------------------------------ */
/*  Custom OpenAI-compatible endpoint                                   */
/* ------------------------------------------------------------------ */

/**
 * Chat Completions rather than the Responses API: every OpenAI-compatible
 * gateway implements /v1/chat/completions, but almost none implement
 * /v1/responses. One shape covers Azure, OpenRouter, Groq, Together,
 * Fireworks, DeepInfra, Ollama, LM Studio and vLLM.
 */
async function callCustom(
  apiKey: string,
  modelId: string,
  prompt: string,
  baseUrl: string
) {
  const check = checkEndpointUrl(baseUrl);
  if (!check.ok) throw new UpstreamError(check.error ?? "Invalid endpoint URL", 400);

  const headers: Record<string, string> = { "content-type": "application/json" };
  // Some gateways (a local Ollama, for instance) need no key at all.
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    // Azure OpenAI reads the key from its own header instead.
    headers["api-key"] = apiKey;
  }

  const res = await fetch(chatCompletionsUrl(baseUrl), {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      max_tokens: MAX_OUTPUT_TOKENS,
      // Nudges compliant servers to emit parseable output. Gateways that don't
      // support it generally ignore unknown fields rather than erroring.
      response_format: { type: "json_object" },
    }),
  });
  await assertOk(res, "Custom endpoint");

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";

  if (!text) {
    const reason = data?.choices?.[0]?.finish_reason;
    throw new UpstreamError(
      `Endpoint returned no content${reason ? ` (finish_reason: ${reason})` : ""}. Check the model id.`,
      422
    );
  }

  return {
    data: extractJSON(text),
    inputTokens: data?.usage?.prompt_tokens ?? 0,
    outputTokens: data?.usage?.completion_tokens ?? 0,
  };
}

/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, modelId, prompt, useWebSearch = true, baseUrl } = await req.json();

    if (!modelId || !prompt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    // A local gateway may need no key; every hosted provider does.
    if (!apiKey && provider !== "custom") {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 });
    }

    const result =
      provider === "anthropic"
        ? await callAnthropic(apiKey, modelId, prompt, useWebSearch)
        : provider === "gemini"
          ? await callGemini(apiKey, modelId, prompt, useWebSearch)
          : provider === "grok"
            ? await callGrok(apiKey, modelId, prompt, useWebSearch)
            : provider === "openai"
              ? await callOpenAI(apiKey, modelId, prompt, useWebSearch)
              : provider === "custom"
                ? await callCustom(apiKey, modelId, prompt, baseUrl)
                : null;

    if (!result) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof UpstreamError) {
      return NextResponse.json(
        { error: err.message, retryAfterMs: err.retryAfterMs },
        { status: err.status }
      );
    }
    // Transport-level failures (DNS, TLS, socket) are worth one more attempt, so
    // report them as 503 rather than a non-retryable 500.
    const message = err instanceof Error ? err.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
