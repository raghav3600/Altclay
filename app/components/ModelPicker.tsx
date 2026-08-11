"use client";

import { useMemo, useState } from "react";
import type { ModelConfig, Provider } from "@/lib/types";
import { MODELS_BY_PROVIDER, PROVIDER_META, PROVIDER_ORDER, searchModels } from "@/lib/pricing";
import { costPerThousandRows as modelCostPerThousandRows } from "@/lib/costEstimator";
import { ProviderLogo, SearchIcon, CheckIcon, GlobeIcon } from "./icons";

/*
 * Providers ship dozens of models and the list keeps growing, so showing all of
 * them flat is unusable. Three things keep it navigable:
 *
 *   1. Curation — each model carries a tier, and only "recommended" shows up
 *      front. Everything else is one click away, never gone.
 *   2. Search — free-text across name, id, price positioning and best-for copy,
 *      so "cheap", "flash" and "opus" all land somewhere sensible.
 *   3. Sorted by cost — within a tier the cheapest model is first, because
 *      "what will this cost me" is the question users actually arrive with.
 */

const SPEED_LABEL: Record<ModelConfig["speed"], string> = {
  fast: "Fast",
  medium: "Medium",
  slow: "Slow",
};

const QUALITY_LABEL: Record<ModelConfig["quality"], string> = {
  good: "Good",
  great: "Great",
  best: "Best",
};

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
        <Chip>{SPEED_LABEL[model.speed]}</Chip>
        <Chip tone="data">{QUALITY_LABEL[model.quality]}</Chip>
        {model.search ? (
          <Chip tone="data">
            <GlobeIcon className="mr-0.5 inline h-2.5 w-2.5 align-[-1px]" />
            Search
          </Chip>
        ) : (
          <Chip tone="warn">No search</Chip>
        )}
        <span className="ml-auto font-mono text-[10px] text-ink-3 tnum">
          ~${costPerThousandRows(model).toFixed(2)}/1k rows
        </span>
      </div>

      <p className="mt-1.5 text-[11px] leading-snug text-ink-2">{model.bestFor}</p>

      {model.pricingNote && (
        <p className="mt-1 font-mono text-[10px] text-warn">{model.pricingNote}</p>
      )}

      <p className="mt-1 font-mono text-[10px] text-ink-3">{model.id}</p>
    </button>
  );
}

export function ModelPicker({
  provider,
  modelId,
  onProviderChange,
  onModelChange,
}: {
  provider: Provider;
  modelId: string;
  onProviderChange: (p: Provider) => void;
  onModelChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const all = MODELS_BY_PROVIDER[provider];

  const { visible, hiddenCount } = useMemo(() => {
    const matched = searchModels(all, query);
    const byCost = [...matched].sort((a, b) => costPerThousandRows(a) - costPerThousandRows(b));

    // A search should look at everything; the tier filter is only for the
    // default, unsearched view.
    if (query.trim() || showAll) return { visible: byCost, hiddenCount: 0 };

    const recommended = byCost.filter((m) => m.tier === "recommended");
    return {
      visible: recommended.length > 0 ? recommended : byCost,
      hiddenCount: Math.max(0, byCost.length - recommended.length),
    };
  }, [all, query, showAll]);

  return (
    <div>
      {/* Provider tabs */}
      <div
        role="tablist"
        aria-label="AI provider"
        className="grid grid-cols-2 overflow-hidden rounded border border-line sm:grid-cols-4"
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
              className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${i % 2 === 1 ? "border-l border-line" : ""} ${
                i >= 2 ? "border-t border-line sm:border-t-0" : ""
              } ${
                i === 2 ? "sm:border-l sm:border-line" : ""
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

      {/* Search — only earns its place once the list is long enough to scan */}
      {all.length > 5 && (
        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${all.length} ${PROVIDER_META[provider].name} models — try "cheap" or "fast"`}
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
    </div>
  );
}
