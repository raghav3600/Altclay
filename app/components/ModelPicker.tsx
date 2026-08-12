"use client";

import { useMemo, useState } from "react";
import type { CustomEndpoint, ModelConfig, Provider } from "@/lib/types";
import {
  MODELS_BY_PROVIDER,
  PROVIDER_META,
  PROVIDER_ORDER,
  searchModels,
  sortByCapability,
} from "@/lib/pricing";
import { checkEndpointUrl } from "@/lib/customEndpoint";
import { costPerThousandRows as modelCostPerThousandRows } from "@/lib/costEstimator";
import { ProviderLogo, SearchIcon, CheckIcon } from "./icons";

/*
 * Providers ship dozens of models and the list keeps growing, so showing all of
 * them flat is unusable. Three things keep it navigable:
 *
 *   1. Curation, each model carries a tier, and only "recommended" shows up
 *      front. Everything else is one click away, never gone.
 *   2. Search, free-text across name, id, price positioning and best-for copy,
 *      so "cheap", "flash" and "opus" all land somewhere sensible.
 *   3. Sorted by cost, within a tier the cheapest model is first, because
 *      "what will this cost me" is the question users actually arrive with.
 */

const QUALITY_LABEL: Record<ModelConfig["quality"], string> = {
  good: "Good",
  great: "Great",
  best: "Best",
};

/*
 * Only badge speed when it is actually a reason to pick or avoid a model.
 * A neutral "Fast" chip on a card whose neighbour says "Medium" in the same
 * grey carries no signal, it is just another word to read. Fast earns a
 * positive tone, Slow earns a warning, Medium says nothing and is omitted.
 */
function speedChip(speed: ModelConfig["speed"]) {
  if (speed === "fast") return { label: "Fast", tone: "data" as const };
  if (speed === "slow") return { label: "Slow", tone: "warn" as const };
  return null;
}

