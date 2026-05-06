"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import type {
  Provider,
  ModelId,
  OutputColumn,
  ParsedFile,
  EnrichmentResult,
  AnthropicModelId,
  GeminiModelId,
  GrokModelId,
  OpenAIModelId,
} from "@/lib/types";
import {
  ANTHROPIC_MODELS,
  GEMINI_MODELS,
  GROK_MODELS,
  OPENAI_MODELS,
  MODEL_GUIDANCE,
  PRICING_LAST_UPDATED,
  ANTHROPIC_PRICING_URL,
  GEMINI_PRICING_URL,
  GROK_PRICING_URL,
  OPENAI_PRICING_URL,
} from "@/lib/pricing";
import { buildPrompt } from "@/lib/promptTemplates";
import { estimateInputTokensPerRow, estimateOutputTokensPerRow, calculateCostRange, calculateCostFromActualTokens } from "@/lib/costEstimator";
import { parseFile, exportToFile } from "@/lib/fileParser";
import { enrichRowAnthropic } from "@/lib/anthropic";
import { enrichRowGemini } from "@/lib/gemini";
import { enrichRowGrok } from "@/lib/grok";
import { enrichRowOpenAI } from "@/lib/openai";

/* ------------------------------------------------------------------ */
/*  Light-themed Helpers                                                */
/* ------------------------------------------------------------------ */

function Card({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${glow ? "border-zinc-300 shadow-md" : "border-zinc-200"} ${className}`}>
      {children}
    </div>
  );
}

function StepHeader({ num, title, subtitle, done, active }: { num: number; title: string; subtitle?: string; done: boolean; active: boolean }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? "bg-emerald-500 text-white shadow-sm" : active ? "bg-zinc-900 text-white shadow-sm" : "bg-zinc-100 text-zinc-400"}`}>
        {done ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        ) : num}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
      <svg className="mt-0.5 h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
      {text}
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex cursor-help">
      <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-[11px] leading-relaxed text-zinc-100 opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

