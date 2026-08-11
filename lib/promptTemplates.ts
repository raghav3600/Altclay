import type { OutputColumn } from "./types";

/** Escape regex metacharacters so column names like "Rev (USD)" substitute safely. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the prompt *template* — the reusable form, with `{column}` placeholders
 * left un-substituted.
 *
 * This is what advanced mode must edit. Handing users a prompt with row 1's
 * values already baked in produced identical output for every row, because
 * `renderPrompt` then had no placeholders left to replace.
 */
export function buildPromptTemplate(
  inputColumns: string[],
  outputColumns: OutputColumn[],
  enrichmentDescription: string,
  useWebSearch: boolean = true
): string {
  const inputData = inputColumns.map((col) => `"${col}":"{${col}}"`).join(",");
  const outputFields = outputColumns.map((f) => `"${f.key}":"string"`).join(",");

  // Kept deliberately terse: every token here is multiplied by every row.
  const searchInstruction = useWebSearch
    ? "Use web search for current data."
    : "Use your knowledge only (no web search).";

  return `${enrichmentDescription}

Data: {${inputData}}

Return ONLY valid JSON: {${outputFields}}
${searchInstruction} Be concise. "N/A" if unavailable. No extra text.`;
}

/** Substitute a row's values into a template. Missing columns become empty. */
export function renderPrompt(
  template: string,
  inputColumns: string[],
  rowData: Record<string, string>
): string {
  let prompt = template;
  for (const col of inputColumns) {
    prompt = prompt.replace(new RegExp(`\\{${escapeRegex(col)}\\}`, "g"), rowData[col] ?? "");
  }
  return prompt;
}

/**
 * The prompt actually sent for one row. Pass `customTemplate` to use an
 * edited template instead of the generated one — either way the row's values
 * are substituted at this point, never earlier.
 */
export function buildPrompt(
  inputColumns: string[],
  rowData: Record<string, string>,
  outputColumns: OutputColumn[],
  enrichmentDescription: string,
  customTemplate?: string,
  useWebSearch: boolean = true
): string {
  const template =
    customTemplate ??
    buildPromptTemplate(inputColumns, outputColumns, enrichmentDescription, useWebSearch);
  return renderPrompt(template, inputColumns, rowData);
}

/** Which of `inputColumns` a template actually references. */
export function findPlaceholders(template: string, inputColumns: string[]): string[] {
  return inputColumns.filter((col) =>
    new RegExp(`\\{${escapeRegex(col)}\\}`).test(template)
  );
}

export interface TemplateWarning {
  level: "error" | "warning";
  message: string;
}

/**
 * Guardrail for advanced mode. A template with no placeholders sends a byte-identical
 * prompt for every row, which silently produces the same answer N times — the
 * failure mode that shipped before this check existed.
 */
export function validateTemplate(
  template: string,
  inputColumns: string[],
  outputColumns: OutputColumn[]
): TemplateWarning[] {
  const warnings: TemplateWarning[] = [];
  if (!template.trim()) {
    warnings.push({ level: "error", message: "The prompt template is empty." });
    return warnings;
  }

  const used = findPlaceholders(template, inputColumns);
  if (used.length === 0) {
    warnings.push({
      level: "error",
      message:
        inputColumns.length > 0
          ? `No column placeholders found. Every row would get an identical prompt and identical results. Insert at least one of: ${inputColumns
              .map((c) => `{${c}}`)
              .join(", ")}`
          : "No column placeholders found. Select input columns first.",
    });
  } else if (used.length < inputColumns.length) {
    const missing = inputColumns.filter((c) => !used.includes(c));
    warnings.push({
      level: "warning",
      message: `Selected but unused: ${missing.map((c) => `{${c}}`).join(", ")}. Those columns won't reach the model.`,
    });
  }

  const missingOutputs = outputColumns.filter((c) => !template.includes(`"${c.key}"`));
  if (outputColumns.length > 0 && missingOutputs.length === outputColumns.length) {
    warnings.push({
      level: "warning",
      message:
        "The template doesn't name any of your output columns. Results may not parse into the right cells.",
    });
  }

  if (!/json/i.test(template)) {
    warnings.push({
      level: "warning",
      message: "The template never mentions JSON. Responses may fail to parse.",
    });
  }

  return warnings;
}
