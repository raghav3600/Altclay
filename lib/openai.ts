import type { OpenAIModelId } from "./types";

interface OpenAIEnrichResult {
  data: Record<string, string>;
  inputTokens: number;
  outputTokens: number;
}

export async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  const res = await fetch("/api/validate-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "openai", apiKey }),
  });
  const data = await res.json();
  return data.valid === true;
}

export async function enrichRowOpenAI(
  apiKey: string,
  modelId: OpenAIModelId,
  prompt: string
): Promise<OpenAIEnrichResult> {
  const res = await fetch("/api/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "openai",
      apiKey,
      modelId,
      prompt,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const result = await res.json();
  return {
    data: result.data,
    inputTokens: result.inputTokens || 0,
    outputTokens: result.outputTokens || 0,
  };
}
