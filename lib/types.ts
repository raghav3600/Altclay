export type Provider = "anthropic" | "gemini" | "grok";

export type AnthropicModelId =
  | "claude-haiku-4-5-20251001"
  | "claude-sonnet-4-5-20250929"
  | "claude-opus-4-5-20251101";

export type GeminiModelId =
  | "gemini-2.0-flash"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-pro"
  | "gemini-3-flash-preview"
  | "gemini-3.1-flash-lite-preview"
  | "gemini-3.1-pro-preview";

export type GrokModelId =
  | "grok-4-1-fast"
  | "grok-4-0320";

export type ModelId = AnthropicModelId | GeminiModelId | GrokModelId;

export interface AnthropicModelConfig {
  name: string;
  label: string;
  inputPer1M: number;
  outputPer1M: number;
  webSearchPer1K: number;
  toolOverheadTokens: number;
  recommended: boolean;
}

export interface GeminiModelConfig {
  name: string;
  label: string;
  inputPer1M: number;
  outputPer1M: number;
  groundingPer1K: number;
  freeGroundingPerDay: number;
  recommended: boolean;
}

export interface GrokModelConfig {
  name: string;
  label: string;
  inputPer1M: number;
  outputPer1M: number;
  webSearchPer1K: number;
  recommended: boolean;
}

export type SpeedTier = "fast" | "medium" | "slow";
export type QualityTier = "good" | "great" | "best";

export interface ModelGuidance {
  speed: SpeedTier;
  quality: QualityTier;
  bestFor: string;
  hasWebSearch: boolean;
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
}

export interface EnrichmentConfig {
  provider: Provider;
  apiKey: string;
  modelId: ModelId;
  inputColumns: string[];
  outputColumns: OutputColumn[];
  enrichmentDescription: string;
  customPrompt?: string;
}

export interface EnrichmentResult {
  rowIndex: number;
  success: boolean;
  data: Record<string, string>;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface RunProgress {
  total: number;
  completed: number;
  failed: number;
  running: boolean;
  paused: boolean;
  results: EnrichmentResult[];
  actualCost: number;
}
