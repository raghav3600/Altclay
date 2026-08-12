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

import type { CustomEndpoint, ModelConfig, Provider } from "./types";

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
  openai: {
    name: "GPT",
    company: "OpenAI",
    keyPrefix: "sk-",
    keyUrl: "https://platform.openai.com/api-keys",
    pricingUrl: "https://developers.openai.com/api/docs/pricing",
    docsLabel: "OpenAI Platform",
  },
  custom: {
    name: "Custom",
    company: "Custom",
    keyPrefix: "",
    keyUrl: "https://openclay.io/docs/custom-endpoint",
    pricingUrl: "https://openclay.io/docs/custom-endpoint",
    docsLabel: "the setup guide",
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
    rank: 5,
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
    bestFor: "Near-Opus quality at Sonnet cost, the default for most datasets",
    tier: "recommended",
    rank: 3,
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
    rank: 1,
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
    rank: 2,
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
    rank: 4,
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
    bestFor: "Large simple lookups, the lowest cost per row of any model here",
    tier: "recommended",
    rank: 6,
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
    bestFor: "Strong quality at a fraction of flagship cost, great default",
    tier: "recommended",
    rank: 4,
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
    rank: 1,
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
    rank: 2,
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
    bestFor: "Generally available Flash, no preview caveats",
    tier: "standard",
    rank: 3,
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
    rank: 5,
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
    rank: 9,
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
    rank: 8,
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
    rank: 7,
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
    rank: 2,
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
    rank: 1,
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
    rank: 4,
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
    rank: 3,
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
    rank: 5,
  },
];

/* ------------------------------------------------------------------ */
/*  OpenAI                                                             */
/* ------------------------------------------------------------------ */

// $10 per 1,000 web_search calls, plus the search content itself billed as
// input tokens at the model's rate. OpenAI documents roughly 8k tokens per
// search, for a 250-token enrichment prompt that overhead *is* the cost, so
// it is priced in explicitly rather than left to a guessed multiplier.
const OPENAI_SEARCH = { per1K: 10, tokenOverheadPerSearch: 8000 };

// Only the reasoning-capable GPT-5 family is listed. Non-reasoning models
// (gpt-4o, gpt-4.1) fall on a different, pricier search tier ($25/1k calls),
// and they are worse at open-web research than anything below, including
// them would mean quoting a search rate that doesn't apply to most rows.
const OPENAI: ModelConfig[] = [
  {
    id: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    provider: "openai",
    label: "Best value",
    inputPer1M: 0.2,
    outputPer1M: 1.2,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "fast",
    quality: "great",
    bestFor: "Newest small model, the cheapest sensible default for OpenAI",
    tier: "recommended",
    rank: 3,
  },
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    label: "Cheap & proven",
    inputPer1M: 0.25,
    outputPer1M: 2.0,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "fast",
    quality: "good",
    bestFor: "Well-understood workhorse for high-volume simple lookups",
    tier: "recommended",
    rank: 8,
  },
  {
    id: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    provider: "openai",
    label: "Most capable",
    inputPer1M: 2.0,
    outputPer1M: 12.0,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "medium",
    quality: "best",
    bestFor: "Strong reasoning for research that needs judgement, not just lookup",
    tier: "recommended",
    rank: 2,
  },
  {
    id: "gpt-5-nano",
    name: "GPT-5 Nano",
    provider: "openai",
    label: "Lowest token price",
    inputPer1M: 0.05,
    outputPer1M: 0.4,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "fast",
    quality: "good",
    bestFor: "Cheapest tokens anywhere here, but the weakest at open-web research",
    tier: "standard",
    rank: 9,
  },
  {
    id: "gpt-5.4-mini",
    name: "GPT-5.4 Mini",
    provider: "openai",
    label: "Mid-tier",
    inputPer1M: 0.75,
    outputPer1M: 4.5,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "fast",
    quality: "great",
    bestFor: "Step up from Mini when answers need a little more care",
    tier: "standard",
    rank: 5,
  },
  {
    id: "gpt-5.1",
    name: "GPT-5.1",
    provider: "openai",
    label: "Stable flagship",
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "medium",
    quality: "great",
    bestFor: "Mature flagship if you'd rather not run a newer release",
    tier: "standard",
    rank: 6,
  },
  {
    id: "gpt-5.4",
    name: "GPT-5.4",
    provider: "openai",
    label: "Previous flagship",
    inputPer1M: 2.5,
    outputPer1M: 15.0,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "medium",
    quality: "best",
    bestFor: "Pin this to reproduce a run already validated on GPT-5.4",
    tier: "standard",
    rank: 4,
  },
  {
    id: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    provider: "openai",
    label: "Top of the line",
    inputPer1M: 5.0,
    outputPer1M: 30.0,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "slow",
    quality: "best",
    bestFor: "Hardest research questions; expensive per row, so test first",
    tier: "standard",
    rank: 1,
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    label: "Legacy",
    inputPer1M: 1.25,
    outputPer1M: 10.0,
    search: OPENAI_SEARCH,
    supportsReasoningEffort: true,
    contextWindow: 400_000,
    speed: "medium",
    quality: "great",
    bestFor: "Original GPT-5, kept for reproducibility",
    tier: "legacy",
    rank: 7,
  },
];

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

