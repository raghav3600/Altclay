export type Provider = "anthropic" | "gemini" | "grok";

export type SpeedTier = "fast" | "medium" | "slow";
export type QualityTier = "good" | "great" | "best";

/** Curation tier — drives which models the picker shows before "show all". */
export type ModelTier = "recommended" | "standard" | "legacy";

/**
 * How a provider bills web search / grounding.
 * `per1K` is the cost per 1,000 search requests.
 * `freeRequests` (if set) are free within `freeWindow` before billing starts.
 */
export interface SearchPricing {
  per1K: number;
  freeRequests?: number;
  freeWindow?: "day" | "month";
  /** True when we could not verify the rate from official docs. */
  estimated?: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: Provider;
  /** Short positioning label, e.g. "Best value". */
  label: string;
  inputPer1M: number;
  outputPer1M: number;
  /** null when the model cannot search the web. */
  search: SearchPricing | null;
  /**
   * Tokens the provider silently adds for tool definitions. Anthropic bills
   * these on every request that declares the web-search tool.
   */
  toolOverheadTokens?: number;
  /** Anthropic only: which web_search tool version this model accepts. */
  webSearchToolType?: string;
  /**
   * Anthropic only. Models from Sonnet 4.6 / Opus 4.6 onward take
   * `thinking: {type:"adaptive"}` + `output_config.effort`; Haiku 4.5 and older
   * reject `effort` outright. Opus 5 and Sonnet 5 think by *default*, so we must
   * send an explicit low effort or every row pays for reasoning it doesn't need.
   */
  supportsAdaptiveThinking?: boolean;
  contextWindow: number;
  speed: SpeedTier;
  quality: QualityTier;
  bestFor: string;
  tier: ModelTier;
  /** Caveat shown next to the price, e.g. promotional rates with an end date. */
  pricingNote?: string;
}

export interface OutputColumn {
  key: string;
  label: string;
}

export interface ParsedFile {
  fileName: string;
  fileType: "xlsx" | "csv";
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface CostEstimate {
  totalRows: number;
  modelName: string;
  inputTokensPerRow: number;
  outputTokensPerRow: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  inputCost: number;
  outputCost: number;
  searchCost: number;
  totalCost: number;
  searchCostPerRow: number;
  freeSearchNote?: string;
  searchCostEstimated?: boolean;
}

export interface EnrichmentResult {
  rowIndex: number;
  success: boolean;
  data: Record<string, string>;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  /** Wall-clock ms for this row, including retries. */
  durationMs?: number;
  /** Cells that came back "N/A" or empty. */
  naCount?: number;
  /** How many times this row had to be retried. */
  retries?: number;
}

/**
 * Live statistics for a run. Surfaced during and after enrichment so users can
 * size provider rate limits (Azure/Vertex TPM) and judge data quality.
 */
export interface RunStats {
  inputTokens: number;
  outputTokens: number;
  /** Highest tokens-consumed-in-any-60s-window observed. */
  peakTokensPerMinute: number;
  /** Output cells that returned "N/A" or empty. */
  naCells: number;
  /** Total output cells attempted (successful rows x output columns). */
  totalCells: number;
  /** Number of retry attempts across all rows. */
  retries: number;
  /** Number of rows that hit a rate limit at least once. */
  rateLimited: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export function emptyRunStats(): RunStats {
  return {
    inputTokens: 0,
    outputTokens: 0,
    peakTokensPerMinute: 0,
    naCells: 0,
    totalCells: 0,
    retries: 0,
    rateLimited: 0,
    startedAt: null,
    finishedAt: null,
  };
}
