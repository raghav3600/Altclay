import type { GeminiModelId } from "./types";

interface VertexEnrichResult {
  data: Record<string, string>;
  inputTokens: number;
  outputTokens: number;
}

export async function enrichRowVertex(
  serviceAccountJson: string,
  modelId: GeminiModelId,
  prompt: string,
  useWebSearch: boolean = true
): Promise<VertexEnrichResult> {
  const res = await fetch("/api/enrich", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "vertex",
      apiKey: serviceAccountJson,
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
