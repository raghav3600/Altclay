"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import type {
  Provider,
  OutputColumn,
  ParsedFile,
  EnrichmentResult,
  CostEstimate,
  RunStats,
} from "@/lib/types";
import { emptyRunStats } from "@/lib/types";
import {
  PROVIDER_META,
  PRICING_LAST_UPDATED,
  defaultModelFor,
  requireModel,
  isValidModelFor,
} from "@/lib/pricing";
import { buildPrompt, buildPromptTemplate, validateTemplate } from "@/lib/promptTemplates";
import {
  estimateInputTokensPerRow,
  estimateOutputTokensPerRow,
  calculateCostRange,
  calculateCostFromActualTokens,
  calculateActualSpend,
} from "@/lib/costEstimator";
import { parseFile, exportToFile } from "@/lib/fileParser";
import { enrichRowWithRetry, validateApiKey } from "@/lib/enrichClient";
import {
  TokenRateTracker,
  countMissingCells,
  estimateRemainingMs,
  formatDuration,
  formatFinishTime,
  formatTokens,
  formatUSD,
  formatUSDRange,
} from "@/lib/runStats";
import { ModelPicker } from "@/app/components/ModelPicker";
import {
  ProviderLogo,
  CheckIcon,
  LockIcon,
  UploadIcon,
  CloseIcon,
  PlusIcon,
  DownloadIcon,
  RefreshIcon,
  TrashIcon,
  GlobeIcon,
  InfoIcon,
  AlertIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  LinkedInIcon,
} from "@/app/components/icons";

/** CLAUDE.md: users always test 5 rows before committing to the full batch. */
const TEST_ROW_COUNT = 5;
const DEFAULT_CONCURRENCY = 3;
const MAX_CONCURRENCY = 12;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

