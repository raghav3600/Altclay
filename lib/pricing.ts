// Last updated: February 2026
// Sources:
//   Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
//   Google: https://ai.google.dev/gemini-api/docs/pricing
//   OpenAI: https://openai.com/api/pricing

import type {
  AnthropicModelConfig,
  GeminiModelConfig,
  OpenAIModelConfig,
  AnthropicModelId,
  GeminiModelId,
  OpenAIModelId,
  ModelId,
  ModelGuidance,
} from "./types";

export const PRICING_LAST_UPDATED = "February 2026";

export const ANTHROPIC_MODELS: Record<AnthropicModelId, AnthropicModelConfig> = {
  "claude-haiku-4-5-20251001": {
    name: "Claude Haiku 4.5",
    label: "Fastest & Cheapest",
    inputPer1M: 1.0,
    outputPer1M: 5.0,
    webSearchPer1K: 10.0,
    toolOverheadTokens: 346,
    recommended: false,
  },
  "claude-sonnet-4-5-20250929": {
    name: "Claude Sonnet 4.5",
    label: "Best Balance",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    webSearchPer1K: 10.0,
    toolOverheadTokens: 346,
    recommended: true,
  },
  "claude-opus-4-5-20251101": {
    name: "Claude Opus 4.5",
    label: "Most Capable",
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    webSearchPer1K: 10.0,
    toolOverheadTokens: 346,
    recommended: false,
  },
};

export const GEMINI_MODELS: Record<GeminiModelId, GeminiModelConfig> = {
  "gemini-2.0-flash": {
    name: "Gemini 2.0 Flash",
    label: "Fastest & Cheapest",
    inputPer1M: 0.1,
    outputPer1M: 0.4,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: false,
  },
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    label: "Fast with Reasoning",
    inputPer1M: 0.15,
    outputPer1M: 0.6,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: false,
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    label: "Most Capable",
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: true,
  },
};

export const OPENAI_MODELS: Record<OpenAIModelId, OpenAIModelConfig> = {
  "gpt-4o": {
    name: "GPT-4o",
    label: "Flagship Multimodal",
    inputPer1M: 2.50,
    outputPer1M: 10.00,
    recommended: true,
  },
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    label: "Fast & Affordable",
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    recommended: false,
  },
  "gpt-4.1": {
    name: "GPT-4.1",
    label: "Latest & Smartest",
    inputPer1M: 2.00,
    outputPer1M: 8.00,
    recommended: false,
  },
};

export const MODEL_GUIDANCE: Record<ModelId, ModelGuidance> = {
  "claude-haiku-4-5-20251001": {
    speed: "fast",
    quality: "good",
    bestFor: "High-volume enrichment where speed matters more than depth",
    hasWebSearch: true,
  },
  "claude-sonnet-4-5-20250929": {
    speed: "medium",
    quality: "great",
    bestFor: "Best balance of cost, speed, and quality for most tasks",
    hasWebSearch: true,
  },
  "claude-opus-4-5-20251101": {
    speed: "slow",
    quality: "best",
    bestFor: "Complex research requiring nuanced reasoning",
    hasWebSearch: true,
  },
  "gemini-2.0-flash": {
    speed: "fast",
    quality: "good",
    bestFor: "Cheapest option with web search — great for simple lookups",
    hasWebSearch: true,
  },
  "gemini-2.5-flash": {
    speed: "fast",
    quality: "great",
    bestFor: "Fast reasoning with web grounding at low cost",
    hasWebSearch: true,
  },
  "gemini-2.5-pro": {
    speed: "medium",
    quality: "best",
    bestFor: "Google's most capable model with web search",
    hasWebSearch: true,
  },
  "gpt-4o": {
    speed: "medium",
    quality: "great",
    bestFor: "Strong general-purpose enrichment. No live web search",
    hasWebSearch: false,
  },
  "gpt-4o-mini": {
    speed: "fast",
    quality: "good",
    bestFor: "Budget option when web search is not needed",
    hasWebSearch: false,
  },
  "gpt-4.1": {
    speed: "medium",
    quality: "best",
    bestFor: "OpenAI's newest model. Uses training data only",
    hasWebSearch: false,
  },
};

export const ANTHROPIC_PRICING_URL = "https://claude.com/pricing";
export const GEMINI_PRICING_URL = "https://ai.google.dev/gemini-api/docs/pricing";
export const OPENAI_PRICING_URL = "https://openai.com/api/pricing";
