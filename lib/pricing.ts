// Last verified: 11 August 2026
//
// Sources (re-check these when bumping PRICING_LAST_UPDATED):
//   Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
//   Google:    https://ai.google.dev/gemini-api/docs/pricing
//   xAI:       https://docs.x.ai/developers/models
//
// Prices are per 1M tokens, standard (non-batch) tier. Providers that charge a
// premium above a context threshold (Gemini >200k, Grok >200k) are quoted at the
// low tier: one enrichment row is a few hundred tokens, so the high tier can
// never apply here.

import type { ModelConfig, Provider } from "./types";

export const PRICING_LAST_UPDATED = "August 2026";

export const PROVIDER_META: Record<
  Provider,
  { name: string; company: string; keyPrefix: string; keyUrl: string; pricingUrl: string; docsLabel: string }
> = {
  anthropic: {
    name: "Claude",
    company: "Anthropic",
    keyPrefix: "sk-ant-",
    keyUrl: "https://console.anthropic.com",
    pricingUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    docsLabel: "Anthropic Console",
  },
  gemini: {
    name: "Gemini",
    company: "Google",
    keyPrefix: "AIza",
    keyUrl: "https://aistudio.google.com/apikey",
    pricingUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    docsLabel: "Google AI Studio",
  },
  grok: {
    name: "Grok",
    company: "xAI",
    keyPrefix: "xai-",
    keyUrl: "https://console.x.ai",
    pricingUrl: "https://docs.x.ai/developers/models",
    docsLabel: "xAI Console",
  },
};

/* ------------------------------------------------------------------ */
/*  Anthropic                                                          */
/* ------------------------------------------------------------------ */

// Anthropic bills web search at $10 per 1,000 searches on every model.
const ANTHROPIC_SEARCH = { per1K: 10 } as const;

// Models from Opus 4.6 / Sonnet 4.6 onward accept the newer search tool with
// dynamic filtering; older models only take the basic variant.
const SEARCH_TOOL_NEW = "web_search_20260209";
const SEARCH_TOOL_BASIC = "web_search_20250305";

const ANTHROPIC: ModelConfig[] = [
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    label: "Fastest & cheapest",
    inputPer1M: 1.0,
    outputPer1M: 5.0,
    search: ANTHROPIC_SEARCH,
    toolOverheadTokens: 346,
    webSearchToolType: SEARCH_TOOL_BASIC,
    supportsAdaptiveThinking: false,
    contextWindow: 200_000,
    speed: "fast",
    quality: "good",
    bestFor: "High-volume runs where throughput matters more than depth",
    tier: "recommended",
  },
  {
    id: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    provider: "anthropic",
    label: "Best balance",
    inputPer1M: 2.0,
    outputPer1M: 10.0,
    search: ANTHROPIC_SEARCH,
    toolOverheadTokens: 346,
    webSearchToolType: SEARCH_TOOL_NEW,
    supportsAdaptiveThinking: true,
    contextWindow: 1_000_000,
    speed: "medium",
    quality: "great",
    bestFor: "Near-Opus quality at Sonnet cost — the default for most datasets",
    tier: "recommended",
    pricingNote: "Promotional rate through 31 Aug 2026, then $3 / $15",
  },
  {
    id: "claude-opus-5",
    name: "Claude Opus 5",
    provider: "anthropic",
    label: "Most capable",
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    search: ANTHROPIC_SEARCH,
    toolOverheadTokens: 346,
    webSearchToolType: SEARCH_TOOL_NEW,
    supportsAdaptiveThinking: true,
    contextWindow: 1_000_000,
    speed: "slow",
    quality: "best",
    bestFor: "Hard research where a wrong answer costs more than a few cents",
    tier: "recommended",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "anthropic",
    label: "Previous flagship",
    inputPer1M: 5.0,
    outputPer1M: 25.0,
    search: ANTHROPIC_SEARCH,
    toolOverheadTokens: 346,
    webSearchToolType: SEARCH_TOOL_NEW,
    supportsAdaptiveThinking: true,
    contextWindow: 1_000_000,
    speed: "slow",
    quality: "best",
    bestFor: "Pin this if you have already validated a run against Opus 4.8",
    tier: "standard",
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    label: "Previous Sonnet",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    search: ANTHROPIC_SEARCH,
    toolOverheadTokens: 346,
    webSearchToolType: SEARCH_TOOL_NEW,
    supportsAdaptiveThinking: true,
    contextWindow: 1_000_000,
    speed: "medium",
    quality: "great",
    bestFor: "Reproducing an earlier run byte-for-byte",
    tier: "legacy",
  },
];

