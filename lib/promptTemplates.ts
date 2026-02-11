import type { OutputColumn } from "./types";

export function buildPrompt(
  inputColumns: string[],
  rowData: Record<string, string>,
  outputColumns: OutputColumn[],
  enrichmentDescription: string,
  customPrompt?: string
): string {
  if (customPrompt) {
    let prompt = customPrompt;
    for (const col of inputColumns) {
      prompt = prompt.replace(new RegExp(`\\{${col}\\}`, "g"), rowData[col] || "");
    }
    return prompt;
  }

  const inputDataLines = inputColumns
    .map((col) => `  "${col}": "${rowData[col] || ""}"`)
    .join("\n");

  const outputFieldLines = outputColumns
    .map((f) => `  "${f.key}": "string"`)
    .join(",\n");

  return `You are a data enrichment assistant. You have access to web search to find current, accurate information.

Goal: ${enrichmentDescription}

Given the following data about this entity:
${inputDataLines}

Research this entity and return ONLY a valid JSON object with these exact fields:
{
${outputFieldLines}
}

Rules:
- Use web search to find accurate, up-to-date information
- Be concise and factual in every field
- If data is genuinely unavailable after searching, use "N/A"
- Return ONLY valid JSON, no markdown, no explanation, no extra text
- Do not guess or fabricate data — only report what you can verify`;
}
