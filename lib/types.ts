export type Provider = "anthropic" | "gemini";

export type AnthropicModelId =
  | "claude-haiku-4-5-20251001"
  | "claude-sonnet-4-5-20250929"
  | "claude-opus-4-5-20251101";

export type GeminiModelId =
  | "gemini-2.0-flash"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro";

export type ModelId = AnthropicModelId | GeminiModelId;

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

export type EnrichmentCategory =
  | "companies"
  | "universities"
  | "people"
  | "countries"
  | "products"
  | "research"
  | "custom";

export interface EnrichmentField {
  key: string;
  label: string;
  description: string;
}

export interface CategoryPreset {
  id: EnrichmentCategory;
  icon: string;
  name: string;
  description: string;
  fields: EnrichmentField[];
  contextLabel: string;
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
  category: EnrichmentCategory;
  selectedFields: EnrichmentField[];
  customPrompt?: string;
  useAdvancedMode: boolean;
}

export interface EnrichmentResult {
  rowIndex: number;
  success: boolean;
  data: Record<string, string>;
  error?: string;
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

export type WizardStep =
  | "landing"
  | "api-key"
  | "upload"
  | "configure"
  | "estimate"
  | "test"
  | "run"
  | "download";
