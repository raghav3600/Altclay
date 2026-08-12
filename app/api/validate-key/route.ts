import { NextRequest, NextResponse } from "next/server";
import type { Provider } from "@/lib/types";
import { parseVertexConfig, getVertexAccessToken } from "@/lib/vertexAuth";
import { checkEndpointUrl, chatCompletionsUrl } from "@/lib/customEndpoint";

/*
 * Sends the smallest possible request to confirm a key works. Logs nothing.
 *
 * The probe uses each provider's cheapest current model so validation costs
 * effectively nothing (a handful of tokens).
 */

const PROBE_MODEL: Record<Provider, string> = {
  anthropic: "claude-haiku-4-5",
  gemini: "gemini-3.1-flash-lite",
  grok: "grok-4.3",
  openai: "gpt-5-nano",
  // Supplied by the user; there is no fixed model to probe.
  custom: "",
};

interface ProbeResult {
  status: number;
  body: string;
}

function briefly(text: string, limit = 300): string {
  const trimmed = text.trim();
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed;
}

function readMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    return briefly(parsed?.error?.message ?? parsed?.error ?? parsed?.message ?? body);
  } catch {
    return briefly(body);
  }
}

async function probe(
  provider: Provider,
  apiKey: string,
  custom?: { baseUrl: string; modelId: string }
): Promise<ProbeResult> {
  if (provider === "custom") {
    const check = checkEndpointUrl(custom?.baseUrl ?? "");
    if (!check.ok) return { status: 400, body: JSON.stringify({ error: check.error }) };

    const headers: Record<string, string> = { "content-type": "application/json" };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
      headers["api-key"] = apiKey;
    }
    const res = await fetch(chatCompletionsUrl(custom!.baseUrl), {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: custom!.modelId,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 4,
      }),
    });
    return { status: res.status, body: await res.text().catch(() => "") };
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: PROBE_MODEL.anthropic,
        max_tokens: 4,
        messages: [{ role: "user", content: "Hi" }],
      }),
    });
    return { status: res.status, body: await res.text().catch(() => "") };
  }

  if (provider === "gemini") {
    const vertex = parseVertexConfig(apiKey);
    if (vertex) {
      const accessToken = await getVertexAccessToken(vertex);
      const res = await fetch(
        `https://${vertex.location}-aiplatform.googleapis.com/v1/projects/${vertex.projectId}/locations/${vertex.location}/publishers/google/models/${PROBE_MODEL.gemini}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Hi" }] }] }),
        }
      );
      return { status: res.status, body: await res.text().catch(() => "") };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${PROBE_MODEL.gemini}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Hi" }] }] }),
      }
    );
    return { status: res.status, body: await res.text().catch(() => "") };
  }

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: PROBE_MODEL.openai,
        input: [{ role: "user", content: "Hi" }],
        // Reasoning models need headroom even for a trivial probe; a budget of
        // 4 would come back incomplete and look like a broken key.
        max_output_tokens: 16,
        reasoning: { effort: "low" },
      }),
    });
    return { status: res.status, body: await res.text().catch(() => "") };
  }

  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: PROBE_MODEL.grok,
      input: [{ role: "user", content: "Hi" }],
      max_output_tokens: 4,
    }),
  });
  return { status: res.status, body: await res.text().catch(() => "") };
}

export async function POST(req: NextRequest) {
  const { provider, apiKey, baseUrl, modelId } = await req.json();

  if (provider !== "custom" && (!apiKey || typeof apiKey !== "string")) {
    return NextResponse.json({ valid: false, error: "Missing API key" }, { status: 400 });
  }
  if (!Object.prototype.hasOwnProperty.call(PROBE_MODEL, provider)) {
    return NextResponse.json({ valid: false, error: "Unknown provider" }, { status: 400 });
  }

  let result: ProbeResult;
  try {
    result = await probe(provider, (apiKey ?? "").trim(), { baseUrl, modelId });
  } catch (err) {
    // Never reached the provider at all, a local/transport problem, not a bad key.
    // Vertex service-account parsing also lands here.
    return NextResponse.json({
      valid: false,
      error: `Could not reach the provider: ${err instanceof Error ? err.message : "network error"}`,
    });
  }

  const { status, body } = result;
  const isVertex = provider === "gemini" && parseVertexConfig((apiKey ?? "").trim()) !== null;

  if (status >= 200 && status < 300) {
    return NextResponse.json({
      valid: true,
      warning: isVertex
        ? "Validated via Vertex AI. New projects often start with low throughput (commonly ~60 requests/min per model and region), so large runs may throttle until you raise the quota."
        : undefined,
    });
  }

  // A rate limit proves the key is real, it just has no headroom right now.
  if (status === 429) {
    return NextResponse.json({
      valid: true,
      warning:
        "Key is valid but currently rate limited. Enrichment retries automatically with backoff, consider lowering concurrency.",
    });
  }

  if (status === 401 || status === 403) {
    return NextResponse.json({
      valid: false,
      error: "Key rejected by the provider. Check that it is active and has API access enabled.",
    });
  }

  // Every other 4xx is a real configuration problem (unknown model, malformed
  // request, billing not enabled). Reporting these as valid is how a broken
  // provider used to appear connected and then fail on every single row.
  if (status >= 400 && status < 500) {
    return NextResponse.json({
      valid: false,
      error: `Provider rejected the request (HTTP ${status}): ${readMessage(body)}`,
    });
  }

  // 5xx is the provider's problem, not the key's, let the user proceed.
  return NextResponse.json({
    valid: true,
    warning: `Provider returned HTTP ${status}, so the key could not be fully verified. You can continue, but enrichment may fail.`,
  });
}
