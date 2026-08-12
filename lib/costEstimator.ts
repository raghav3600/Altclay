import { requireModel } from "./pricing";
import type { CostEstimate, ModelConfig, OutputColumn } from "./types";

/**
 * Cost functions accept either a catalog id or a ModelConfig, because a custom
 * endpoint is configured at run time and has no catalog entry to look up.
 */
export type ModelRef = string | ModelConfig;

function resolve(ref: ModelRef): ModelConfig {
  return typeof ref === "string" ? requireModel(ref) : ref;
}

// Web search injects search results into the prompt, inflating input tokens well
// beyond the prompt we authored. We can't know by how much until a real request
// comes back, so pre-test estimates are quoted as a range.
const SEARCH_TOKEN_MULTIPLIER_LOW = 1; // authored prompt only
const SEARCH_TOKEN_MULTIPLIER_HIGH = 5; // realistic worst case with search

/** Rough char-per-token heuristic. Replaced by real usage after the test run. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateInputTokensPerRow(samplePrompt: string, modelId: ModelRef): number {
  const model = resolve(modelId);
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
  modelId: ModelRef,
  useWebSearch: boolean
): CostEstimate {
  const model = resolve(modelId);
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
      ? "Web search disabled, no search fees."
      : searchNote(model, totalRows, paidSearches),
    searchCostEstimated: searching ? model.search!.estimated : false,
  };
}

/**
 * Low/high bracket used before the test run, when we have no real token counts.
 * Only input tokens vary, search fees and output length don't scale with
 * however much context the provider injects.
 */
export function calculateCostRange(
  totalRows: number,
  baseInputTokensPerRow: number,
  outputTokensPerRow: number,
  modelId: ModelRef,
  useWebSearch: boolean
): { low: CostEstimate; high: CostEstimate } {
  const model = resolve(modelId);
  const searching = useWebSearch && model.search !== null;

  // When a provider publishes how much search content it injects, use that
  // figure directly instead of guessing with a multiplier. For OpenAI the
  // documented ~8k tokens per search dwarfs a 250-token prompt, so the
  // multiplier alone would understate the run by an order of magnitude.
  const knownOverhead = searching ? (model.search!.tokenOverheadPerSearch ?? 0) : 0;

  // The multiplier only covers the *unknown* part, so it applies to the
  // authored prompt and never to an overhead we already know exactly.
  const highMultiplier = searching && knownOverhead === 0 ? SEARCH_TOKEN_MULTIPLIER_HIGH : SEARCH_TOKEN_MULTIPLIER_LOW;

  return {
    low: calculateCostEstimate(
      totalRows,
      baseInputTokensPerRow * SEARCH_TOKEN_MULTIPLIER_LOW + knownOverhead,
      outputTokensPerRow,
      modelId,
      useWebSearch
    ),
    high: calculateCostEstimate(
      totalRows,
      baseInputTokensPerRow * highMultiplier + knownOverhead,
      outputTokensPerRow,
      modelId,
      useWebSearch
    ),
  };
}

/** Typical shape of one enrichment row, used for like-for-like model comparison. */
const REFERENCE_ROW = { promptTokens: 250, outputTokens: 140 };

/**
 * What 1,000 rows would actually cost on this model, the figure the picker
 * shows and sorts by.
 *
 * Two things this must get right, both of which have bitten already:
 *
 *  - Search fees belong in it. A token-only figure made OpenAI and Anthropic
 *    look far cheaper than they are, because for a 250-token prompt the
 *    per-search fee dwarfs the tokens.
 *  - Free allowances belong in it too. Gemini 3.x includes 5,000 free grounded
 *    searches per month, so quoting its marginal $14/1k made a 1,000-row Gemini
 *    run look ~50x more expensive than it is.
 *
 * Delegating to calculateCostEstimate means the picker and the sidebar estimate
 * can't disagree.
 */
export function costPerThousandRows(modelId: ModelRef, useWebSearch: boolean = true): number {
  const model = resolve(modelId);
  const searching = useWebSearch && model.search !== null;
  const inputTokens =
    REFERENCE_ROW.promptTokens +
    (model.toolOverheadTokens ?? 0) +
    (searching ? (model.search!.tokenOverheadPerSearch ?? 0) : 0);

  return calculateCostEstimate(1000, inputTokens, REFERENCE_ROW.outputTokens, model, useWebSearch)
    .totalCost;
}

/** Precise estimate from real token counts measured during the test run. */
export function calculateCostFromActualTokens(
  totalRows: number,
  avgInputTokens: number,
  avgOutputTokens: number,
  modelId: ModelRef,
  useWebSearch: boolean
): CostEstimate {
  return calculateCostEstimate(totalRows, avgInputTokens, avgOutputTokens, modelId, useWebSearch);
}

/** Cost already incurred, from tokens actually billed so far. */
export function calculateActualSpend(
  modelId: ModelRef,
  inputTokens: number,
  outputTokens: number,
  searchedRows: number,
  useWebSearch: boolean
): number {
  const model = resolve(modelId);
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
  modelId: ModelRef
): { low: CostEstimate; high: CostEstimate } {
  const model = resolve(modelId);
  const avgInputTokens = 200; // prompt + one column of row data
  const inputTokensPerRow = avgInputTokens + (model.toolOverheadTokens ?? 0);
  const outputTokensPerRow = 20 + fieldCount * 30;
  return calculateCostRange(rowCount, inputTokensPerRow, outputTokensPerRow, model, true);
}
