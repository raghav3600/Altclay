// Last updated: May 2026
// Sources:
//   Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
//   Google: https://ai.google.dev/gemini-api/docs/pricing
//   xAI: https://docs.x.ai/developers/models
//   OpenAI: https://developers.openai.com/api/docs/pricing

import type {
  AnthropicModelConfig,
  GeminiModelConfig,
  GrokModelConfig,
  OpenAIModelConfig,
  AnthropicModelId,
  GeminiModelId,
  GrokModelId,
  OpenAIModelId,
  ModelId,
  ModelGuidance,
} from "./types";

export const PRICING_LAST_UPDATED = "May 2026";

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
    inputPer1M: 0.30,
    outputPer1M: 2.50,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: false,
  },
  "gemini-2.5-flash-lite": {
    name: "Gemini 2.5 Flash Lite",
    label: "Budget Reasoning",
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: false,
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    label: "Strong Reasoning",
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: false,
  },
  "gemini-3-flash-preview": {
    name: "Gemini 3 Flash",
    label: "Next-Gen Fast",
    inputPer1M: 0.50,
    outputPer1M: 3.00,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: false,
  },
  "gemini-3.1-flash-lite-preview": {
    name: "Gemini 3.1 Flash Lite",
    label: "Next-Gen Budget",
    inputPer1M: 0.25,
    outputPer1M: 1.50,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: false,
  },
  "gemini-3.1-pro-preview": {
    name: "Gemini 3.1 Pro",
    label: "Most Capable",
    inputPer1M: 2.00,
    outputPer1M: 12.00,
    groundingPer1K: 35.0,
    freeGroundingPerDay: 1500,
    recommended: true,
  },
};

export const GROK_MODELS: Record<GrokModelId, GrokModelConfig> = {
  "grok-4-1-fast": {
    name: "Grok 4.1 Fast",
    label: "Fastest & Cheapest",
    inputPer1M: 0.20,
    outputPer1M: 0.50,
    webSearchPer1K: 5.0,
    recommended: false,
  },
  "grok-4-0320": {
    name: "Grok 4.20",
    label: "Most Capable",
    inputPer1M: 2.0,
    outputPer1M: 6.0,
    webSearchPer1K: 5.0,
    recommended: true,
  },
};

export const OPENAI_MODELS: Record<OpenAIModelId, OpenAIModelConfig> = {
  "gpt-4.1-nano": {
    name: "GPT-4.1 Nano",
    label: "Cheapest",
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    webSearchPer1K: 25.0,
    recommended: false,
  },
  "gpt-5.4-nano": {
    name: "GPT-5.4 Nano",
    label: "Budget",
    inputPer1M: 0.20,
    outputPer1M: 1.25,
    webSearchPer1K: 10.0,
    recommended: false,
  },
  "gpt-5.4-mini": {
    name: "GPT-5.4 Mini",
    label: "Best Balance",
    inputPer1M: 0.75,
    outputPer1M: 4.50,
    webSearchPer1K: 10.0,
    recommended: true,
  },
  "gpt-5.4": {
    name: "GPT-5.4",
    label: "Most Capable",
    inputPer1M: 2.50,
    outputPer1M: 15.00,
    webSearchPer1K: 10.0,
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
  "gemini-2.5-flash-lite": {
    speed: "fast",
    quality: "good",
    bestFor: "Budget reasoning model — cheapest Gemini with thinking",
    hasWebSearch: true,
  },
  "gemini-2.5-pro": {
    speed: "medium",
    quality: "best",
    bestFor: "Strong reasoning with web search at competitive cost",
    hasWebSearch: true,
  },
  "gemini-3-flash-preview": {
    speed: "fast",
    quality: "great",
    bestFor: "Next-gen speed and quality for most enrichment tasks",
    hasWebSearch: true,
  },
  "gemini-3.1-flash-lite-preview": {
    speed: "fast",
    quality: "good",
    bestFor: "Next-gen budget option for high-volume lookups",
    hasWebSearch: true,
  },
  "gemini-3.1-pro-preview": {
    speed: "medium",
    quality: "best",
    bestFor: "Google's most capable model — best for complex research",
    hasWebSearch: true,
  },
  "grok-4-1-fast": {
    speed: "fast",
    quality: "good",
    bestFor: "Ultra-cheap enrichment with web search — great for high-volume lookups",
    hasWebSearch: true,
  },
  "grok-4-0320": {
    speed: "medium",
    quality: "best",
    bestFor: "xAI's flagship model with strong reasoning and web search",
    hasWebSearch: true,
  },
  "gpt-4.1-nano": {
    speed: "fast",
    quality: "good",
    bestFor: "Ultra-cheap option — great for simple lookups at high volume",
    hasWebSearch: true,
  },
  "gpt-5.4-nano": {
    speed: "fast",
    quality: "good",
    bestFor: "Budget-friendly GPT-5.4 for fast, simple enrichment",
    hasWebSearch: true,
  },
  "gpt-5.4-mini": {
    speed: "fast",
    quality: "great",
    bestFor: "Best balance of cost and quality in the OpenAI lineup",
    hasWebSearch: true,
  },
  "gpt-5.4": {
    speed: "medium",
    quality: "best",
    bestFor: "OpenAI's most capable model with web search",
    hasWebSearch: true,
  },
};

export const ANTHROPIC_PRICING_URL = "https://claude.com/pricing";
export const GEMINI_PRICING_URL = "https://ai.google.dev/gemini-api/docs/pricing";
export const GROK_PRICING_URL = "https://docs.x.ai/developers/models";
export const OPENAI_PRICING_URL = "https://openai.com/api/pricing/";
