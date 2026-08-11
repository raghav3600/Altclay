import { requireModel } from "./pricing";
import type { CostEstimate, ModelConfig, OutputColumn } from "./types";

// Web search injects search results into the prompt, inflating input tokens well
// beyond the prompt we authored. We can't know by how much until a real request
// comes back, so pre-test estimates are quoted as a range.
const SEARCH_TOKEN_MULTIPLIER_LOW = 1; // authored prompt only
const SEARCH_TOKEN_MULTIPLIER_HIGH = 5; // realistic worst case with search

/** Rough char-per-token heuristic. Replaced by real usage after the test run. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateInputTokensPerRow(samplePrompt: string, modelId: string): number {
  const model = requireModel(modelId);
  return estimateTokens(samplePrompt) + (model.toolOverheadTokens ?? 0);
}

export function estimateOutputTokensPerRow(fields: OutputColumn[]): number {
  const baseTokens = 20; // JSON braces, quotes, separators
  return baseTokens + fields.length * 30;
}

function searchNote(model: ModelConfig, totalRows: number, paidSearches: number): string | undefined {
  if (!model.search) return "This model does not support web search.";
  const { freeRequests, freeWindow } = model.search;
  if (!freeRequests) return undefined;

  const window = freeWindow === "month" ? "month" : "day";
  if (paidSearches === 0) {
    return `All ${totalRows.toLocaleString()} searches fit inside the free allowance of ${freeRequests.toLocaleString()} per ${window}. Search cost: $0.`;
  }
  return `First ${freeRequests.toLocaleString()} searches per ${window} are free; ${paidSearches.toLocaleString()} will be billed. Assumes you have not used the allowance yet.`;
}

export function calculateCostEstimate(
  totalRows: number,
  inputTokensPerRow: number,
  outputTokensPerRow: number,
  modelId: string,
  useWebSearch: boolean
): CostEstimate {
  const model = requireModel(modelId);
  const totalInputTokens = inputTokensPerRow * totalRows;
  const totalOutputTokens = outputTokensPerRow * totalRows;

  const inputCost = (totalInputTokens / 1_000_000) * model.inputPer1M;
  const outputCost = (totalOutputTokens / 1_000_000) * model.outputPer1M;

  const searching = useWebSearch && model.search !== null;
  const searchCostPerRow = searching ? model.search!.per1K / 1000 : 0;
  // Free allowance is consumed before anything is billed.
  const freeRequests = searching ? (model.search!.freeRequests ?? 0) : 0;
  const paidSearches = searching ? Math.max(0, totalRows - freeRequests) : 0;
  const searchCost = paidSearches * searchCostPerRow;

  return {
    totalRows,
    modelName: model.name,
    inputTokensPerRow,
    outputTokensPerRow,
    totalInputTokens,
    totalOutputTokens,
    inputCost,
    outputCost,
    searchCost,
    totalCost: inputCost + outputCost + searchCost,
    searchCostPerRow,
    freeSearchNote: !useWebSearch
      ? "Web search disabled — no search fees."
      : searchNote(model, totalRows, paidSearches),
    searchCostEstimated: searching ? model.search!.estimated : false,
  };
}

/**
 * Low/high bracket used before the test run, when we have no real token counts.
 * Only input tokens vary — search fees and output length don't scale with
 * however much context the provider injects.
 */
export function calculateCostRange(
  totalRows: number,
  baseInputTokensPerRow: number,
  outputTokensPerRow: number,
  modelId: string,
  useWebSearch: boolean
): { low: CostEstimate; high: CostEstimate } {
  const highMultiplier = useWebSearch ? SEARCH_TOKEN_MULTIPLIER_HIGH : SEARCH_TOKEN_MULTIPLIER_LOW;
  return {
    low: calculateCostEstimate(
      totalRows,
      baseInputTokensPerRow * SEARCH_TOKEN_MULTIPLIER_LOW,
      outputTokensPerRow,
      modelId,
      useWebSearch
    ),
    high: calculateCostEstimate(
      totalRows,
      baseInputTokensPerRow * highMultiplier,
      outputTokensPerRow,
      modelId,
      useWebSearch
    ),
  };
}

/** Precise estimate from real token counts measured during the test run. */
export function calculateCostFromActualTokens(
  totalRows: number,
  avgInputTokens: number,
  avgOutputTokens: number,
  modelId: string,
  useWebSearch: boolean
): CostEstimate {
  return calculateCostEstimate(totalRows, avgInputTokens, avgOutputTokens, modelId, useWebSearch);
}

/** Cost already incurred, from tokens actually billed so far. */
export function calculateActualSpend(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  searchedRows: number,
  useWebSearch: boolean
): number {
  const model = requireModel(modelId);
  const inputCost = (inputTokens / 1_000_000) * model.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * model.outputPer1M;
  const searching = useWebSearch && model.search !== null;
  const freeRequests = searching ? (model.search!.freeRequests ?? 0) : 0;
  const paid = searching ? Math.max(0, searchedRows - freeRequests) : 0;
  const searchCost = searching ? paid * (model.search!.per1K / 1000) : 0;
  return inputCost + outputCost + searchCost;
}

/** Landing-page calculator: no file, so assume a typical prompt size. */
export function estimateCostSimple(
  rowCount: number,
  fieldCount: number,
  modelId: string
): { low: CostEstimate; high: CostEstimate } {
  const model = requireModel(modelId);
  const avgInputTokens = 200; // prompt + one column of row data
  const inputTokensPerRow = avgInputTokens + (model.toolOverheadTokens ?? 0);
  const outputTokensPerRow = 20 + fieldCount * 30;
  return calculateCostRange(rowCount, inputTokensPerRow, outputTokensPerRow, modelId, true);
}