export const ALL_MODELS: ModelConfig[] = [...ANTHROPIC, ...GEMINI, ...GROK, ...OPENAI];

export const MODELS_BY_PROVIDER: Record<Provider, ModelConfig[]> = {
  anthropic: ANTHROPIC,
  gemini: GEMINI,
  grok: GROK,
  openai: OPENAI,
  // Configured at run time by the user, so there is nothing to list here.
  custom: [],
};

/** Tab order in the picker: cheapest-to-get-started first. */
export const PROVIDER_ORDER: Provider[] = ["gemini", "openai", "anthropic", "grok", "custom"];

/** Providers whose models ship in the catalog. */
export const CATALOG_PROVIDERS: Provider[] = ["gemini", "openai", "anthropic", "grok"];

export const DEFAULT_CUSTOM_ENDPOINT: CustomEndpoint = {
  baseUrl: "",
  modelId: "",
  inputPer1M: 0,
  outputPer1M: 0,
  supportsSearch: false,
};

/**
 * Present a user-configured endpoint as a ModelConfig so the estimator, picker
 * and run loop don't need a special case for it.
 */
export function buildCustomModel(cfg: CustomEndpoint): ModelConfig {
  return {
    id: cfg.modelId || "custom-model",
    name: cfg.modelId || "Custom model",
    provider: "custom",
    label: "Your endpoint",
    inputPer1M: cfg.inputPer1M,
    outputPer1M: cfg.outputPer1M,
    // Only priced if the user told us the rates; otherwise the UI says so
    // rather than quoting a confident $0.00.
    search: cfg.supportsSearch ? { per1K: 0, estimated: true } : null,
    contextWindow: 128_000,
    speed: "medium",
    quality: "great",
    bestFor: "An OpenAI-compatible endpoint you control",
    tier: "recommended",
    // Only ever one custom model at a time, so the rank is nominal.
    rank: 1,
  };
}

/** True when we have enough to actually send a request. */
export function isCustomEndpointReady(cfg: CustomEndpoint): boolean {
  return cfg.baseUrl.trim().length > 0 && cfg.modelId.trim().length > 0;
}

const MODEL_INDEX = new Map(ALL_MODELS.map((m) => [m.id, m]));

export function getModel(id: string): ModelConfig | undefined {
  return MODEL_INDEX.get(id);
}

/** Throws on unknown ids, callers downstream of the picker can rely on this. */
export function requireModel(id: string): ModelConfig {
  const m = MODEL_INDEX.get(id);
  if (!m) throw new Error(`Unknown model: ${id}`);
  return m;
}

/**
 * The model preselected when a user switches provider.
 *
 * Deliberately the best-value recommended model rather than the top-ranked one:
 * this is a bring-your-own-key tool, and opening on the most expensive option
 * would quietly cost people money on their first run. Lists are ordered by
 * capability; the default optimises for a cheap, representative first test.
 */
export function defaultModelFor(provider: Provider): ModelConfig {
  const models = MODELS_BY_PROVIDER[provider];
  const recommended = models.filter((m) => m.tier === "recommended");
  const pool = recommended.length > 0 ? recommended : models;
  // A local price proxy rather than importing costPerThousandRows: the cost
  // estimator imports this module, and a cycle here would be fragile for the
  // sake of picking a default.
  const priceProxy = (m: ModelConfig) =>
    m.inputPer1M + m.outputPer1M + (m.search ? m.search.per1K : 0);
  return [...pool].sort((a, b) => priceProxy(a) - priceProxy(b))[0];
}

export function isValidModelFor(provider: Provider, id: string): boolean {
  return MODELS_BY_PROVIDER[provider].some((m) => m.id === id);
}

/**
 * Best model first, within a provider.
 *
 * This is the default order everywhere a model list is shown. Sorting by price
 * put the weakest model at the top of every picker, which is the opposite of
 * what someone choosing a model wants to see first.
 */
export function sortByCapability(models: ModelConfig[]): ModelConfig[] {
  return [...models].sort((a, b) => a.rank - b.rank);
}

/** Across providers: group by provider order, best model first inside each. */
export function sortByProviderThenCapability(models: ModelConfig[]): ModelConfig[] {
  return [...models].sort(
    (a, b) =>
      PROVIDER_ORDER.indexOf(a.provider) - PROVIDER_ORDER.indexOf(b.provider) || a.rank - b.rank
  );
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
