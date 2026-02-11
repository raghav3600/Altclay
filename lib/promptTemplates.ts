import type { OutputColumn } from "./types";

export function buildPrompt(
  inputColumns: string[],
  rowData: Record<string, string>,
  outputColumns: OutputColumn[],
  enrichmentDescription: string,
  customPrompt?: string,
  useWebSearch: boolean = true
): string {
  if (customPrompt) {
    let prompt = customPrompt;
    for (const col of inputColumns) {
      prompt = prompt.replace(new RegExp(`\\{${col}\\}`, "g"), rowData[col] || "");
    }
    return prompt;
  }

  const inputData = inputColumns
    .map((col) => `"${col}":"${rowData[col] || ""}"`)
    .join(",");

  const outputFields = outputColumns
    .map((f) => `"${f.key}":"string"`)
    .join(",");

  // Trimmed prompt: ~60% fewer tokens than the original verbose version.
  // Every token here is multiplied by every row in the batch.
  const searchInstruction = useWebSearch
    ? "Use web search for current data."
    : "Use your knowledge only (no web search).";

  return `${enrichmentDescription}

Data: {${inputData}}

Return ONLY valid JSON: {${outputFields}}
${searchInstruction} Be concise. "N/A" if unavailable. No extra text.`;
}
