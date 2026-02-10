import { ANTHROPIC_MODELS, GEMINI_MODELS } from "./pricing";
import type {
  ModelId,
  AnthropicModelId,
  GeminiModelId,
  CostEstimate,
  EnrichmentField,
  Provider,
} from "./types";

// Rough token estimation: ~4 characters per token
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
  fields: EnrichmentField[]
): number {
  // ~30 tokens per field (key + value + JSON syntax)
  const baseTokens = 20; // JSON wrapper tokens
  return baseTokens + fields.length * 30;
}

export function calculateCostEstimate(
  totalRows: number,
  inputTokensPerRow: number,
  outputTokensPerRow: number,
  provider: Provider,
  modelId: ModelId
): CostEstimate {
  const totalInputTokens = inputTokensPerRow * totalRows;
  const totalOutputTokens = outputTokensPerRow * totalRows;

  if (provider === "anthropic") {
    const model = ANTHROPIC_MODELS[modelId as AnthropicModelId];
    if (!model) throw new Error(`Unknown model: ${modelId}`);

    const inputCost = (totalInputTokens / 1_000_000) * model.inputPer1M;
    const outputCost = (totalOutputTokens / 1_000_000) * model.outputPer1M;
    const searchCostPerRow = model.webSearchPer1K / 1000;
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
    const searchCostPerRow = model.groundingPer1K / 1000;
    const paidSearches = Math.max(0, totalRows - model.freeGroundingPerDay);
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
      freeSearchNote:
        totalRows <= model.freeGroundingPerDay
          ? `All ${totalRows} searches are within the free daily limit of ${model.freeGroundingPerDay}. Search cost: $0.`
          : `First ${model.freeGroundingPerDay} searches/day are free. ${paidSearches} searches will be charged.`,
    };
  }
}