function Panel({
  children,
  className = "",
  muted = false,
  active = false,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
  active?: boolean;
}) {
  return (
    <section
      aria-disabled={muted || undefined}
      className={`rounded border bg-surface transition-opacity ${
        active ? "border-line-strong" : "border-line"
      } ${muted ? "pointer-events-none opacity-45" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

function StepHeader({
  num,
  title,
  hint,
  done,
  active,
  aside,
}: {
  num: number;
  title: string;
  hint?: string;
  done: boolean;
  active: boolean;
  aside?: React.ReactNode;
}) {
  return (
    <header className="flex items-start gap-3 border-b border-line px-4 py-3">
      <span
        aria-hidden="true"
        className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-sm font-mono text-[10px] font-bold ${
          done
            ? "bg-data text-paper"
            : active
              ? "bg-accent text-on-accent"
              : "border border-line text-ink-3"
        }`}
      >
        {done ? <CheckIcon className="h-3 w-3" /> : num}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-[11px] leading-snug text-ink-2">{hint}</p>}
      </div>
      {aside}
    </header>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex align-middle">
      <InfoIcon className="h-3.5 w-3.5 cursor-help text-ink-3" />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded border border-line-strong bg-ink px-2.5 py-1.5 text-[11px] leading-snug text-paper opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

function Callout({
  tone,
  children,
  icon,
}: {
  tone: "data" | "warn" | "danger" | "neutral";
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const tones = {
    data: "border-data-line bg-data-soft text-data",
    warn: "border-warn-line bg-warn-soft text-warn",
    danger: "border-danger-line bg-danger-soft text-danger",
    neutral: "border-line bg-surface-2 text-ink-2",
  };
  return (
    <div className={`flex items-start gap-2 rounded border px-2.5 py-2 text-[11px] leading-snug ${tones[tone]}`}>
      {icon && <span className="mt-px shrink-0">{icon}</span>}
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "ink",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "ink" | "accent" | "data" | "warn";
}) {
  const tones = { ink: "text-ink", accent: "text-accent", data: "text-data", warn: "text-warn" };
  return (
    <div className="border-l border-line px-2.5 py-1.5 first:border-l-0 first:pl-0">
      <div className="eyebrow">{label}</div>
      <div className={`mt-0.5 font-mono text-[13px] font-semibold tnum ${tones[tone]}`}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-ink-3 tnum">{sub}</div>}
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary: "bg-accent text-on-accent hover:bg-accent-hover border-transparent",
    secondary: "bg-surface text-ink border-line-strong hover:bg-surface-2",
    danger: "bg-surface text-danger border-danger-line hover:bg-danger-soft",
    ghost: "bg-transparent text-ink-2 border-transparent hover:text-ink hover:bg-surface-2",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Column heuristics                                                  */
/* ------------------------------------------------------------------ */

const SMART_COLUMN_PATTERNS = [
  /^(company|organization|org|business|brand)[\s_-]*(name)?$/i,
  /^(domain|website|url|site|web)[\s_-]*(name|url)?$/i,
  /^(name|full[\s_-]*name|person[\s_-]*name)$/i,
  /^(email|e-mail)[\s_-]*(address)?$/i,
  /^(linkedin|twitter|x|github)[\s_-]*(url|link|profile)?$/i,
  /^(ticker|symbol|stock)[\s_-]*(symbol)?$/i,
  /^(university|school|college|institution)[\s_-]*(name)?$/i,
  /^(country|city|state|location|address)$/i,
  /^(product|app|service|tool)[\s_-]*(name)?$/i,
];

function detectSmartColumns(columns: string[]): string[] {
  const matches = columns.filter((c) => SMART_COLUMN_PATTERNS.some((p) => p.test(c.trim())));
  return matches.length > 0 ? matches : columns.length > 0 ? [columns[0]] : [];
}

function detectOutputColumns(description: string): OutputColumn[] {
  if (!description.trim()) return [];
  const cleaned = description
    .replace(/find\s+(out\s+)?(the\s+)?/gi, "")
    .replace(/get\s+(me\s+)?(the\s+)?/gi, "")
    .replace(/look\s+up\s+(the\s+)?/gi, "")
    .replace(/research\s+(the\s+)?/gi, "")
    .replace(/for\s+each\s+\w+/gi, "")
    .replace(/of\s+each\s+\w+/gi, "")
    .replace(/for\s+every\s+\w+/gi, "")
    .replace(/per\s+\w+/gi, "")
    .trim();

  const parts = cleaned
    .split(/,\s*|\s+and\s+/i)
    // "A, B, and C" splits on the comma first, leaving "and C" — strip the
    // conjunction before the article, or you get a column called
    // "and employee count" and a JSON key of `and_employee_count`.
    .map((p) =>
      p
        .replace(/^(and|or|plus|&)\s+/i, "")
        .replace(/^(the|their|its|a|an)\s+/i, "")
        .trim()
    )
    .filter((p) => p.length > 1 && p.length < 60 && !p.includes("."));

  return parts
    .map((label) => ({
      key: label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      label,
    }))
    .filter((c) => c.key.length > 0);
}

const TEMPLATES = [
  {
    label: "Company research",
    description: "Find the CEO name, total funding raised, employee count, and a brief company description",
  },
  {
    label: "Hiring signals",
    description: "Find the number of open job postings, most common roles being hired, and hiring page URL",
  },
  {
    label: "Recent news",
    description: "Find the most recent news headline, news date, and a brief summary of the article",
  },
  {
    label: "Tech stack",
    description: "Find the primary programming languages, cloud provider, and key technologies used",
  },
  {
    label: "University info",
    description: "Find the university ranking, acceptance rate, annual tuition, and notable alumni",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ToolPage() {
  /* ---- file ---- */
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---- enrichment definition ---- */
  const [description, setDescription] = useState("");
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [outputColumns, setOutputColumns] = useState<OutputColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [columnsAutoSelected, setColumnsAutoSelected] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customTemplate, setCustomTemplate] = useState("");

  /* ---- model ---- */
  const [provider, setProvider] = useState<Provider>("gemini");
  const [modelId, setModelId] = useState<string>(defaultModelFor("gemini").id);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [concurrency, setConcurrency] = useState(DEFAULT_CONCURRENCY);

  /* ---- key ---- */
  const [apiKey, setApiKey] = useState("");
  const [keyValid, setKeyValid] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keyWarning, setKeyWarning] = useState("");

  /* ---- run ---- */
  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<EnrichmentResult[]>([]);
  const [testDone, setTestDone] = useState(false);
  const [fullRunning, setFullRunning] = useState(false);
  const [fullPaused, setFullPaused] = useState(false);
  const [fullResults, setFullResults] = useState<EnrichmentResult[]>([]);
  const [fullDone, setFullDone] = useState(false);
  const [stats, setStats] = useState<RunStats>(emptyRunStats());
  const [throttleNotice, setThrottleNotice] = useState("");
  const [preciseEstimate, setPreciseEstimate] = useState<CostEstimate | null>(null);
  const [tick, setTick] = useState(0);

  const pauseRef = useRef(false);
  const abortRef = useRef({ aborted: false });
  const rateRef = useRef(new TokenRateTracker());

  /* ---- derived ---- */
  const model = useMemo(() => requireModel(modelId), [modelId]);
  const providerMeta = PROVIDER_META[provider];

  const generatedTemplate = useMemo(
    () =>
      inputColumns.length > 0 && outputColumns.length > 0
        ? buildPromptTemplate(inputColumns, outputColumns, description, useWebSearch)
        : "",
    [inputColumns, outputColumns, description, useWebSearch]
  );

  const activeTemplate = advancedMode && customTemplate ? customTemplate : generatedTemplate;

  /** Preview is generated separately from the template — conflating the two was the bug. */
  const previewPrompt = useMemo(
    () =>
      file && file.rows.length > 0 && activeTemplate
        ? buildPrompt(
            inputColumns,
            file.rows[0],
            outputColumns,
            description,
            advancedMode ? customTemplate || undefined : undefined,
            useWebSearch
          )
        : "",
    [file, inputColumns, outputColumns, description, advancedMode, customTemplate, useWebSearch]
  );

  const templateWarnings = useMemo(
    () =>
      advancedMode && customTemplate
        ? validateTemplate(customTemplate, inputColumns, outputColumns)
        : [],
    [advancedMode, customTemplate, inputColumns, outputColumns]
  );
  const templateBlocked = templateWarnings.some((w) => w.level === "error");

  const defineReady =
    !!file && description.trim().length > 0 && inputColumns.length > 0 && outputColumns.length > 0;
  const configReady = defineReady && !templateBlocked && (!advancedMode || customTemplate.trim().length > 0);
  const runReady = configReady && keyValid;

  const completed = fullResults.length;
  const failed = fullResults.filter((r) => !r.success).length;
  const succeeded = completed - failed;
  const totalRows = file?.totalRows ?? 0;

  const costRange = useMemo(() => {
    if (!file || inputColumns.length === 0 || outputColumns.length === 0 || !previewPrompt) return null;
    const inp = estimateInputTokensPerRow(previewPrompt, modelId);
    const out = estimateOutputTokensPerRow(outputColumns);
    return calculateCostRange(file.totalRows, inp, out, modelId, useWebSearch);
  }, [file, inputColumns, outputColumns, previewPrompt, modelId, useWebSearch]);

  const spentSoFar = useMemo(
    () => calculateActualSpend(modelId, stats.inputTokens, stats.outputTokens, succeeded, useWebSearch),
    [modelId, stats.inputTokens, stats.outputTokens, succeeded, useWebSearch]
  );

  const etaMs = useMemo(() => {
    void tick; // recompute on the ticker so the estimate stays live between rows
    if (!fullRunning || fullPaused) return null;
    return estimateRemainingMs(completed, totalRows, stats.startedAt);
  }, [tick, fullRunning, fullPaused, completed, totalRows, stats.startedAt]);

  const smartColumns = useMemo(() => {
    if (!file) return { recommended: [] as string[], other: [] as string[] };
    const rec = detectSmartColumns(file.columns);
    return { recommended: rec, other: file.columns.filter((c) => !rec.includes(c)) };
  }, [file]);

  /* ---- effects ---- */
  useEffect(() => {
    if (file && !columnsAutoSelected) {
      const smart = detectSmartColumns(file.columns);
      if (smart.length > 0) {
        setInputColumns(smart);
        setColumnsAutoSelected(true);
      }
    }
  }, [file, columnsAutoSelected]);

  // Drives the live ETA and the rolling tokens-per-minute readout.
  useEffect(() => {
    if (!fullRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [fullRunning]);

  // Keep the model valid when the provider changes.
  useEffect(() => {
    if (!isValidModelFor(provider, modelId)) setModelId(defaultModelFor(provider).id);
  }, [provider, modelId]);

  /* ---- handlers ---- */
  const handleProviderChange = (p: Provider) => {
    setProvider(p);
    setModelId(defaultModelFor(p).id);
    setKeyValid(false);
    setApiKey("");
    setKeyError("");
    setKeyWarning("");
    setPreciseEstimate(null);
  };

  const handleFile = async (f: File) => {
    setFileError("");
    if (f.size > MAX_FILE_BYTES) {
      setFileError("File exceeds the 10 MB limit.");
      return;
    }
    try {
      const parsed = await parseFile(f);
      if (parsed.totalRows === 0) {
        setFileError("That file has no data rows.");
        return;
      }
      setFile(parsed);
      setInputColumns([]);
      setOutputColumns([]);
      setColumnsAutoSelected(false);
      setShowAllColumns(false);
      clearResults();
    } catch (err) {
      setFileError((err as Error).message);
    }
  };

  const addOutputColumn = () => {
    const name = newColumnName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!key || outputColumns.some((c) => c.key === key)) return;
    setOutputColumns((p) => [...p, { key, label: name }]);
    setNewColumnName("");
  };

  const applyTemplate = (t: (typeof TEMPLATES)[number]) => {
    setDescription(t.description);
    const detected = detectOutputColumns(t.description);
    if (detected.length > 0) setOutputColumns(detected);
  };

  const validateKey = async () => {
    if (!apiKey.trim()) {
      setKeyError("Enter an API key first.");
      return;
    }
    setValidating(true);
    setKeyError("");
    setKeyWarning("");
    try {
      const data = await validateApiKey(provider, apiKey.trim());
      if (data.valid) {
        setKeyValid(true);
        if (data.warning) setKeyWarning(data.warning);
      } else {
        setKeyError(data.error || "That key was rejected.");
      }
    } catch {
      setKeyError("Could not reach the validation endpoint. Check your connection.");
    } finally {
      setValidating(false);
    }
  };

  /** Clear results but keep the file, columns, prompt, model and key. */
  const clearResults = useCallback(() => {
    abortRef.current.aborted = true;
    pauseRef.current = false;
    rateRef.current.reset();
    setTestResults([]);
    setTestDone(false);
    setTestRunning(false);
    setFullResults([]);
    setFullDone(false);
    setFullRunning(false);
    setFullPaused(false);
    setStats(emptyRunStats());
    setThrottleNotice("");
    setPreciseEstimate(null);
  }, []);

  const startOver = () => {
    clearResults();
    setFile(null);
    setDescription("");
    setInputColumns([]);
    setOutputColumns([]);
    setColumnsAutoSelected(false);
    setAdvancedMode(false);
    setCustomTemplate("");
  };

  const enrichRow = useCallback(
    async (row: Record<string, string>, index: number): Promise<EnrichmentResult> => {
      const prompt = buildPrompt(
        inputColumns,
        row,
        outputColumns,
        description,
        advancedMode ? customTemplate : undefined,
        useWebSearch
      );
      const startedAt = Date.now();
      try {
        const r = await enrichRowWithRetry(provider, apiKey, modelId, prompt, useWebSearch, {
          signal: abortRef.current,
          onRetry: ({ attempt, delayMs, error }) =>
            setThrottleNotice(
              error.isRateLimit
                ? `Rate limited — backing off ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt})`
                : `Retrying after error — waiting ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt})`
            ),
        });
        return {
          rowIndex: index,
          success: true,
          data: r.data,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          durationMs: Date.now() - startedAt,
          naCount: countMissingCells(r.data, outputColumns),
          retries: r.retries,
        };
      } catch (err) {
        return {
          rowIndex: index,
          success: false,
          data: {},
          error: (err as Error).message,
          durationMs: Date.now() - startedAt,
          retries: 0,
        };
      }
    },
    [inputColumns, outputColumns, description, advancedMode, customTemplate, provider, apiKey, modelId, useWebSearch]
  );

  const runTest = async () => {
    if (!file) return;
    abortRef.current = { aborted: false };
    rateRef.current.reset();
    setTestRunning(true);
    setTestResults([]);
    setTestDone(false);
    setPreciseEstimate(null);
    setThrottleNotice("");

    const rows = file.rows.slice(0, TEST_ROW_COUNT);
    const collected: EnrichmentResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (abortRef.current.aborted) break;
      const r = await enrichRow(rows[i], i);
      collected.push(r);
      setTestResults([...collected]);
    }

    const ok = collected.filter((r) => r.success && r.inputTokens && r.outputTokens);
    if (ok.length > 0) {
      const avgIn = Math.round(ok.reduce((s, r) => s + (r.inputTokens || 0), 0) / ok.length);
      const avgOut = Math.round(ok.reduce((s, r) => s + (r.outputTokens || 0), 0) / ok.length);
      setPreciseEstimate(
        calculateCostFromActualTokens(file.totalRows, avgIn, avgOut, modelId, useWebSearch)
      );
    }
    setTestDone(true);
    setTestRunning(false);
    setThrottleNotice("");
  };

  /** Run every row, or just the given indices when retrying failures. */
  const runBatch = async (indices: number[], keepExisting: boolean) => {
    if (!file) return;
    abortRef.current = { aborted: false };
    pauseRef.current = false;
    if (!keepExisting) rateRef.current.reset();

    setFullRunning(true);
    setFullDone(false);
    setFullPaused(false);
    setThrottleNotice("");

    const results = new Map<number, EnrichmentResult>(
      keepExisting ? fullResults.filter((r) => r.success).map((r) => [r.rowIndex, r]) : []
    );

    const base = keepExisting ? stats : emptyRunStats();
    const running: RunStats = { ...base, startedAt: Date.now(), finishedAt: null };
    setStats(running);

    let cursor = 0;
    const worker = async () => {
      while (cursor < indices.length) {
        if (abortRef.current.aborted) return;
        while (pauseRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          if (abortRef.current.aborted) return;
        }
        const idx = indices[cursor++];
        if (idx === undefined) return;

        const r = await enrichRow(file.rows[idx], idx);
        results.set(idx, r);

        const tokens = (r.inputTokens ?? 0) + (r.outputTokens ?? 0);
        const rate = rateRef.current.add(tokens);

        running.inputTokens += r.inputTokens ?? 0;
        running.outputTokens += r.outputTokens ?? 0;
        running.peakTokensPerMinute = rate.peak;
        running.retries += r.retries ?? 0;
        if ((r.retries ?? 0) > 0) running.rateLimited += 1;
        if (r.success) {
          running.naCells += r.naCount ?? 0;
          running.totalCells += outputColumns.length;
        }

        setStats({ ...running });
        setFullResults([...results.values()].sort((a, b) => a.rowIndex - b.rowIndex));
      }
    };

    await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));

    running.finishedAt = Date.now();
    setStats({ ...running });
    setFullRunning(false);
    setFullDone(true);
    setThrottleNotice("");
  };

  const runFull = () => runBatch(Array.from({ length: totalRows }, (_, i) => i), false);

  const retryFailed = () => {
    const failedIndices = fullResults.filter((r) => !r.success).map((r) => r.rowIndex);
    if (failedIndices.length > 0) runBatch(failedIndices, true);
  };

  const stopRun = () => {
    abortRef.current.aborted = true;
    pauseRef.current = false;
    setFullPaused(false);
    setFullRunning(false);
    setFullDone(true);
  };

  const handleDownload = () => {
    if (!file) return;
    const byIndex = new Map(fullResults.map((r) => [r.rowIndex, r]));
    const anyFailures = fullResults.some((r) => !r.success);

    const enriched = file.rows.map((_, i) => {
      const r = byIndex.get(i);
      const row: Record<string, string> = {};
      for (const c of outputColumns) row[c.key] = r?.success ? (r.data[c.key] ?? "") : "";
      // Errors go in their own column rather than into every data cell, so the
      // enriched columns stay clean enough to sort, filter and pivot on.
      if (anyFailures) {
        row.enrichment_status = !r ? "not processed" : r.success ? "ok" : `failed: ${r.error ?? "unknown"}`;
      }
      return row;
    });

    const columnKeys = outputColumns.map((c) => c.key);
    if (anyFailures) columnKeys.push("enrichment_status");

    const blob = exportToFile(file, enriched, columnKeys);
    const ext = file.fileType === "csv" ? "csv" : "xlsx";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.fileName.replace(/\.[^.]+$/, "")}_enriched.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const estimate = preciseEstimate ?? costRange?.low ?? null;
  const fillRate = stats.totalCells > 0 ? 1 - stats.naCells / stats.totalCells : null;

  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-6 w-6" />
            <span className="text-sm font-bold tracking-tight">OpenClay</span>
            <span className="eyebrow hidden sm:inline">enrich</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded border border-data-line bg-data-soft px-2 py-1 font-mono text-[10px] text-data md:inline-flex">
              <LockIcon className="h-3 w-3" />
              Runs in your browser
            </span>
            <a
              href="https://www.linkedin.com/in/-raghav/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              <LinkedInIcon className="h-3 w-3" />
              Feedback
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-5 pb-28 sm:px-6 lg:pb-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ================= LEFT ================= */}
          <div className="min-w-0 space-y-4">
            {/* ---------- 1. Upload ---------- */}
            <Panel active={!file}>
              <StepHeader
                num={1}
                title="Load your spreadsheet"
                hint="CSV or Excel, up to 10 MB. Parsed in your browser."
                done={!!file}
                active={!file}
                aside={
                  file ? (
                    <Button variant="ghost" onClick={startOver} className="shrink-0">
                      <TrashIcon className="h-3.5 w-3.5" />
                      Start over
                    </Button>
                  ) : undefined
                }
              />

              <div className="p-4">
                {!file ? (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        const f = e.dataTransfer.files[0];
                        if (f) handleFile(f);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                      }}
                      className={`blueprint-grid flex cursor-pointer flex-col items-center justify-center rounded border border-dashed px-4 py-12 text-center transition-colors ${
                        dragging ? "border-accent bg-accent-soft" : "border-line-strong hover:border-accent"
                      }`}
                    >
                      <UploadIcon className="mb-2.5 h-7 w-7 text-ink-3" />
                      <p className="text-sm font-medium text-ink">Drop a file, or click to browse</p>
                      <p className="mt-1 font-mono text-[10px] text-ink-3">.csv &middot; .xls &middot; .xlsx</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFile(f);
                        }}
                        className="hidden"
                      />
                    </div>
                    {fileError && (
                      <div className="mt-2.5">
                        <Callout tone="danger" icon={<AlertIcon className="h-3.5 w-3.5" />}>
                          {fileError}
                        </Callout>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-mono text-xs font-medium text-ink">{file.fileName}</span>
                      <span className="font-mono text-[11px] text-ink-2 tnum">
                        {file.totalRows.toLocaleString()} rows &middot; {file.columns.length} columns
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="ml-auto font-mono text-[11px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-accent"
                      >
                        Replace
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFile(f);
                        }}
                        className="hidden"
                      />
                    </div>
                    <div className="thin-scroll max-h-44 overflow-auto rounded border border-line">
                      <table className="min-w-full border-collapse font-mono text-[11px]">
                        <thead className="sticky top-0 bg-surface-2">
                          <tr>
                            {file.columns.map((c) => (
                              <th
                                key={c}
                                className="whitespace-nowrap border-b border-line px-2 py-1.5 text-left font-medium text-ink-2"
                              >
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {file.rows.slice(0, 5).map((r, i) => (
                            <tr key={i} className="border-b border-line last:border-0">
                              {file.columns.map((c) => (
                                <td
                                  key={c}
                                  className="max-w-[180px] truncate whitespace-nowrap px-2 py-1 text-ink-2"
                                >
                                  {r[c]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </Panel>

            {/* ---------- 2. Define ---------- */}
            {/* ---------- 2. Map input to output ---------- */}
            <Panel muted={!file} active={!!file && !defineReady}>
              <StepHeader
                num={2}
                title="Set up the enrichment"
                done={defineReady}
                active={!!file && !defineReady}
                aside={
                  defineReady ? (
                    <span className="hidden shrink-0 items-center gap-1.5 rounded border border-data-line bg-data-soft px-2 py-1 font-mono text-[10px] text-data sm:inline-flex">
                      {inputColumns.length} in &rarr; {outputColumns.length} out
                    </span>
                  ) : undefined
                }
              />

              <div className="p-4">
                {/* --- The instruction. Primary input, so it leads. --- */}
                <label
                  htmlFor="what-to-find"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-2"
                >
                  What to find, per row
                </label>
                <textarea
                  id="what-to-find"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (outputColumns.length === 0 && description.trim()) {
                      const detected = detectOutputColumns(description);
                      if (detected.length > 0) setOutputColumns(detected);
                    }
                  }}
                  rows={2}
                  placeholder="e.g. CEO name, total funding raised, employee count"
                  className="w-full resize-y rounded border border-line bg-surface-2 px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-3 focus:border-accent focus:bg-surface focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="eyebrow mr-0.5">Presets</span>
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => applyTemplate(t)}
                      className="rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-2 transition-colors hover:border-accent hover:text-accent"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* --- Input -> output mapping.
                       Laid out as a transform because that is what it is: the
                       model reads the left column and writes the right one.
                       Stacking these as two similar-looking boxes was what made
                       "columns to add" read as another filter rather than the
                       result. --- */}
                <div className="mt-5 grid gap-3 border-t border-line pt-5 lg:grid-cols-[1fr_auto_1fr]">
                  {/* INPUT */}
                  <section className="rounded border border-line bg-surface-2/60 p-3">
                    <header className="mb-2.5 flex items-baseline justify-between gap-2">
                      <span className="flex items-center">
                        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-2">
                          Input
                        </h3>
                        <Tip text="Values from these columns are substituted into the prompt for each row. Pick the ones that identify the thing being researched." />
                      </span>
                      <span className="font-mono text-[10px] text-ink-3">
                        {inputColumns.length}/{file?.columns.length ?? 0}
                      </span>
                    </header>
                    {!file ? (
                      <p className="rounded border border-dashed border-line px-3 py-4 text-center font-mono text-[10px] text-ink-3">
                        Load a file first
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {(showAllColumns
                            ? [...smartColumns.recommended, ...smartColumns.other]
                            : smartColumns.recommended
                          ).map((col) => {
                            const on = inputColumns.includes(col);
                            return (
                              <button
                                key={col}
                                onClick={() =>
                                  setInputColumns((p) =>
                                    p.includes(col) ? p.filter((c) => c !== col) : [...p, col]
                                  )
                                }
                                aria-pressed={on}
                                className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-mono text-[11px] transition-colors ${
                                  on
                                    ? "border-accent bg-accent text-on-accent"
                                    : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink"
                                }`}
                              >
                                {on && <CheckIcon className="h-2.5 w-2.5" />}
                                {col}
                              </button>
                            );
                          })}
                        </div>
                        {smartColumns.other.length > 0 && (
                          <button
                            onClick={() => setShowAllColumns((v) => !v)}
                            className="mt-2 font-mono text-[10px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-accent"
                          >
                            {showAllColumns
                              ? "Show suggested only"
                              : `+ ${smartColumns.other.length} more column${smartColumns.other.length === 1 ? "" : "s"}`}
                          </button>
                        )}
                        {inputColumns.length === 0 && (
                          <p className="mt-2 font-mono text-[10px] text-warn">
                            Pick at least one.
                          </p>
                        )}
                      </>
                    )}
                  </section>

                  {/* TRANSFORM */}
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-center gap-2 lg:flex-col lg:px-1"
                  >
                    <span className="h-px flex-1 bg-line lg:h-full lg:w-px lg:flex-none" />
                    <span className="flex shrink-0 items-center gap-1 rounded border border-line bg-surface px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-ink-3">
                      {useWebSearch ? <GlobeIcon className="h-2.5 w-2.5 text-data" /> : null}
                      {useWebSearch ? "AI + search" : "AI"}
                    </span>
                    <span className="h-px flex-1 bg-line lg:h-full lg:w-px lg:flex-none" />
                  </div>

                  {/* OUTPUT */}
                  <section className="rounded border border-data-line bg-data-soft/30 p-3">
                    <header className="mb-2.5 flex items-baseline justify-between gap-2">
                      <span className="flex items-center">
                        <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-data">
                          Output
                        </h3>
                        <Tip text="One new spreadsheet column per entry. The model is asked to return exactly these keys as JSON." />
                      </span>
                      <span className="font-mono text-[10px] text-ink-3">
                        {outputColumns.length} new
                      </span>
                    </header>
                    {outputColumns.length > 0 && (
                      <ul className="mb-2 flex flex-wrap gap-1.5">
                        {outputColumns.map((col) => (
                          <li
                            key={col.key}
                            className="inline-flex items-center gap-1.5 rounded border border-data-line bg-surface px-2 py-1 font-mono text-[11px] text-data"
                          >
                            {col.label}
                            <button
                              onClick={() =>
                                setOutputColumns((p) => p.filter((c) => c.key !== col.key))
                              }
                              aria-label={`Remove ${col.label}`}
                              className="text-ink-3 transition-colors hover:text-danger"
                            >
                              <CloseIcon className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-1.5">
                      <input
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addOutputColumn();
                          }
                        }}
                        placeholder="Add a column"
                        className="min-w-0 flex-1 rounded border border-line bg-surface px-2 py-1.5 font-mono text-[11px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
                      />
                      <button
                        onClick={addOutputColumn}
                        disabled={!newColumnName.trim()}
                        aria-label="Add output column"
                        className="inline-flex items-center gap-1 rounded border border-data-line bg-surface px-2.5 py-1.5 font-mono text-[11px] text-data transition-colors hover:bg-data-soft disabled:opacity-30"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Add
                      </button>
                    </div>

                    {outputColumns.length === 0 && (
                      <p className="mt-2 font-mono text-[10px] text-warn">
                        Filled in from your description above.
                      </p>
                    )}
                  </section>
                </div>

                {/* --- Advanced: the raw template --- */}
                <details className="mt-4 border-t border-line pt-3" open={advancedMode}>
                  <summary
                    onClick={(e) => {
                      e.preventDefault();
                      const next = !advancedMode;
                      setAdvancedMode(next);
                      // Seed with the *template* — placeholders intact. Seeding with a
                      // preview (row 1's values already substituted) is what made every
                      // row come back with the first row's data.
                      if (next && !customTemplate && generatedTemplate) {
                        setCustomTemplate(generatedTemplate);
                      }
                    }}
                    className="flex cursor-pointer list-none items-center gap-2 font-mono text-[11px] text-ink-2 hover:text-ink"
                  >
                    <span className="text-ink-3">{advancedMode ? "\u2212" : "+"}</span>
                    Edit the prompt template
                  </summary>

                  {advancedMode && (
                    <div className="mt-2.5 space-y-2">
                      <textarea
                        value={customTemplate}
                        onChange={(e) => setCustomTemplate(e.target.value)}
                        rows={9}
                        spellCheck={false}
                        className="thin-scroll w-full resize-y rounded border border-line bg-surface-2 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-ink focus:border-accent focus:bg-surface focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-ink-3">
                          Placeholders:{" "}
                          {inputColumns.length > 0
                            ? inputColumns.map((c) => `{${c}}`).join(" ")
                            : "select input columns first"}
                        </span>
                        <button
                          onClick={() => setCustomTemplate(generatedTemplate)}
                          className="font-mono text-[10px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-accent"
                        >
                          Reset to generated
                        </button>
                      </div>

                      {templateWarnings.map((w, i) => (
                        <Callout
                          key={i}
                          tone={w.level === "error" ? "danger" : "warn"}
                          icon={<AlertIcon className="h-3.5 w-3.5" />}
                        >
                          {w.message}
                        </Callout>
                      ))}

                      {previewPrompt && (
                        <details className="rounded border border-line bg-surface-2">
                          <summary className="cursor-pointer px-2.5 py-1.5 font-mono text-[10px] text-ink-2 hover:text-ink">
                            Preview — exactly what row 1 will send
                          </summary>
                          <pre className="thin-scroll max-h-40 overflow-auto whitespace-pre-wrap break-words border-t border-line px-2.5 py-2 font-mono text-[10px] leading-relaxed text-ink-2">
                            {previewPrompt}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </details>
              </div>
            </Panel>


            {/* ---------- 3. Model ---------- */}
            <Panel muted={!file}>
              <StepHeader
                num={3}
                title="Pick a model"
                hint="Billed by the provider. We add nothing."
                done={!!modelId}
                active={!!file && defineReady}
                aside={
                  <span className="hidden shrink-0 items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-2 sm:inline-flex">
                    <ProviderLogo provider={provider} className="h-3 w-3" />
                    {model.name}
                  </span>
                }
              />

              <div className="space-y-4 p-4">
                <ModelPicker
                  provider={provider}
                  modelId={modelId}
                  onProviderChange={handleProviderChange}
                  onModelChange={(id) => {
                    setModelId(id);
                    setPreciseEstimate(null);
                  }}
                />

                <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  {/* Web search */}
                  <div>
                    <label className="flex cursor-pointer items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={useWebSearch}
                        disabled={!model.search}
                        onChange={(e) => {
                          setUseWebSearch(e.target.checked);
                          setPreciseEstimate(null);
                        }}
                        className="mt-0.5 accent-accent"
                      />
                      <span>
                        <span className="flex items-center gap-1.5 font-medium text-ink">
                          <GlobeIcon className="h-3.5 w-3.5 text-data" />
                          Live web search
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-ink-2">
                          {model.search ? "Billed per search by the provider." : "Not supported by this model."}
                        </span>
                      </span>
                    </label>
                    {!useWebSearch && model.search && (
                      <div className="mt-2">
                        <Callout tone="warn" icon={<AlertIcon className="h-3.5 w-3.5" />}>
                          Training data only — may be out of date.
                        </Callout>
                      </div>
                    )}
                  </div>

                  {/* Concurrency */}
                  <div>
                    <label
                      htmlFor="concurrency"
                      className="flex items-center text-[11px] font-semibold uppercase tracking-wide text-ink-2"
                    >
                      Parallel requests
                      <Tip text="How many rows run at once. Lower this if you hit rate limits; raise it to finish sooner. Rate-limited rows retry automatically with backoff." />
                    </label>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        id="concurrency"
                        type="range"
                        min={1}
                        max={MAX_CONCURRENCY}
                        value={concurrency}
                        onChange={(e) => setConcurrency(Number(e.target.value))}
                        disabled={fullRunning}
                        className="min-w-0 flex-1 accent-accent"
                      />
                      <span className="w-6 shrink-0 text-right font-mono text-sm font-semibold text-ink tnum">
                        {concurrency}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-ink-3">
                      {concurrency <= 2
                        ? "Gentle"
                        : concurrency <= 5
                          ? "Balanced"
                          : "Aggressive"}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>

            {/* ---------- 4. Key ---------- */}
            <Panel muted={!configReady} active={configReady && !keyValid}>
              <StepHeader
                num={4}
                title={`Connect your ${providerMeta.company} key`}
                hint="Held in memory only. Never stored or logged."
                done={keyValid}
                active={configReady && !keyValid}
              />

              <div className="p-4">
                {!keyValid ? (
                  <div className="space-y-2.5">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          setKeyError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") validateKey();
                        }}
                        placeholder={`${providerMeta.keyPrefix}…`}
                        autoComplete="off"
                        spellCheck={false}
                        className="min-w-0 flex-1 rounded border border-line bg-surface-2 px-2.5 py-2 font-mono text-xs text-ink placeholder:text-ink-3 focus:border-accent focus:bg-surface focus:outline-none"
                      />
                      <Button
                        variant="primary"
                        onClick={validateKey}
                        disabled={validating || !apiKey.trim()}
                        className="sm:w-36"
                      >
                        {validating ? "Checking…" : "Validate key"}
                      </Button>
                    </div>

                    {keyError && (
                      <Callout tone="danger" icon={<AlertIcon className="h-3.5 w-3.5" />}>
                        {keyError}
                      </Callout>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={providerMeta.keyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-accent underline decoration-accent-line underline-offset-2"
                      >
                        Get a key from {providerMeta.docsLabel} →
                      </a>
                      {provider === "gemini" && (
                        <span className="font-mono text-[10px] text-ink-3">
                          Vertex AI: paste service-account JSON
                        </span>
                      )}
                    </div>

                    <Callout tone="data" icon={<LockIcon className="h-3.5 w-3.5" />}>
                      Your key passes through a stateless proxy to {providerMeta.company}. Never written
                      to disk, a database, a log or a cookie.
                    </Callout>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded border border-data-line bg-data-soft px-2.5 py-2">
                      <span className="flex items-center gap-2 font-mono text-[11px] font-medium text-data">
                        <CheckIcon className="h-3.5 w-3.5" />
                        {providerMeta.company} connected
                      </span>
                      <button
                        onClick={() => {
                          setKeyValid(false);
                          setApiKey("");
                          setKeyWarning("");
                        }}
                        className="font-mono text-[11px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-danger"
                      >
                        Disconnect
                      </button>
                    </div>
                    {keyWarning && (
                      <Callout tone="warn" icon={<AlertIcon className="h-3.5 w-3.5" />}>
                        {keyWarning}
                      </Callout>
                    )}
                  </div>
                )}
              </div>
            </Panel>

            {/* ---------- 5. Run ---------- */}
            <Panel muted={!runReady} active={runReady && !fullDone}>
              <StepHeader
                num={5}
                title="Test, run, download"
                hint={`Test ${TEST_ROW_COUNT} rows first for an exact cost per row.`}
                done={fullDone && failed === 0}
                active={runReady && !fullDone}
              />

              <div className="space-y-4 p-4">
                {/* -- Test -- */}
                {!testDone && !testRunning && !fullRunning && !fullDone && (
                  <Button variant="primary" onClick={runTest} disabled={!runReady} className="w-full py-2.5">
                    Test {Math.min(TEST_ROW_COUNT, totalRows)} row
                    {Math.min(TEST_ROW_COUNT, totalRows) === 1 ? "" : "s"}
                  </Button>
                )}

                {(testRunning || (testDone && !fullRunning && !fullDone)) && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full bg-accent transition-[width] duration-300"
                          style={{
                            width: `${(testResults.length / Math.min(TEST_ROW_COUNT, totalRows || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-ink-2 tnum">
                        {testResults.length}/{Math.min(TEST_ROW_COUNT, totalRows)}
                      </span>
                    </div>

                    {throttleNotice && (
                      <Callout tone="warn" icon={<AlertIcon className="h-3.5 w-3.5" />}>
                        {throttleNotice}
                      </Callout>
                    )}

                    {testResults.length > 0 && (
                      <ResultTable
                        rows={testResults}
                        file={file}
                        inputColumns={inputColumns}
                        outputColumns={outputColumns}
                      />
                    )}

                    {testDone && (
                      <>
                        {testResults.every((r) => !r.success) ? (
                          <Callout tone="danger" icon={<AlertIcon className="h-3.5 w-3.5" />}>
                            Every test row failed, so the full run would too. First error:{" "}
                            {testResults[0]?.error}
                          </Callout>
                        ) : (
                          <TestQuality results={testResults} outputColumns={outputColumns} />
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button onClick={clearResults} className="flex-1">
                            <RefreshIcon className="h-3.5 w-3.5" />
                            Adjust &amp; re-test
                          </Button>
                          <Button
                            variant="primary"
                            onClick={runFull}
                            disabled={testResults.every((r) => !r.success)}
                            className="flex-1"
                          >
                            Run all {totalRows.toLocaleString()} rows
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* -- Full run -- */}
                {(fullRunning || fullDone) && (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[11px] text-ink-2 tnum">
                        {completed.toLocaleString()} / {totalRows.toLocaleString()} processed
                      </span>
                      <span className="font-mono text-[11px] tnum">
                        <span className="text-data">{succeeded.toLocaleString()} ok</span>
                        {failed > 0 && (
                          <>
                            <span className="text-ink-3"> · </span>
                            <span className="text-danger">{failed.toLocaleString()} failed</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div
                      className={`relative h-1.5 overflow-hidden rounded-full bg-surface-3 ${
                        fullRunning && !fullPaused ? "sweep" : ""
                      }`}
                    >
                      <div
                        className={`h-full transition-[width] duration-300 ${
                          fullDone && failed === 0 ? "bg-data" : "bg-accent"
                        }`}
                        style={{ width: `${totalRows ? (completed / totalRows) * 100 : 0}%` }}
                      />
                    </div>

                    {/* Live counters — the numbers Olin asked for */}
                    <div className="flex flex-wrap gap-y-2 rounded border border-line bg-surface-2 px-3 py-2">
                      <Stat
                        label="Tokens in"
                        value={formatTokens(stats.inputTokens)}
                        sub={`${formatTokens(stats.outputTokens)} out`}
                      />
                      <Stat
                        label="Peak TPM"
                        value={formatTokens(stats.peakTokensPerMinute)}
                        sub="for quota sizing"
                        tone="accent"
                      />
                      <Stat
                        label="Blank cells"
                        value={stats.naCells.toLocaleString()}
                        sub={fillRate !== null ? `${(fillRate * 100).toFixed(0)}% filled` : undefined}
                        tone={fillRate !== null && fillRate < 0.6 ? "warn" : "ink"}
                      />
                      <Stat
                        label="Retries"
                        value={stats.retries.toLocaleString()}
                        sub={stats.rateLimited > 0 ? `${stats.rateLimited} rows` : "none"}
                        tone={stats.retries > 0 ? "warn" : "ink"}
                      />
                      {fullRunning ? (
                        <Stat
                          label="Remaining"
                          value={etaMs !== null ? formatDuration(etaMs) : "—"}
                          sub={etaMs !== null ? `done ~${formatFinishTime(etaMs)}` : "measuring…"}
                          tone="data"
                        />
                      ) : (
                        <Stat
                          label="Elapsed"
                          value={
                            stats.startedAt && stats.finishedAt
                              ? formatDuration(stats.finishedAt - stats.startedAt)
                              : "—"
                          }
                          sub={`~${formatUSD(spentSoFar)} spent`}
                          tone="data"
                        />
                      )}
                    </div>

                    {throttleNotice && (
                      <Callout tone="warn" icon={<AlertIcon className="h-3.5 w-3.5" />}>
                        {throttleNotice}
                      </Callout>
                    )}

                    {fullRunning && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            pauseRef.current = !pauseRef.current;
                            setFullPaused(pauseRef.current);
                          }}
                          className="flex-1"
                        >
                          {fullPaused ? (
                            <>
                              <PlayIcon className="h-3.5 w-3.5" /> Resume
                            </>
                          ) : (
                            <>
                              <PauseIcon className="h-3.5 w-3.5" /> Pause
                            </>
                          )}
                        </Button>
                        <Button variant="danger" onClick={stopRun} className="flex-1">
                          <StopIcon className="h-3.5 w-3.5" /> Stop
                        </Button>
                      </div>
                    )}

                    {fullDone && (
                      <>
                        <Callout
                          tone={failed === 0 ? "data" : "warn"}
                          icon={
                            failed === 0 ? (
                              <CheckIcon className="h-3.5 w-3.5" />
                            ) : (
                              <AlertIcon className="h-3.5 w-3.5" />
                            )
                          }
                        >
                          <strong className="font-semibold">
                            {succeeded.toLocaleString()} of {totalRows.toLocaleString()} rows enriched
                          </strong>
                          {failed > 0 &&
                            ` — ${failed.toLocaleString()} failed. Failed rows download as blank cells plus an enrichment_status column.`}
                          {failed === 0 && ` across ${outputColumns.length} new columns.`}
                        </Callout>

                        <Button variant="primary" onClick={handleDownload} className="w-full py-2.5">
                          <DownloadIcon className="h-4 w-4" />
                          Download enriched {file?.fileType === "csv" ? "CSV" : "XLSX"}
                        </Button>

                        {/* Olin: there was no way back from this screen. Now there are three. */}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          {failed > 0 && (
                            <Button onClick={retryFailed} className="flex-1">
                              <RefreshIcon className="h-3.5 w-3.5" />
                              Retry {failed.toLocaleString()} failed
                            </Button>
                          )}
                          <Button variant="danger" onClick={clearResults} className="flex-1">
                            <TrashIcon className="h-3.5 w-3.5" />
                            Clear results &amp; re-run
                          </Button>
                        </div>
                        <p className="text-center font-mono text-[10px] text-ink-3">
                          Keeps your file, columns, prompt and key.
                        </p>

                        {fullResults.length > 0 && (
                          <details className="rounded border border-line">
                            <summary className="cursor-pointer px-2.5 py-1.5 font-mono text-[11px] text-ink-2 hover:text-ink">
                              Inspect results ({completed.toLocaleString()} rows)
                            </summary>
                            <div className="border-t border-line p-2">
                              <ResultTable
                                rows={fullResults.slice(0, 100)}
                                file={file}
                                inputColumns={inputColumns}
                                outputColumns={outputColumns}
                              />
                              {fullResults.length > 100 && (
                                <p className="mt-1.5 text-center font-mono text-[10px] text-ink-3">
                                  First 100 shown.
                                </p>
                              )}
                            </div>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </Panel>

            <p className="px-2 text-center text-[10px] leading-relaxed text-ink-3">
              Provided as-is. AI-generated data can be wrong — verify anything you act on.
            </p>
          </div>

          {/* ================= RIGHT ================= */}
          <aside className="hidden lg:block">
            <div className="sticky top-16 space-y-4">
              <EstimatePanel
                estimate={estimate}
                range={costRange}
                precise={!!preciseEstimate}
                outputColumnCount={outputColumns.length}
                model={model}
                spent={fullRunning || fullDone ? spentSoFar : null}
                useWebSearch={useWebSearch}
              />

              <Panel>
                <div className="border-b border-line px-3 py-2">
                  <h3 className="eyebrow">Privacy guarantees</h3>
                </div>
                <ul className="space-y-1.5 p-3">
                  {[
                    "Key in memory, never storage",
                    "Files parsed in your browser",
                    "No database, no cookies, no accounts",
                    "Server logs nothing",
                    "Open source",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-[11px] leading-snug text-ink-2">
                      <CheckIcon className="mt-px h-3 w-3 shrink-0 text-data" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Panel>

              <div className="space-y-1 px-1 text-center font-mono text-[10px] text-ink-3">
                <p>
                  Prices {PRICING_LAST_UPDATED} ·{" "}
                  <a
                    href={providerMeta.pricingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-line-strong underline-offset-2 hover:text-accent"
                  >
                    official rates
                  </a>
                </p>
                <p className="flex items-center justify-center gap-3 pt-1">
                  <Link href="/privacy" className="hover:text-accent">
                    Privacy
                  </Link>
                  <Link href="/terms" className="hover:text-accent">
                    Terms
                  </Link>
                  <Link href="/data" className="hover:text-accent">
                    Data
                  </Link>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile cost bar */}
      {estimate && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-paper/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-mono text-[10px] text-ink-2 tnum">
              {estimate.totalRows.toLocaleString()} rows · {estimate.modelName}
            </span>
            <span className="shrink-0 font-mono text-sm font-bold text-ink tnum">
              {preciseEstimate
                ? `~${formatUSD(estimate.totalCost)}`
                : costRange
                  ? formatUSDRange(costRange.low.totalCost, costRange.high.totalCost)
                  : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ResultTable({
  rows,
  file,
  inputColumns,
  outputColumns,
}: {
  rows: EnrichmentResult[];
  file: ParsedFile | null;
  inputColumns: string[];
  outputColumns: OutputColumn[];
}) {
  return (
    <div className="thin-scroll max-h-96 overflow-auto rounded border border-line">
      <table className="min-w-full border-collapse font-mono text-[11px]">
        <thead className="sticky top-0 z-10 bg-surface-2">
          <tr>
            <th className="border-b border-line px-2 py-1.5 text-left font-medium text-ink-3">#</th>
            {inputColumns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap border-b border-line px-2 py-1.5 text-left font-medium text-ink-2"
              >
                {c}
              </th>
            ))}
            {outputColumns.map((c) => (
              <th
                key={c.key}
                className="whitespace-nowrap border-b border-data-line bg-data-soft px-2 py-1.5 text-left font-medium text-data"
              >
                {c.label}
              </th>
            ))}
            <th className="border-b border-line px-2 py-1.5 text-left font-medium text-ink-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rowIndex} className="border-b border-line last:border-0">
              <td className="px-2 py-1.5 text-ink-3 tnum">{r.rowIndex + 1}</td>
              {inputColumns.map((c) => (
                <td key={c} className="max-w-[140px] truncate whitespace-nowrap px-2 py-1.5 text-ink-2">
                  {file?.rows[r.rowIndex]?.[c]}
                </td>
              ))}
              {outputColumns.map((c) => {
                const value = r.data[c.key];
                const blank = !value || /^(n\/?a|none|unknown|-)$/i.test(value.trim());
                return (
                  <td
                    key={c.key}
                    className={`max-w-[240px] whitespace-normal break-words px-2 py-1.5 align-top ${
                      blank ? "text-ink-3" : "text-ink"
                    }`}
                  >
                    {value || "—"}
                  </td>
                );
              })}
              <td className="whitespace-nowrap px-2 py-1.5">
                {r.success ? (
                  <span className="text-data">
                    ok
                    {(r.retries ?? 0) > 0 && <span className="text-warn"> ·{r.retries}r</span>}
                  </span>
                ) : (
                  <span className="text-danger" title={r.error}>
                    failed
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Surfaces fill rate right after the test, while changing the prompt is still cheap. */
function TestQuality({
  results,
  outputColumns,
}: {
  results: EnrichmentResult[];
  outputColumns: OutputColumn[];
}) {
  const ok = results.filter((r) => r.success);
  if (ok.length === 0 || outputColumns.length === 0) return null;

  const cells = ok.length * outputColumns.length;
  const blank = ok.reduce((s, r) => s + (r.naCount ?? 0), 0);
  const fill = 1 - blank / cells;
  const avgMs = ok.reduce((s, r) => s + (r.durationMs ?? 0), 0) / ok.length;

  return (
    <Callout
      tone={fill < 0.6 ? "warn" : "neutral"}
      icon={fill < 0.6 ? <AlertIcon className="h-3.5 w-3.5" /> : <InfoIcon className="h-3.5 w-3.5" />}
    >
      <span className="font-mono tnum">{(fill * 100).toFixed(0)}%</span> of cells filled ·{" "}
      <span className="font-mono tnum">{blank}</span> blank of{" "}
      <span className="font-mono tnum">{cells}</span> ·{" "}
      <span className="font-mono tnum">{(avgMs / 1000).toFixed(1)}s</span> per row
      {fill < 0.6 &&
        " — a lot of blanks. Try naming the columns more explicitly, or switch to a stronger model before running everything."}
    </Callout>
  );
}

function EstimatePanel({
  estimate,
  range,
  precise,
  outputColumnCount,
  model,
  spent,
  useWebSearch,
}: {
  estimate: CostEstimate | null;
  range: { low: CostEstimate; high: CostEstimate } | null;
  precise: boolean;
  outputColumnCount: number;
  model: ReturnType<typeof requireModel>;
  spent: number | null;
  useWebSearch: boolean;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h3 className="eyebrow">{precise ? "Measured cost" : "Cost estimate"}</h3>
        {precise && (
          <span className="rounded border border-data-line bg-data-soft px-1.5 py-px font-mono text-[9px] text-data">
            from test run
          </span>
        )}
      </div>

      {!estimate ? (
        <p className="p-3 text-[11px] leading-snug text-ink-2">
          Load a file to see costs.
        </p>
      ) : (
        <div className="p-3">
          <div className="rounded border border-line bg-surface-2 px-3 py-3 text-center">
            <div className="eyebrow">{precise ? "Projected total" : "Likely range"}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-ink tnum">
              {precise
                ? `~${formatUSD(estimate.totalCost)}`
                : range
                  ? formatUSDRange(range.low.totalCost, range.high.totalCost)
                  : "—"}
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-ink-3 tnum">
              ${(estimate.totalCost / Math.max(1, estimate.totalRows)).toFixed(4)} per row
            </div>
          </div>

          {spent !== null && (
            <div className="mt-2 flex items-baseline justify-between rounded border border-accent-line bg-accent-soft px-2.5 py-1.5">
              <span className="eyebrow">Spent so far</span>
              <span className="font-mono text-sm font-bold text-accent tnum">{formatUSD(spent)}</span>
            </div>
          )}

          <dl className="mt-3 space-y-1 font-mono text-[11px]">
            <Row label="Rows" value={estimate.totalRows.toLocaleString()} />
            <Row label="Model" value={estimate.modelName} />
            <Row label="New columns" value={String(outputColumnCount)} />
            <Row label="Context" value={`${(model.contextWindow / 1000).toFixed(0)}k`} />
          </dl>

          <dl className="mt-2.5 space-y-1 border-t border-line pt-2.5 font-mono text-[11px]">
            <Row label="OpenClay fee" value="$0.00" tone="data" />
            <Row
              label="Input tokens"
              value={
                precise || !range
                  ? formatUSD(estimate.inputCost)
                  : formatUSDRange(range.low.inputCost, range.high.inputCost)
              }
            />
            <Row label="Output tokens" value={formatUSD(estimate.outputCost)} />
            {useWebSearch && (
              <Row
                label="Web search"
                value={`${formatUSD(estimate.searchCost)}${estimate.searchCostEstimated ? "*" : ""}`}
              />
            )}
          </dl>

          {estimate.freeSearchNote && (
            <p className="mt-2 text-[10px] leading-snug text-data">{estimate.freeSearchNote}</p>
          )}
          {estimate.searchCostEstimated && useWebSearch && (
            <p className="mt-1.5 text-[10px] leading-snug text-warn">
              * xAI publishes no per-search rate; this is our estimate.
            </p>
          )}
          {model.pricingNote && (
            <p className="mt-1.5 text-[10px] leading-snug text-warn">{model.pricingNote}</p>
          )}
          {!precise && (
            <p className="mt-2 text-[10px] leading-snug text-ink-3">
              Wide because search injects a variable amount of page content. Test for an exact figure.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

function Row({
  label,
  value,
  tone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "data";
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-ink-3">{label}</dt>
      <dd className={`truncate tnum ${tone === "data" ? "font-semibold text-data" : "text-ink-2"}`}>
        {value}
      </dd>
    </div>
  );
}
