// Last updated: February 2026
// Sources:
//   Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
//   Google: https://ai.google.dev/gemini-api/docs/pricing

import type { AnthropicModelConfig, GeminiModelConfig, AnthropicModelId, GeminiModelId } from "./types";

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

export const ANTHROPIC_PRICING_URL = "https://claude.com/pricing";
export const GEMINI_PRICING_URL = "https://ai.google.dev/gemini-api/docs/pricing";