/* ------------------------------------------------------------------ */
/*  Google Gemini                                                      */
/* ------------------------------------------------------------------ */

// Gemini 3.x: 5,000 free grounded searches/month, then $14 per 1,000.
const GEMINI_3_SEARCH = { per1K: 14, freeRequests: 5000, freeWindow: "month" as const };
// Gemini 2.5: 1,500 free grounded searches/day, then $35 per 1,000.
const GEMINI_25_SEARCH = { per1K: 35, freeRequests: 1500, freeWindow: "day" as const };

const GEMINI: ModelConfig[] = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash-Lite",
    provider: "gemini",
    label: "Cheapest with search",
    inputPer1M: 0.25,
    outputPer1M: 1.5,
    search: GEMINI_3_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "good",
    bestFor: "Large simple lookups — the lowest cost per row of any model here",
    tier: "recommended",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "gemini",
    label: "Best value",
    inputPer1M: 0.5,
    outputPer1M: 3.0,
    search: GEMINI_3_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "great",
    bestFor: "Strong quality at a fraction of flagship cost — great default",
    tier: "recommended",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "gemini",
    label: "Most capable",
    inputPer1M: 2.0,
    outputPer1M: 12.0,
    search: GEMINI_3_SEARCH,
    contextWindow: 1_000_000,
    speed: "medium",
    quality: "best",
    bestFor: "Google's strongest reasoning with live search grounding",
    tier: "recommended",
  },
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "gemini",
    label: "Newest Flash",
    inputPer1M: 1.5,
    outputPer1M: 7.5,
    search: GEMINI_3_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "great",
    bestFor: "Latest Flash generation, cheaper output than 3.5 Flash",
    tier: "standard",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "gemini",
    label: "Stable Flash",
    inputPer1M: 1.5,
    outputPer1M: 9.0,
    search: GEMINI_3_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "great",
    bestFor: "Generally available Flash — no preview caveats",
    tier: "standard",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash-Lite",
    provider: "gemini",
    label: "Low cost",
    inputPer1M: 0.3,
    outputPer1M: 2.5,
    search: GEMINI_3_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "good",
    bestFor: "Stable low-cost tier when you want GA over preview",
    tier: "standard",
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    provider: "gemini",
    label: "Legacy budget",
    inputPer1M: 0.1,
    outputPer1M: 0.4,
    search: GEMINI_25_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "good",
    bestFor: "Lowest token price, but search costs 2.5x the 3.x models",
    tier: "legacy",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    label: "Legacy",
    inputPer1M: 0.3,
    outputPer1M: 2.5,
    search: GEMINI_25_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "good",
    bestFor: "Reproducing an earlier 2.5-era run",
    tier: "legacy",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    label: "Legacy flagship",
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    search: GEMINI_25_SEARCH,
    contextWindow: 1_000_000,
    speed: "medium",
    quality: "great",
    bestFor: "Reproducing an earlier 2.5-era run",
    tier: "legacy",
  },
];

/* ------------------------------------------------------------------ */
/*  xAI Grok                                                           */
/* ------------------------------------------------------------------ */

