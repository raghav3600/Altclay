import type { GeminiModelId } from "./types";

interface GeminiEnrichResult {
  data: Record<string, string>;
  inputTokens: number;
  outputTokens: number;
}

export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  const res = await fetch("/api/validate-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "gemini", apiKey }),
  });
  const data = await res.json();
  return data.valid === true;
}

export async function enrichRowGemini(
  apiKey: string,
  modelId: GeminiModelId,
  prompt: string,
  useWebSearch: boolean = true
): Promise<GeminiEnrichResult> {
  const res = await fetch("/api/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "gemini",
      apiKey,
      modelId,
      prompt,
      useWebSearch,
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