/** Per-1k-rows figure used both to label and to rank models. */
function costPerThousandRows(model: ModelConfig): number {
  return modelCostPerThousandRows(model.id);
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "data" | "accent" | "warn";
}) {
  const tones = {
    neutral: "border-line text-ink-3",
    data: "border-data-line text-data",
    accent: "border-accent-line text-accent",
    warn: "border-warn-line text-warn",
  };
  return (
    <span
      className={`rounded border px-1.5 py-px font-mono text-[10px] tracking-tight ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function ModelRow({
  model,
  selected,
  onSelect,
}: {
  model: ModelConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  const speed = speedChip(model.speed);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative w-full border-l-2 px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-l-accent bg-accent-soft"
          : "border-l-transparent hover:border-l-line-strong hover:bg-surface-2"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className={`truncate text-sm font-medium ${selected ? "text-ink" : "text-ink"}`}>
            {model.name}
          </span>
          {selected && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-accent" />}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-ink-2 tnum">
          ${model.inputPer1M} / ${model.outputPer1M}
          <span className="text-ink-3"> per 1M</span>
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Chip tone="accent">{model.label}</Chip>
        {speed && <Chip tone={speed.tone}>{speed.label}</Chip>}
        <Chip tone="data">{QUALITY_LABEL[model.quality]}</Chip>
        {/* Every listed model searches, so only the exception is worth a badge. */}
        {!model.search && <Chip tone="warn">No search</Chip>}
        <span className="ml-auto font-mono text-[10px] text-ink-3 tnum">
          ~${costPerThousandRows(model).toFixed(2)}/1k rows
        </span>
      </div>

      {/* Rationale only for the current pick, nine of these at once is a wall. */}
      {selected && <p className="mt-1.5 text-[11px] leading-snug text-ink-2">{model.bestFor}</p>}

      {model.pricingNote && (
        <p className="mt-1 font-mono text-[10px] text-warn">{model.pricingNote}</p>
      )}
    </button>
  );
}

/** Known-good presets so nobody has to hunt for a base URL. */
const ENDPOINT_PRESETS: { label: string; baseUrl: string; modelId: string; note: string }[] = [
  { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", modelId: "openai/gpt-5-mini", note: "One key, hundreds of models" },
  { label: "Groq", baseUrl: "https://api.groq.com/openai/v1", modelId: "llama-3.3-70b-versatile", note: "Very fast inference" },
  { label: "Together", baseUrl: "https://api.together.xyz/v1", modelId: "meta-llama/Llama-3.3-70B-Instruct-Turbo", note: "Open models" },
  { label: "Ollama (local)", baseUrl: "http://localhost:11434/v1", modelId: "llama3.2", note: "Self-host only" },
];

function CustomEndpointForm({
  value,
  onChange,
}: {
  value: CustomEndpoint;
  onChange: (next: CustomEndpoint) => void;
}) {
  const set = <K extends keyof CustomEndpoint>(key: K, v: CustomEndpoint[K]) =>
    onChange({ ...value, [key]: v });

  // Client-side check mirrors the server's, so bad URLs are caught before a request.
  const urlCheck = value.baseUrl.trim() ? checkEndpointUrl(value.baseUrl, true) : null;
  const looksPrivate =
    /localhost|127\.0\.0\.1|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\./.test(value.baseUrl);

  const field = "w-full rounded border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none";

  return (
    <div className="mt-3 space-y-3 rounded border border-line bg-surface p-3">
      <p className="text-[11px] leading-snug text-ink-2">
        Any endpoint that speaks the OpenAI <code className="font-mono text-ink">/chat/completions</code>{" "}
        API, Azure, OpenRouter, Groq, Together, Fireworks, vLLM, Ollama, LM Studio.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {ENDPOINT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange({ ...value, baseUrl: preset.baseUrl, modelId: preset.modelId })}
            title={preset.note}
            className="rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="custom-base-url" className="eyebrow">
          Base URL
        </label>
        <input
          id="custom-base-url"
          value={value.baseUrl}
          onChange={(e) => set("baseUrl", e.target.value)}
          placeholder="https://api.example.com/v1"
          spellCheck={false}
          className={`mt-1 ${field}`}
        />
        {urlCheck && !urlCheck.ok && (
          <p className="mt-1 font-mono text-[10px] text-danger">{urlCheck.error}</p>
        )}
        {looksPrivate && (
          <p className="mt-1 font-mono text-[10px] text-warn">
            Local address, only reachable from a self-hosted OpenClay with
            OPENCLAY_ALLOW_PRIVATE_ENDPOINTS=true.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="custom-model-id" className="eyebrow">
          Model ID
        </label>
        <input
          id="custom-model-id"
          value={value.modelId}
          onChange={(e) => set("modelId", e.target.value)}
          placeholder="gpt-5-mini"
          spellCheck={false}
          className={`mt-1 ${field}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="custom-in-price" className="eyebrow">
            $ / 1M input
          </label>
          <input
            id="custom-in-price"
            type="number"
            min={0}
            step="0.01"
            value={value.inputPer1M || ""}
            onChange={(e) => set("inputPer1M", Math.max(0, Number(e.target.value) || 0))}
            placeholder="0.00"
            className={`mt-1 ${field}`}
          />
        </div>
        <div>
          <label htmlFor="custom-out-price" className="eyebrow">
            $ / 1M output
          </label>
          <input
            id="custom-out-price"
            type="number"
            min={0}
            step="0.01"
            value={value.outputPer1M || ""}
            onChange={(e) => set("outputPer1M", Math.max(0, Number(e.target.value) || 0))}
            placeholder="0.00"
            className={`mt-1 ${field}`}
          />
        </div>
      </div>
      <p className="font-mono text-[10px] text-ink-3">
        Optional. Leave at 0 and OpenClay reports token counts without guessing a price.
      </p>
    </div>
  );
}

export function ModelPicker({
  provider,
  modelId,
  customEndpoint,
  onProviderChange,
  onModelChange,
  onCustomChange,
}: {
  provider: Provider;
  modelId: string;
  customEndpoint: CustomEndpoint;
  onProviderChange: (p: Provider) => void;
  onModelChange: (id: string) => void;
  onCustomChange: (next: CustomEndpoint) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const all = MODELS_BY_PROVIDER[provider];

  const { visible, hiddenCount } = useMemo(() => {
    const matched = searchModels(all, query);
    // Most capable first: a picker should open on the best option, not the cheapest.
    const ordered = sortByCapability(matched);

    // A search should look at everything; the tier filter is only for the
    // default, unsearched view.
    if (query.trim() || showAll) return { visible: ordered, hiddenCount: 0 };

    const recommended = ordered.filter((m) => m.tier === "recommended");
    return {
      visible: recommended.length > 0 ? recommended : ordered,
      hiddenCount: Math.max(0, ordered.length - recommended.length),
    };
  }, [all, query, showAll]);

  return (
    <div>
      {/* Provider tabs */}
      <div
        role="tablist"
        aria-label="AI provider"
        className="grid grid-cols-2 overflow-hidden rounded border border-line sm:grid-cols-5"
      >
        {PROVIDER_ORDER.map((p, i) => {
          const active = provider === p;
          const meta = PROVIDER_META[p];
          return (
            <button
              key={p}
              role="tab"
              aria-selected={active}
              onClick={() => onProviderChange(p)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                i % 2 === 1 ? "border-l border-line" : ""
              } ${i >= 2 ? "border-t border-line sm:border-t-0" : ""} ${
                i > 0 ? "sm:border-l sm:border-line" : "sm:border-l-0"
              } ${
                active
                  ? "bg-ink text-paper"
                  : "bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <ProviderLogo provider={p} className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{meta.company}</span>
              <span className="sm:hidden">{meta.name}</span>
            </button>
          );
        })}
      </div>

      {provider === "custom" ? (
        <CustomEndpointForm value={customEndpoint} onChange={onCustomChange} />
      ) : (
        <>
      {/* Search, only earns its place once the list is long enough to scan */}
      {all.length > 5 && (
        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${all.length} models`}
            className="w-full rounded border border-line bg-surface py-2 pl-8 pr-3 font-mono text-[11px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
          />
        </div>
      )}

      {/* Model list */}
      <div className="mt-3 divide-y divide-line overflow-hidden rounded border border-line bg-surface">
        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-ink-3">
            No {PROVIDER_META[provider].name} model matches “{query}”.
          </p>
        ) : (
          visible.map((m) => (
            <ModelRow
              key={m.id}
              model={m}
              selected={m.id === modelId}
              onSelect={() => onModelChange(m.id)}
            />
          ))
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        {hiddenCount > 0 ? (
          <button
            onClick={() => setShowAll(true)}
            className="font-mono text-[11px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-accent"
          >
            Show {hiddenCount} more {PROVIDER_META[provider].name} model
            {hiddenCount === 1 ? "" : "s"}
          </button>
        ) : showAll && !query.trim() ? (
          <button
            onClick={() => setShowAll(false)}
            className="font-mono text-[11px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-accent"
          >
            Show recommended only
          </button>
        ) : (
          <span />
        )}
        <span className="font-mono text-[10px] text-ink-3">
          {visible.length} of {all.length} shown
        </span>
      </div>
        </>
      )}
    </div>
  );
}