// xAI does not publish a per-search rate for the server-side Web Search tool.
// $5/1K is our working estimate; the UI labels it as unverified so nobody
// mistakes it for a quoted price.
const GROK_SEARCH = { per1K: 5, estimated: true };

const GROK: ModelConfig[] = [
  {
    id: "grok-4.3",
    name: "Grok 4.3",
    provider: "grok",
    label: "Best value",
    inputPer1M: 1.25,
    outputPer1M: 2.5,
    search: GROK_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "great",
    bestFor: "Cheapest output tokens of any flagship-class model here",
    tier: "recommended",
  },
  {
    id: "grok-4.5",
    name: "Grok 4.5",
    provider: "grok",
    label: "Most capable",
    inputPer1M: 2.0,
    outputPer1M: 6.0,
    search: GROK_SEARCH,
    contextWindow: 500_000,
    speed: "medium",
    quality: "best",
    bestFor: "xAI's strongest model, with live X and web search",
    tier: "recommended",
  },
  {
    id: "grok-4.20-0309-non-reasoning",
    name: "Grok 4.20 (fast)",
    provider: "grok",
    label: "No reasoning",
    inputPer1M: 1.25,
    outputPer1M: 2.5,
    search: GROK_SEARCH,
    contextWindow: 1_000_000,
    speed: "fast",
    quality: "good",
    bestFor: "Skips reasoning for lower latency on simple extractions",
    tier: "standard",
  },
  {
    id: "grok-4.20-0309-reasoning",
    name: "Grok 4.20 (reasoning)",
    provider: "grok",
    label: "Reasoning",
    inputPer1M: 1.25,
    outputPer1M: 2.5,
    search: GROK_SEARCH,
    contextWindow: 1_000_000,
    speed: "medium",
    quality: "great",
    bestFor: "Same price as non-reasoning, with step-by-step inference",
    tier: "standard",
  },
  {
    id: "grok-build-0.1",
    name: "Grok Build 0.1",
    provider: "grok",
    label: "Lowest price",
    inputPer1M: 1.0,
    outputPer1M: 2.0,
    search: GROK_SEARCH,
    contextWindow: 256_000,
    speed: "fast",
    quality: "good",
    bestFor: "Cheapest xAI option; smaller context window",
    tier: "standard",
  },
];

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

export const ALL_MODELS: ModelConfig[] = [...ANTHROPIC, ...GEMINI, ...GROK];

export const MODELS_BY_PROVIDER: Record<Provider, ModelConfig[]> = {
  anthropic: ANTHROPIC,
  gemini: GEMINI,
  grok: GROK,
};

const MODEL_INDEX = new Map(ALL_MODELS.map((m) => [m.id, m]));

export function getModel(id: string): ModelConfig | undefined {
  return MODEL_INDEX.get(id);
}

/** Throws on unknown ids — callers downstream of the picker can rely on this. */
export function requireModel(id: string): ModelConfig {
  const m = MODEL_INDEX.get(id);
  if (!m) throw new Error(`Unknown model: ${id}`);
  return m;
}

/** The model we preselect when a user switches to a provider. */
export function defaultModelFor(provider: Provider): ModelConfig {
  const models = MODELS_BY_PROVIDER[provider];
  return models.find((m) => m.tier === "recommended") ?? models[0];
}

export function isValidModelFor(provider: Provider, id: string): boolean {
  return MODELS_BY_PROVIDER[provider].some((m) => m.id === id);
}

/**
 * Free-text filter across name, id, label and positioning copy, so users can
 * type "cheap", "flash" or "opus" and land somewhere sensible.
 */
export function searchModels(models: ModelConfig[], query: string): ModelConfig[] {
  const q = query.trim().toLowerCase();
  if (!q) return models;
  return models.filter((m) =>
    `${m.name} ${m.id} ${m.label} ${m.bestFor} ${m.speed} ${m.quality}`.toLowerCase().includes(q)
  );
}