const SPEED_COLORS = { fast: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", medium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", slow: "bg-red-50 text-red-700 ring-1 ring-red-200" };
const QUALITY_COLORS = { good: "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200", great: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", best: "bg-purple-50 text-purple-700 ring-1 ring-purple-200" };

/* ------------------------------------------------------------------ */
/*  Prompt templates                                                   */
/* ------------------------------------------------------------------ */

const PROMPT_TEMPLATES = [
  { label: "Company research", description: "Find the CEO name, total funding raised, employee count, and a brief company description" },
  { label: "Job postings", description: "Find the number of open job postings, most common roles being hired, and hiring page URL" },
  { label: "Recent news", description: "Find the most recent news headline, news date, and a brief summary of the article" },
  { label: "Tech stack", description: "Find the primary programming languages, cloud provider, and key technologies used" },
  { label: "University info", description: "Find the university ranking, acceptance rate, annual tuition, and notable alumni" },
];

/* ------------------------------------------------------------------ */
/*  Smart column detection                                             */
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
  const matches = columns.filter((col) =>
    SMART_COLUMN_PATTERNS.some((pattern) => pattern.test(col.trim()))
  );
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
    .map((p) => p.replace(/^(the|their|its|a|an)\s+/i, "").trim())
    .filter((p) => p.length > 1 && p.length < 60 && !p.includes("."));

  if (parts.length === 0) return [];

  return parts.map((label) => {
    const key = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    return { key, label };
  }).filter((c) => c.key.length > 0);
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ToolPage() {
  /* ---- state ---- */
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [enrichmentDescription, setEnrichmentDescription] = useState("");
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [outputColumns, setOutputColumns] = useState<OutputColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [autoDetected, setAutoDetected] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [columnsAutoSelected, setColumnsAutoSelected] = useState(false);

  const [provider, setProvider] = useState<Provider>("gemini");
  const [modelId, setModelId] = useState<ModelId>("gemini-3.1-pro-preview");

  const [apiKey, setApiKey] = useState("");
  const [keyValid, setKeyValid] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keyWarning, setKeyWarning] = useState("");

  const [testRunning, setTestRunning] = useState(false);
  const [testResults, setTestResults] = useState<EnrichmentResult[]>([]);
  const [testDone, setTestDone] = useState(false);
  const [fullRunning, setFullRunning] = useState(false);
  const [fullPaused, setFullPaused] = useState(false);
  const [fullCompleted, setFullCompleted] = useState(0);
  const [fullFailed, setFullFailed] = useState(0);
  const [fullResults, setFullResults] = useState<EnrichmentResult[]>([]);
  const [fullDone, setFullDone] = useState(false);
  const pauseRef = useRef(false);
  const stopRef = useRef(false);

  const [useWebSearch, setUseWebSearch] = useState(true);
  const [realCostEstimate, setRealCostEstimate] = useState<import("@/lib/types").CostEstimate | null>(null);

  const [advancedMode, setAdvancedMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  /* ---- derived ---- */
  const models = provider === "anthropic" ? Object.entries(ANTHROPIC_MODELS) : provider === "grok" ? Object.entries(GROK_MODELS) : provider === "openai" ? Object.entries(OPENAI_MODELS) : Object.entries(GEMINI_MODELS);
  const describeReady = file && enrichmentDescription.trim().length > 0 && inputColumns.length > 0 && outputColumns.length > 0;
  const generatedPrompt = file && inputColumns.length > 0 && outputColumns.length > 0 ? buildPrompt(inputColumns, file.rows[0], outputColumns, enrichmentDescription, undefined, useWebSearch) : "";
  const configReady = describeReady && (!advancedMode || customPrompt.trim().length > 0);
  const runReady = configReady && keyValid;

  const costRange = useMemo(() => {
    if (!file || inputColumns.length === 0 || outputColumns.length === 0) return null;
    const sample = buildPrompt(inputColumns, file.rows[0], outputColumns, enrichmentDescription, advancedMode ? customPrompt : undefined, useWebSearch);
    const inp = estimateInputTokensPerRow(sample, provider, modelId);
    const out = estimateOutputTokensPerRow(outputColumns);
    return calculateCostRange(file.totalRows, inp, out, provider, modelId, useWebSearch);
  }, [file, inputColumns, outputColumns, enrichmentDescription, customPrompt, advancedMode, provider, modelId, useWebSearch]);

  const smartColumns = useMemo(() => {
    if (!file) return { recommended: [] as string[], other: [] as string[] };
    const rec = detectSmartColumns(file.columns);
    const other = file.columns.filter((c) => !rec.includes(c));
    return { recommended: rec, other };
  }, [file]);

  useEffect(() => {
    if (file && !columnsAutoSelected) {
      const smart = detectSmartColumns(file.columns);
      if (smart.length > 0) {
        setInputColumns(smart);
        setColumnsAutoSelected(true);
      }
    }
  }, [file, columnsAutoSelected]);

  /* ---- handlers ---- */
  const validateKey = async () => {
    if (!apiKey.trim()) { setKeyError("Please enter an API key"); return; }
    setValidating(true); setKeyError(""); setKeyWarning("");
    try {
      const res = await fetch("/api/validate-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey: apiKey.trim() }) });
      const data = await res.json();
      if (data.valid) { setKeyValid(true); if (data.warning) setKeyWarning(data.warning); } else { setKeyError(data.error || "Invalid API key"); }
    } catch { setKeyError("Validation failed. Try again."); }
    finally { setValidating(false); }
  };

  const handleFile = async (f: File) => {
    setFileError("");
    if (f.size > 10 * 1024 * 1024) { setFileError("File exceeds 10MB limit."); return; }
    try {
      const parsed = await parseFile(f);
      if (parsed.totalRows === 0) { setFileError("File is empty."); return; }
      setFile(parsed);
      setInputColumns([]); setOutputColumns([]); setAutoDetected(false); setColumnsAutoSelected(false);
      setShowAllColumns(false);
      setTestDone(false); setTestResults([]); setFullDone(false); setFullResults([]);
    } catch (err) { setFileError((err as Error).message); }
  };

  const toggleColumn = (col: string) => setInputColumns((p) => p.includes(col) ? p.filter((c) => c !== col) : [...p, col]);

  const addOutputColumn = () => {
    const name = newColumnName.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (outputColumns.some((c) => c.key === key)) return;
    setOutputColumns((p) => [...p, { key, label: name }]);
    setNewColumnName("");
  };

  const removeOutputColumn = (key: string) => setOutputColumns((p) => p.filter((c) => c.key !== key));

  const handleDescriptionBlur = () => {
    if (outputColumns.length === 0 && enrichmentDescription.trim()) {
      const detected = detectOutputColumns(enrichmentDescription);
      if (detected.length > 0) { setOutputColumns(detected); setAutoDetected(true); }
    }
  };

  const applyTemplate = (template: typeof PROMPT_TEMPLATES[0]) => {
    setEnrichmentDescription(template.description);
    const detected = detectOutputColumns(template.description);
    if (detected.length > 0) { setOutputColumns(detected); setAutoDetected(true); }
  };

  const enrichSingleRow = useCallback(async (row: Record<string, string>, index: number): Promise<EnrichmentResult> => {
    const prompt = buildPrompt(inputColumns, row, outputColumns, enrichmentDescription, advancedMode ? customPrompt : undefined, useWebSearch);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = provider === "anthropic"
          ? await enrichRowAnthropic(apiKey, modelId as AnthropicModelId, prompt, useWebSearch)
          : provider === "grok"
          ? await enrichRowGrok(apiKey, modelId as GrokModelId, prompt, useWebSearch)
          : provider === "openai"
          ? await enrichRowOpenAI(apiKey, modelId as OpenAIModelId, prompt, useWebSearch)
          : await enrichRowGemini(apiKey, modelId as GeminiModelId, prompt, useWebSearch);
        return { rowIndex: index, success: true, data: result.data, inputTokens: result.inputTokens, outputTokens: result.outputTokens };
      } catch (err) {
        if (attempt === 2) return { rowIndex: index, success: false, data: {}, error: (err as Error).message };
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    return { rowIndex: index, success: false, data: {}, error: "Max retries" };
  }, [inputColumns, outputColumns, enrichmentDescription, advancedMode, customPrompt, provider, apiKey, modelId, useWebSearch]);

  const runTest = async () => {
    if (!file) return;
    setTestRunning(true); setTestResults([]); setTestDone(false); setRealCostEstimate(null);
    const rows = file.rows.slice(0, 3);
    const results: EnrichmentResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = await enrichSingleRow(rows[i], i);
      results.push(r);
      setTestResults([...results]);
    }
    const successResults = results.filter((r) => r.success && r.inputTokens && r.outputTokens);
    if (successResults.length > 0) {
      const avgInput = Math.round(successResults.reduce((s, r) => s + (r.inputTokens || 0), 0) / successResults.length);
      const avgOutput = Math.round(successResults.reduce((s, r) => s + (r.outputTokens || 0), 0) / successResults.length);
      const precise = calculateCostFromActualTokens(file.totalRows, avgInput, avgOutput, provider, modelId, useWebSearch);
      setRealCostEstimate(precise);
    }
    setTestDone(true); setTestRunning(false);
  };

  const runFull = async () => {
    if (!file) return;
    setFullRunning(true); setFullDone(false); setFullCompleted(0); setFullFailed(0); setFullResults([]);
    stopRef.current = false; pauseRef.current = false; setFullPaused(false);
    const all: EnrichmentResult[] = new Array(file.rows.length);
    let done = 0, fail = 0, nextIdx = 0;
    const worker = async () => {
      while (nextIdx < file.rows.length) {
        if (stopRef.current) return;
        while (pauseRef.current) { await new Promise((r) => setTimeout(r, 200)); if (stopRef.current) return; }
        const idx = nextIdx++;
        if (idx >= file.rows.length) return;
        const r = await enrichSingleRow(file.rows[idx], idx);
        all[idx] = r;
        r.success ? done++ : fail++;
        setFullCompleted(done); setFullFailed(fail); setFullResults([...all.filter(Boolean)]);
      }
    };
    await Promise.all(Array.from({ length: 3 }, () => worker()));
    setFullRunning(false); setFullDone(true);
  };

  const handleDownload = () => {
    if (!file) return;
    const enriched = file.rows.map((_, i) => {
      const r = fullResults.find((x) => x.rowIndex === i);
      if (r?.success) return r.data;
      const empty: Record<string, string> = {};
      for (const c of outputColumns) empty[c.key] = r ? `Error: ${r.error || "Failed"}` : "";
      return empty;
    });
    const blob = exportToFile(file, enriched, outputColumns.map((c) => c.key));
    const ext = file.fileType === "csv" ? "csv" : "xlsx";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${file.fileName.replace(/\.[^.]+$/, "")}_enriched.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const providerPricingUrl = provider === "anthropic" ? ANTHROPIC_PRICING_URL : provider === "grok" ? GROK_PRICING_URL : provider === "openai" ? OPENAI_PRICING_URL : GEMINI_PRICING_URL;

  /* ---- render ---- */
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="OpenClay" className="h-7 w-7 rounded-lg" />
            <span className="text-base font-bold">OpenClay</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              Your data stays in your browser
            </div>
            <span className="hidden rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200 sm:inline-flex">100% free</span>
            <a href="https://www.linkedin.com/in/-raghav/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-[11px] text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900 sm:inline-flex" title="Feedback? Connect with the creator">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Feedback
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* ============ LEFT COLUMN ============ */}
          <div className="min-w-0 space-y-5">

            {/* --- 1. Upload File --- */}
            <Card glow={!file}>
              <StepHeader num={1} title="Upload your spreadsheet" subtitle="CSV, XLS, or XLSX — max 10MB" done={!!file} active={!file} />
              {!file ? (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-12 transition ${dragging ? "border-zinc-400 bg-zinc-100" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"}`}>
                    <svg className="mb-3 h-10 w-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    <p className="text-sm font-medium text-zinc-700">Drop your file here or click to browse</p>
                    <p className="mt-1 text-xs text-zinc-400">.xlsx, .xls, or .csv</p>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
                  </div>
                  {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
                  <TrustBadge text="Files are parsed in your browser. Nothing is uploaded to any server." />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200">
                    <div>
                      <p className="text-xs font-medium text-zinc-900">{file.fileName}</p>
                      <p className="text-[11px] text-zinc-500">{file.totalRows} rows &middot; {file.columns.length} columns</p>
                    </div>
                    <button onClick={() => { setFile(null); setInputColumns([]); setOutputColumns([]); setTestDone(false); setFullDone(false); setColumnsAutoSelected(false); }} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-zinc-200">
                    <div className="max-h-48 overflow-auto">
                      <table className="min-w-full text-[11px]">
                        <thead className="sticky top-0 bg-zinc-50"><tr>{file.columns.map((c) => <th key={c} className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium text-zinc-600">{c}</th>)}</tr></thead>
                        <tbody>{file.rows.slice(0, 6).map((r, i) => <tr key={i} className="border-t border-zinc-100">{file.columns.map((c) => <td key={c} className="max-w-[160px] truncate whitespace-nowrap px-2.5 py-1.5 text-zinc-500">{r[c]}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* --- 2. Tell us what to enrich --- */}
            <Card className={!file ? "opacity-30 pointer-events-none" : ""} glow={!!file && !describeReady}>
              <StepHeader num={2} title="Tell us what to enrich" subtitle="Describe what you need, and we'll handle the rest" done={!!describeReady} active={!!file && !describeReady} />

              {/* Visual flow diagram */}
              {file && (
                <div className="mb-5 flex items-center justify-center gap-3 rounded-xl bg-zinc-50 px-4 py-3 text-[11px] ring-1 ring-zinc-100">
                  <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 ring-1 ring-zinc-200">
                    <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.375" /></svg>
                    <span className="text-zinc-500">Your columns</span>
                  </div>
                  <svg className="h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 ring-1 ring-blue-200">
                    <svg className="h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                    <span className="text-blue-700">AI + Web Search</span>
                  </div>
                  <svg className="h-3.5 w-3.5 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200">
                    <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-emerald-700">New columns added</span>
                  </div>
                </div>
              )}

              {/* A: Select input columns */}
              {file && (
                <div className="mb-5">
                  <label className="mb-2 flex items-center text-xs font-medium text-zinc-700">
                    Columns to look up
                    <InfoTip text="Select columns that contain the data AI should search for." />
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {smartColumns.recommended.map((col) => (
                      <button key={col} onClick={() => toggleColumn(col)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${inputColumns.includes(col) ? "border-zinc-400 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"}`}>
                        {col}
                      </button>
                    ))}
                  </div>

                  {smartColumns.other.length > 0 && (
                    <div className="mt-2">
                      {showAllColumns ? (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {smartColumns.other.map((col) => (
                              <button key={col} onClick={() => toggleColumn(col)}
                                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${inputColumns.includes(col) ? "border-zinc-400 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"}`}>
                                {col}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => setShowAllColumns(false)} className="mt-2 text-[11px] text-zinc-400 hover:text-zinc-700">Show less</button>
                        </>
                      ) : (
                        <button onClick={() => setShowAllColumns(true)} className="mt-1 text-[11px] text-zinc-400 hover:text-zinc-700">
                          + {smartColumns.other.length} more columns
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* B: Describe what AI should find */}
              <div className="mb-5">
                <label className="mb-2 flex items-center text-xs font-medium text-zinc-700">
                  What should AI find for each row?
                  <InfoTip text="Describe in plain English. We'll auto-suggest output columns." />
                </label>
                <textarea
                  value={enrichmentDescription}
                  onChange={(e) => { setEnrichmentDescription(e.target.value); if (autoDetected) { setAutoDetected(false); } }}
                  onBlur={handleDescriptionBlur}
                  rows={3}
                  placeholder="e.g. Find the CEO name, total funding raised, employee count, and a brief company description"
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:outline-none"
                />

                {/* Prompt templates */}
                <div className="mt-2.5">
                  {!enrichmentDescription && <p className="mb-1.5 text-[11px] text-zinc-400">Or start from a template:</p>}
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_TEMPLATES.map((t) => (
                      <button key={t.label} onClick={() => applyTemplate(t)}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900">
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* C: New columns to add */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <label className="mb-3 flex items-center text-xs font-medium text-zinc-700">
                  <svg className="mr-1.5 h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  New columns to add
                  <InfoTip text="These columns will be filled with AI-generated data for each row." />
                </label>

                {outputColumns.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {outputColumns.map((col) => (
                      <span key={col.key} className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {col.label}
                        <button onClick={() => removeOutputColumn(col.key)} className="text-emerald-400 hover:text-red-500 transition">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOutputColumn(); } }}
                    placeholder="Type a column name, e.g. CEO Name"
                    className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:outline-none"
                  />
                  <button onClick={addOutputColumn} disabled={!newColumnName.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-30">
                    Add
                  </button>
                </div>
              </div>

              {/* Advanced */}
              <div className="mt-4 border-t border-zinc-200 pt-3">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={advancedMode}
                    onChange={(e) => { setAdvancedMode(e.target.checked); if (e.target.checked && generatedPrompt) setCustomPrompt(generatedPrompt); }}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300" />
                  <span className="text-zinc-500">Advanced: Edit the prompt template</span>
                </label>
                {advancedMode && (
                  <div className="mt-2">
                    <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={8}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[11px] text-zinc-700 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:outline-none" />
                    <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
                      <span>Use {"{column_name}"} to reference columns</span>
                      <button onClick={() => setCustomPrompt(generatedPrompt)} className="text-zinc-500 hover:text-zinc-900">Reset to generated</button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* --- 3. Provider + Model --- */}
            <Card className={!file ? "opacity-30 pointer-events-none" : ""}>
              <StepHeader num={3} title="Choose provider & model" subtitle="All models include live web search" done={!!modelId} active={!!file} />

              <div className="mb-4 grid grid-cols-4 gap-2">
                <button onClick={() => { setProvider("gemini"); setModelId("gemini-3.1-pro-preview"); setKeyValid(false); setApiKey(""); setKeyError(""); setKeyWarning(""); setRealCostEstimate(null); }}
                  className={`rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition ${provider === "gemini" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                  Google (Gemini)
                </button>
                <button onClick={() => { setProvider("openai"); setModelId("gpt-5.4-mini"); setKeyValid(false); setApiKey(""); setKeyError(""); setKeyWarning(""); setRealCostEstimate(null); }}
                  className={`rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition ${provider === "openai" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                  OpenAI (GPT)
                </button>
                <button onClick={() => { setProvider("anthropic"); setModelId("claude-sonnet-4-5-20250929"); setKeyValid(false); setApiKey(""); setKeyError(""); setKeyWarning(""); setRealCostEstimate(null); }}
                  className={`rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition ${provider === "anthropic" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                  Anthropic (Claude)
                </button>
                <button onClick={() => { setProvider("grok"); setModelId("grok-4-0320"); setKeyValid(false); setApiKey(""); setKeyError(""); setKeyWarning(""); setRealCostEstimate(null); }}
                  className={`rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition ${provider === "grok" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                  xAI (Grok)
                </button>
              </div>

              <div className="space-y-2">
                {models.map(([id, model]) => {
                  const guidance = MODEL_GUIDANCE[id as ModelId];
                  return (
                    <button key={id} onClick={() => setModelId(id as ModelId)}
                      className={`w-full rounded-lg border-2 px-3 py-3 text-left transition ${modelId === id ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{model.name}</span>
                          {model.recommended && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">Recommended</span>}
                        </div>
                        <span className="text-[11px] text-zinc-400">${model.inputPer1M} / ${model.outputPer1M} per 1M tokens</span>
                      </div>
                      {guidance && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SPEED_COLORS[guidance.speed]}`}>
                            {guidance.speed === "fast" ? "Fast" : guidance.speed === "medium" ? "Medium" : "Slow"}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${QUALITY_COLORS[guidance.quality]}`}>
                            {guidance.quality === "good" ? "Good" : guidance.quality === "great" ? "Great" : "Best"} quality
                          </span>
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200">Web search</span>
                          <InfoTip text={guidance.bestFor} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-zinc-400">Not sure? The recommended model is a great default for most tasks.</p>

              {/* Web search toggle */}
              <div className="mt-4 border-t border-zinc-200 pt-3">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={useWebSearch}
                    onChange={(e) => { setUseWebSearch(e.target.checked); setRealCostEstimate(null); }}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300" />
                  <span className="text-zinc-700">Enable web search</span>
                  <InfoTip text="Web search lets AI look up live data from the internet. Disable to use AI knowledge only (cheaper but may be outdated)." />
                </label>
                {!useWebSearch && (
                  <p className="mt-1.5 ml-6 text-[11px] text-amber-600">AI will use its training data only — results may not reflect the latest information.</p>
                )}
              </div>
            </Card>

            {/* --- 4. API Key --- */}
            <Card className={!configReady ? "opacity-30 pointer-events-none" : ""} glow={!!configReady && !keyValid}>
              <StepHeader
                num={4}
                title={`Connect your ${provider === "anthropic" ? "Anthropic" : provider === "grok" ? "xAI" : provider === "openai" ? "OpenAI" : "Google"} API key`}
                subtitle="Your key is never stored — it stays in browser memory only"
                done={keyValid}
                active={!!configReady && !keyValid}
              />

              {!keyValid ? (
                <div className="space-y-3">
                  <input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setKeyError(""); }}
                    placeholder={provider === "anthropic" ? "sk-ant-..." : provider === "grok" ? "xai-..." : provider === "openai" ? "sk-..." : "AIza..."}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:outline-none"
                  />
                  {keyError && <p className="text-xs text-red-600">{keyError}</p>}
                  <button onClick={validateKey} disabled={validating || !apiKey.trim()}
                    className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
                    {validating ? "Validating..." : "Validate & Connect"}
                  </button>
                  <p className="text-center text-[11px] text-zinc-400">
                    {provider === "anthropic" && <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline hover:text-zinc-900">Get a key from Anthropic</a>}
                    {provider === "gemini" && <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline hover:text-zinc-900">Get a key from Google AI Studio</a>}
                    {provider === "openai" && <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline hover:text-zinc-900">Get a key from OpenAI</a>}
                    {provider === "grok" && <a href="https://console.x.ai" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline hover:text-zinc-900">Get a key from xAI Console</a>}
                  </p>
                  <TrustBadge text="Your API key is never stored, logged, or sent to our servers. It goes directly from your browser to the AI provider." />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                    <span className="text-xs font-medium text-emerald-700">
                      {provider === "anthropic" ? "Anthropic" : provider === "grok" ? "Grok" : "Gemini"} connected
                    </span>
                    <button onClick={() => { setKeyValid(false); setApiKey(""); setKeyWarning(""); }} className="text-xs text-red-500 hover:text-red-700">Disconnect</button>
                  </div>
                  {keyWarning && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700 ring-1 ring-amber-200">{keyWarning}</p>}
                </div>
              )}
            </Card>

            {/* --- 5. Test, Run & Download --- */}
            <Card className={!runReady ? "opacity-30 pointer-events-none" : ""} glow={!!runReady && !fullDone}>
              <StepHeader num={5} title="Preview, run & download" subtitle="Test on 3 rows first, then run all" done={fullDone} active={!!runReady && !fullDone} />

              {!testDone && !testRunning && (
                <div>
                  <p className="mb-3 text-xs text-zinc-500">
                    We&apos;ll test with the first 3 rows so you can verify results before running the full batch.
                  </p>
                  <button onClick={runTest} disabled={!runReady}
                    className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
                    Preview with first {file ? Math.min(3, file.totalRows) : 3} rows
                  </button>
                </div>
              )}

              {(testRunning || testDone) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-zinc-900 transition-all" style={{ width: `${(testResults.length / Math.min(3, file?.totalRows || 3)) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-zinc-500">{testResults.length}/{Math.min(3, file?.totalRows || 3)}</span>
                  </div>

                  {testResults.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-zinc-200">
                      <div className="max-h-72 overflow-auto">
                        <table className="min-w-full text-[11px]">
                          <thead className="sticky top-0 bg-zinc-50">
                            <tr>
                              {inputColumns.map((c) => <th key={c} className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-zinc-500">{c}</th>)}
                              {outputColumns.map((c) => <th key={c.key} className="whitespace-nowrap bg-emerald-50 px-2 py-1.5 text-left font-medium text-emerald-700">{c.label}</th>)}
                              <th className="px-2 py-1.5 text-left font-medium text-zinc-400">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testResults.map((r, i) => (
                              <tr key={i} className="border-t border-zinc-100">
                                {inputColumns.map((c) => <td key={c} className="max-w-[120px] truncate whitespace-nowrap px-2 py-1.5 text-zinc-500">{file?.rows[i]?.[c]}</td>)}
                                {outputColumns.map((c) => <td key={c.key} className="max-w-[180px] truncate whitespace-nowrap bg-emerald-50/50 px-2 py-1.5 text-emerald-800">{r.data[c.key] || "-"}</td>)}
                                <td className="px-2 py-1.5">{r.success ? <span className="font-medium text-emerald-600">OK</span> : <span className="font-medium text-red-600" title={r.error}>Err</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {testDone && !fullRunning && !fullDone && (
                    <div className="flex gap-2">
                      <button onClick={() => { setTestDone(false); setTestResults([]); }}
                        className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                        Adjust & re-test
                      </button>
                      <button onClick={runFull}
                        className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500">
                        Looks good — Run all {file?.totalRows} rows
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(fullRunning || fullDone) && (
                <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{fullCompleted + fullFailed} / {file?.totalRows} processed</span>
                    <span className="tabular-nums">{fullCompleted} OK &middot; {fullFailed} failed</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className={`h-full rounded-full transition-all ${fullDone ? "bg-emerald-500" : "bg-zinc-900"}`} style={{ width: `${((fullCompleted + fullFailed) / (file?.totalRows || 1)) * 100}%` }} />
                  </div>

                  {fullRunning && (
                    <div className="flex gap-2">
                      <button onClick={() => { pauseRef.current = !pauseRef.current; setFullPaused(!fullPaused); }}
                        className="flex-1 rounded-lg border border-zinc-200 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                        {fullPaused ? "Resume" : "Pause"}
                      </button>
                      <button onClick={() => { stopRef.current = true; pauseRef.current = false; setFullRunning(false); setFullDone(true); }}
                        className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Stop</button>
                    </div>
                  )}

                  {fullDone && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                        <p className="text-sm font-semibold text-emerald-800">Enrichment complete</p>
                        <p className="mt-0.5 text-xs text-emerald-600">{fullCompleted} rows enriched{fullFailed > 0 ? `, ${fullFailed} failed` : ""}. {outputColumns.length} new columns added.</p>
                      </div>
                      <button onClick={handleDownload}
                        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                        Download Enriched File
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Disclaimer */}
            <p className="px-2 text-center text-[10px] leading-relaxed text-zinc-400">
              Disclaimer: OpenClay is provided as-is. AI-generated data may be inaccurate — always verify results. We are not responsible for the accuracy or consequences of any output. Use at your own risk.
            </p>
          </div>

          {/* ============ RIGHT COLUMN — Sidebar ============ */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">

              {/* Estimate sidebar */}
              <Card>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {realCostEstimate ? "Precise Estimate" : "Estimate"}
                </h3>
                {realCostEstimate ? (
                  <div className="space-y-3">
                    {/* Total — hero treatment */}
                    <div className="rounded-xl bg-zinc-50 px-4 py-3 text-center ring-1 ring-zinc-100">
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">Estimated Total</span>
                      <span className="text-2xl font-bold text-zinc-900">~${realCostEstimate.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-400">Rows</span><span className="font-medium text-zinc-700">{realCostEstimate.totalRows.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Model</span><span className="font-medium text-zinc-700">{realCostEstimate.modelName}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">New columns</span><span className="font-medium text-zinc-700">{outputColumns.length}</span></div>
                    </div>
                    <div className="border-t border-zinc-100 pt-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-400">Platform fee</span><span className="font-semibold text-emerald-600">Free</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Input tokens</span><span className="text-zinc-600">${realCostEstimate.inputCost.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Output tokens</span><span className="text-zinc-600">${realCostEstimate.outputCost.toFixed(2)}</span></div>
                      {realCostEstimate.searchCost > 0 && (
                        <div className="flex justify-between"><span className="text-zinc-400">Web search</span><span className="text-zinc-600">${realCostEstimate.searchCost.toFixed(2)}</span></div>
                      )}
                    </div>
                    {realCostEstimate.freeSearchNote && <p className="text-[11px] text-emerald-600">{realCostEstimate.freeSearchNote}</p>}
                    <p className="text-center text-[10px] text-emerald-600">Based on your test run</p>
                  </div>
                ) : costRange ? (
                  <div className="space-y-3">
                    {/* Total range — hero treatment */}
                    <div className="rounded-xl bg-zinc-50 px-4 py-3 text-center ring-1 ring-zinc-100">
                      <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-400">Estimated Range</span>
                      <span className="text-2xl font-bold text-zinc-900">${costRange.low.totalCost.toFixed(2)} – ${costRange.high.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-400">Rows</span><span className="font-medium text-zinc-700">{costRange.low.totalRows.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Model</span><span className="font-medium text-zinc-700">{costRange.low.modelName}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">New columns</span><span className="font-medium text-zinc-700">{outputColumns.length}</span></div>
                    </div>
                    <div className="border-t border-zinc-100 pt-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-400">Platform fee</span><span className="font-semibold text-emerald-600">Free</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Input tokens</span><span className="text-zinc-600">${costRange.low.inputCost.toFixed(2)} – ${costRange.high.inputCost.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-400">Output tokens</span><span className="text-zinc-600">${costRange.low.outputCost.toFixed(2)}</span></div>
                      {costRange.high.searchCost > 0 && (
                        <div className="flex justify-between"><span className="text-zinc-400">Web search</span><span className="text-zinc-600">${costRange.low.searchCost.toFixed(2)}</span></div>
                      )}
                    </div>
                    {costRange.low.freeSearchNote && <p className="text-[11px] text-emerald-600">{costRange.low.freeSearchNote}</p>}
                    <p className="text-center text-[10px] text-amber-600">{useWebSearch ? "Run a test for a precise estimate" : "Estimate based on prompt tokens"}</p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">Upload a file and describe your enrichment to see an estimate.</p>
                )}
              </Card>

              {/* Privacy */}
              <Card>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Privacy</h3>
                <ul className="space-y-1.5 text-[11px] text-zinc-500">
                  {["API key in browser memory only", "Files parsed client-side", "No database, no cookies", "100% open source"].map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Feedback */}
              <Card>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Feedback</h3>
                <p className="text-[11px] text-zinc-500 mb-2.5">Found a bug? Have a feature idea?</p>
                <a
                  href="https://www.linkedin.com/in/-raghav/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-transparent px-3 py-2 text-[11px] text-zinc-400 transition hover:border-zinc-200 hover:text-zinc-600"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Connect with me
                </a>
              </Card>

              <div className="text-center text-[10px] text-zinc-400">
                <p>Pricing last updated: {PRICING_LAST_UPDATED}</p>
                <p className="mt-0.5"><a href={providerPricingUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 underline hover:text-zinc-900">Official pricing</a></p>
                <div className="mt-2 flex items-center justify-center gap-4">
                  <Link href="/privacy" className="hover:text-zinc-900">Privacy</Link>
                  <Link href="/terms" className="hover:text-zinc-900">Terms</Link>
                  <Link href="/data" className="hover:text-zinc-900">Data</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile estimate bar */}
      {(realCostEstimate || costRange) && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/90 p-3 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">{(realCostEstimate || costRange?.low)?.totalRows.toLocaleString()} rows &middot; {(realCostEstimate || costRange?.low)?.modelName}</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 text-[10px]">Platform: $0</span>
              {realCostEstimate ? (
                <span className="font-bold text-zinc-900">~${realCostEstimate.totalCost.toFixed(2)}</span>
              ) : costRange ? (
                <span className="font-bold text-zinc-900">${costRange.low.totalCost.toFixed(2)} – ${costRange.high.totalCost.toFixed(2)}</span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
