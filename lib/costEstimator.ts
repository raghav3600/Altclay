import { ANTHROPIC_MODELS, GEMINI_MODELS } from "./pricing";
import type {
  ModelId,
  AnthropicModelId,
  GeminiModelId,
  CostEstimate,
  OutputColumn,
  Provider,
} from "./types";

// Web search typically injects 500-2000 tokens of search results into context
const SEARCH_TOKEN_MULTIPLIER_LOW = 1; // base tokens only (no search inflation)
const SEARCH_TOKEN_MULTIPLIER_HIGH = 5; // realistic worst case with search

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateInputTokensPerRow(
  samplePrompt: string,
  provider: Provider,
  modelId: ModelId
): number {
  const promptTokens = estimateTokens(samplePrompt);
  if (provider === "anthropic") {
    const model = ANTHROPIC_MODELS[modelId as AnthropicModelId];
    return promptTokens + (model?.toolOverheadTokens || 346);
  }
  return promptTokens;
}

export function estimateOutputTokensPerRow(
  fields: OutputColumn[]
): number {
  const baseTokens = 20;
  return baseTokens + fields.length * 30;
}

export function calculateCostEstimate(
  totalRows: number,
  inputTokensPerRow: number,
  outputTokensPerRow: number,
  provider: Provider,
  modelId: ModelId,
  useWebSearch: boolean = true
): CostEstimate {
  const totalInputTokens = inputTokensPerRow * totalRows;
  const totalOutputTokens = outputTokensPerRow * totalRows;

  if (provider === "anthropic") {
    const model = ANTHROPIC_MODELS[modelId as AnthropicModelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const inputCost = (totalInputTokens / 1_000_000) * model.inputPer1M;
    const outputCost = (totalOutputTokens / 1_000_000) * model.outputPer1M;
    const searchCostPerRow = useWebSearch ? model.webSearchPer1K / 1000 : 0;
    const searchCost = searchCostPerRow * totalRows;

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
    };
  } else {
    const model = GEMINI_MODELS[modelId as GeminiModelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const inputCost = (totalInputTokens / 1_000_000) * model.inputPer1M;
    const outputCost = (totalOutputTokens / 1_000_000) * model.outputPer1M;
    const searchCostPerRow = useWebSearch ? model.groundingPer1K / 1000 : 0;
    const paidSearches = useWebSearch ? Math.max(0, totalRows - model.freeGroundingPerDay) : 0;
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
        : totalRows <= model.freeGroundingPerDay
          ? `All ${totalRows} searches are within the free daily limit of ${model.freeGroundingPerDay}. Search cost: $0.`
          : `First ${model.freeGroundingPerDay} searches/day are free. ${paidSearches} searches will be charged.`,
    };
  }
}

/**
 * Calculate a cost range: low (token-only) and high (with search inflation).
 * Used before the test run when we don't have real token data.
 */
export function calculateCostRange(
  totalRows: number,
  baseInputTokensPerRow: number,
  outputTokensPerRow: number,
  provider: Provider,
  modelId: ModelId,
  useWebSearch: boolean = true
): { low: CostEstimate; high: CostEstimate } {
  // Low: base tokens + search fees (no search token inflation)
  const low = calculateCostEstimate(
    totalRows,
    baseInputTokensPerRow * SEARCH_TOKEN_MULTIPLIER_LOW,
    outputTokensPerRow,
    provider,
    modelId,
    useWebSearch
  );

  // High: tokens inflated by search context injection
  const high = calculateCostEstimate(
    totalRows,
    useWebSearch ? baseInputTokensPerRow * SEARCH_TOKEN_MULTIPLIER_HIGH : baseInputTokensPerRow,
    outputTokensPerRow,
    provider,
    modelId,
    useWebSearch
  );

  return { low, high };
}

/**
 * After the test run, calculate a precise estimate using real token counts.
 */
export function calculateCostFromActualTokens(
  totalRows: number,
  avgInputTokens: number,
  avgOutputTokens: number,
  provider: Provider,
  modelId: ModelId,
  useWebSearch: boolean = true
): CostEstimate {
  return calculateCostEstimate(
    totalRows,
    avgInputTokens,
    avgOutputTokens,
    provider,
    modelId,
    useWebSearch
  );
}

// Simple cost estimate for landing page calculator (no file needed)
export function estimateCostSimple(
  rowCount: number,
  fieldCount: number,
  provider: Provider,
  modelId: ModelId
): { low: CostEstimate; high: CostEstimate } {
  // Average ~200 input tokens per row (prompt + one column of data)
  const avgInputTokens = 200;
  const inputTokensPerRow =
    provider === "anthropic"
      ? avgInputTokens + (ANTHROPIC_MODELS[modelId as AnthropicModelId]?.toolOverheadTokens || 346)
      : avgInputTokens;

  const outputTokensPerRow = 20 + fieldCount * 30;

  return calculateCostRange(
    rowCount,
    inputTokensPerRow,
    outputTokensPerRow,
    provider,
    modelId,
    true
  );
}
