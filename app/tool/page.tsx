"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import type {
  Provider,
  ModelId,
  OutputColumn,
  ParsedFile,
  EnrichmentResult,
  AnthropicModelId,
  GeminiModelId,
} from "@/lib/types";
import {
  ANTHROPIC_MODELS,
  GEMINI_MODELS,
  MODEL_GUIDANCE,
  PRICING_LAST_UPDATED,
  ANTHROPIC_PRICING_URL,
  GEMINI_PRICING_URL,
} from "@/lib/pricing";
import { buildPrompt } from "@/lib/promptTemplates";
import { estimateInputTokensPerRow, estimateOutputTokensPerRow, calculateCostEstimate } from "@/lib/costEstimator";
import { parseFile, exportToFile } from "@/lib/fileParser";
import { enrichRowAnthropic } from "@/lib/anthropic";
import { enrichRowGemini } from "@/lib/gemini";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

function StepHeader({ num, title, subtitle, done, active }: { num: number; title: string; subtitle?: string; done: boolean; active: boolean }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${done ? "bg-emerald-500 text-white" : active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400"}`}>
        {done ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        ) : num}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
      </div>
    </div>
  );
}

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-700">
      <svg className="mt-0.5 h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
      {text}
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative ml-1 inline-flex cursor-help">
      <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-[11px] leading-relaxed text-zinc-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

const SPEED_COLORS = { fast: "bg-emerald-100 text-emerald-700", medium: "bg-amber-100 text-amber-700", slow: "bg-red-100 text-red-700" };
const QUALITY_COLORS = { good: "bg-zinc-100 text-zinc-600", great: "bg-blue-100 text-blue-700", best: "bg-purple-100 text-purple-700" };

/** Try to extract output column names from a free-text description */
function detectOutputColumns(description: string): OutputColumn[] {
  if (!description.trim()) return [];
  // Look for patterns like "find the X, Y, and Z" or "get X, Y, Z for each"
  // Also handle "their X, Y, and Z" or "the X, the Y, the Z"
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

  // Split on commas and "and"
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

  // Step 1: File
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Describe + Output columns (merged)
  const [enrichmentDescription, setEnrichmentDescription] = useState("");
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [outputColumns, setOutputColumns] = useState<OutputColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [autoDetected, setAutoDetected] = useState(false);

  // Step 3: Provider + Model
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [modelId, setModelId] = useState<ModelId>("claude-sonnet-4-5-20250929");

  // Step 4: API key (deferred — only needed to run)
  const [apiKey, setApiKey] = useState("");
  const [keyValid, setKeyValid] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keyWarning, setKeyWarning] = useState("");

  // Step 5: Test + Run
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

  // Advanced
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  /* ---- derived ---- */
  const models =
    provider === "anthropic"
      ? Object.entries(ANTHROPIC_MODELS)
      : Object.entries(GEMINI_MODELS);

  const describeReady = file && enrichmentDescription.trim().length > 0 && inputColumns.length > 0 && outputColumns.length > 0;

  const generatedPrompt =
    file && inputColumns.length > 0 && outputColumns.length > 0
      ? buildPrompt(inputColumns, file.rows[0], outputColumns, enrichmentDescription)
      : "";

  const configReady = describeReady && (!advancedMode || customPrompt.trim().length > 0);

  const runReady = configReady && keyValid;

  const costEstimate = useMemo(() => {
    if (!file || inputColumns.length === 0 || outputColumns.length === 0) return null;
    const sample = buildPrompt(inputColumns, file.rows[0], outputColumns, enrichmentDescription, advancedMode ? customPrompt : undefined);
    const inp = estimateInputTokensPerRow(sample, provider, modelId);
    const out = estimateOutputTokensPerRow(outputColumns);
    return calculateCostEstimate(file.totalRows, inp, out, provider, modelId);
  }, [file, inputColumns, outputColumns, enrichmentDescription, customPrompt, advancedMode, provider, modelId]);

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
      setInputColumns([]);
      setOutputColumns([]);
      setAutoDetected(false);
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
    // Auto-detect output columns from description if user hasn't manually added any
    if (outputColumns.length === 0 && enrichmentDescription.trim()) {
      const detected = detectOutputColumns(enrichmentDescription);
      if (detected.length > 0) {
        setOutputColumns(detected);
        setAutoDetected(true);
      }
    }
  };

  const enrichSingleRow = useCallback(async (row: Record<string, string>, index: number): Promise<EnrichmentResult> => {
    const prompt = buildPrompt(inputColumns, row, outputColumns, enrichmentDescription, advancedMode ? customPrompt : undefined);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result =
          provider === "anthropic"
            ? await enrichRowAnthropic(apiKey, modelId as AnthropicModelId, prompt)
            : await enrichRowGemini(apiKey, modelId as GeminiModelId, prompt);
        return { rowIndex: index, success: true, data: result.data };
      } catch (err) {
        if (attempt === 2) return { rowIndex: index, success: false, data: {}, error: (err as Error).message };
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    return { rowIndex: index, success: false, data: {}, error: "Max retries" };
  }, [inputColumns, outputColumns, enrichmentDescription, advancedMode, customPrompt, provider, apiKey, modelId]);

  const runTest = async () => {
    if (!file) return;
    setTestRunning(true); setTestResults([]); setTestDone(false);
    const rows = file.rows.slice(0, 3);
    const results: EnrichmentResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = await enrichSingleRow(rows[i], i);
      results.push(r);
      setTestResults([...results]);
    }
    setTestDone(true); setTestRunning(false);
  };

  const runFull = async () => {
    if (!file) return;
    setFullRunning(true); setFullDone(false); setFullCompleted(0); setFullFailed(0); setFullResults([]);
    stopRef.current = false; pauseRef.current = false; setFullPaused(false);

    const all: EnrichmentResult[] = new Array(file.rows.length);
    let done = 0, fail = 0, nextIdx = 0;
    const CONCURRENCY = 3;

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

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
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

  const providerPricingUrl = provider === "anthropic" ? ANTHROPIC_PRICING_URL : GEMINI_PRICING_URL;

  /* ---- render ---- */
  return (
    <div className="min-h-screen bg-zinc-50/60">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">F</div>
            <span className="text-base font-bold text-zinc-900">FreeClay</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            Your data stays in your browser
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* ============ LEFT COLUMN ============ */}
          <div className="min-w-0 space-y-5">

            {/* --- 1. Upload File (FIRST — no barriers) --- */}
            <SectionCard>
              <StepHeader num={1} title="Upload your spreadsheet" subtitle="CSV, XLS, or XLSX — max 10MB" done={!!file} active={!file} />
              {!file ? (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-12 transition ${dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 hover:border-zinc-400"}`}>
                    <svg className="mb-3 h-10 w-10 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    <p className="text-sm font-medium text-zinc-600">Drop your file here or click to browse</p>
                    <p className="mt-1 text-xs text-zinc-400">.xlsx, .xls, or .csv</p>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
                  </div>
                  {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
                  <TrustBadge text="Files are parsed in your browser. Nothing is uploaded to any server." />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-zinc-900">{file.fileName}</p>
                      <p className="text-[11px] text-zinc-400">{file.totalRows} rows &middot; {file.columns.length} columns</p>
                    </div>
                    <button onClick={() => { setFile(null); setInputColumns([]); setOutputColumns([]); setTestDone(false); setFullDone(false); }} className="text-xs text-red-500 hover:text-red-600">Remove</button>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-zinc-200">
                    <div className="max-h-48 overflow-auto">
                      <table className="min-w-full text-[11px]">
                        <thead className="sticky top-0 bg-zinc-50"><tr>{file.columns.map((c) => <th key={c} className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium text-zinc-600">{c}</th>)}</tr></thead>
                        <tbody>{file.rows.slice(0, 6).map((r, i) => <tr key={i} className="border-t border-zinc-50">{file.columns.map((c) => <td key={c} className="max-w-[160px] truncate whitespace-nowrap px-2.5 py-1.5 text-zinc-500">{r[c]}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* --- 2. Describe Enrichment + Input Columns + Output Columns (merged) --- */}
            <SectionCard className={!file ? "opacity-40 pointer-events-none" : ""}>
              <StepHeader num={2} title="Describe what you want" subtitle="Tell us what data you need — we'll suggest the output columns" done={!!(enrichmentDescription.trim() && inputColumns.length > 0 && outputColumns.length > 0)} active={!!file && !(enrichmentDescription.trim() && inputColumns.length > 0 && outputColumns.length > 0)} />

              {file && (
                <div className="mb-4">
                  <label className="mb-1.5 flex items-center text-xs font-medium text-zinc-600">
                    Which columns identify each row?
                    <InfoTooltip text="Select the columns that contain the data to look up. For example, if enriching companies, select the column with company names." />
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {file.columns.map((col) => (
                      <button key={col} onClick={() => toggleColumn(col)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${inputColumns.includes(col) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center text-xs font-medium text-zinc-600">
                  What do you want to find out?
                  <InfoTooltip text="Describe your goal in plain English. When you click away, we'll auto-suggest output columns from your description. You can edit them below." />
                </label>
                <textarea
                  value={enrichmentDescription}
                  onChange={(e) => { setEnrichmentDescription(e.target.value); if (autoDetected) { setAutoDetected(false); } }}
                  onBlur={handleDescriptionBlur}
                  rows={3}
                  placeholder="e.g., Find the CEO name, total funding raised, employee count, and a brief company description for each company"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none"
                />
              </div>

              {/* Output columns */}
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <label className="mb-2 flex items-center text-xs font-medium text-zinc-600">
                  Output columns
                  <InfoTooltip text="These are the new columns that will be added to your file. Auto-detected from your description, or add your own." />
                </label>

                {autoDetected && outputColumns.length > 0 && (
                  <p className="mb-2 text-[11px] text-indigo-600">
                    Auto-detected from your description. Edit or add more below.
                  </p>
                )}

                {outputColumns.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {outputColumns.map((col) => (
                      <span key={col.key} className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                        {col.label}
                        <button onClick={() => removeOutputColumn(col.key)} className="text-zinc-400 hover:text-red-500">
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
                    placeholder="Add a column, e.g. CEO Name"
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none"
                  />
                  <button onClick={addOutputColumn} disabled={!newColumnName.trim()}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>

              {/* Advanced prompt editing */}
              <div className="mt-4 border-t border-zinc-100 pt-3">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={advancedMode}
                    onChange={(e) => { setAdvancedMode(e.target.checked); if (e.target.checked && generatedPrompt) setCustomPrompt(generatedPrompt); }}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500" />
                  <span className="text-zinc-500">Advanced: Edit the prompt template</span>
                </label>
                {advancedMode && (
                  <div className="mt-2">
                    <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={8}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-[11px] focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none" />
                    <div className="mt-1 flex justify-between text-[11px] text-zinc-400">
                      <span>Use {"{column_name}"} to reference columns</span>
                      <button onClick={() => setCustomPrompt(generatedPrompt)} className="text-zinc-600 hover:text-zinc-900">Reset to generated</button>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* --- 3. Provider + Model --- */}
            <SectionCard className={!file ? "opacity-40 pointer-events-none" : ""}>
              <StepHeader num={3} title="Choose provider & model" subtitle="All models include live web search for accurate results" done={!!modelId} active={!!file} />

              {/* Provider tabs */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button onClick={() => { setProvider("anthropic"); setModelId("claude-sonnet-4-5-20250929"); setKeyValid(false); setApiKey(""); setKeyError(""); setKeyWarning(""); }}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition ${provider === "anthropic" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                  Anthropic (Claude)
                </button>
                <button onClick={() => { setProvider("gemini"); setModelId("gemini-2.5-pro"); setKeyValid(false); setApiKey(""); setKeyError(""); setKeyWarning(""); }}
                  className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition ${provider === "gemini" ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>
                  Google (Gemini)
                </button>
              </div>

              {/* Model list */}
              <div className="space-y-2">
                {models.map(([id, model]) => {
                  const guidance = MODEL_GUIDANCE[id as ModelId];
                  return (
                    <button key={id} onClick={() => setModelId(id as ModelId)}
                      className={`w-full rounded-lg border-2 px-3 py-3 text-left transition ${modelId === id ? "border-zinc-900 bg-zinc-50" : "border-zinc-100 hover:border-zinc-200"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-900">{model.name}</span>
                          {model.recommended && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Recommended</span>}
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
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">Web search</span>
                          <InfoTooltip text={guidance.bestFor} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            {/* --- 4. API Key (deferred) --- */}
            <SectionCard className={!configReady ? "opacity-40 pointer-events-none" : ""}>
              <StepHeader
                num={4}
                title={`Connect your ${provider === "anthropic" ? "Anthropic" : "Google"} API key`}
                subtitle="Your key is never stored — it stays in browser memory only"
                done={keyValid}
                active={!!configReady && !keyValid}
              />

              {!keyValid ? (
                <div className="space-y-3">
                  <input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setKeyError(""); }}
                    placeholder={provider === "anthropic" ? "sk-ant-..." : "AIza..."}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 focus:outline-none"
                  />
                  {keyError && <p className="text-xs text-red-600">{keyError}</p>}
                  <button onClick={validateKey} disabled={validating || !apiKey.trim()}
                    className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
                    {validating ? "Validating..." : "Validate & Connect"}
                  </button>
                  <p className="text-center text-[11px] text-zinc-400">
                    {provider === "anthropic" && <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline">Get a key from Anthropic</a>}
                    {provider === "gemini" && <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline">Get a key from Google AI Studio</a>}
                  </p>
                  <TrustBadge text="Your API key is never stored, logged, or sent to our servers. It goes directly from your browser to the AI provider." />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                    <span className="text-xs font-medium text-emerald-700">
                      {provider === "anthropic" ? "Anthropic" : "Gemini"} connected
                    </span>
                    <button onClick={() => { setKeyValid(false); setApiKey(""); setKeyWarning(""); }} className="text-xs text-red-500 hover:text-red-600">Disconnect</button>
                  </div>
                  {keyWarning && <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">{keyWarning}</p>}
                </div>
              )}
            </SectionCard>

            {/* --- 5. Test Preview, Full Run & Download --- */}
            <SectionCard className={!runReady ? "opacity-40 pointer-events-none" : ""}>
              <StepHeader num={5} title="Preview, run & download" subtitle="Test on 3 rows first, then run all" done={fullDone} active={!!runReady && !fullDone} />

              {/* Test button */}
              {!testDone && !testRunning && (
                <div>
                  <p className="mb-3 text-xs text-zinc-500">
                    We&apos;ll test with the first 3 rows so you can verify the results before running the full batch.
                  </p>
                  <button onClick={runTest} disabled={!runReady}
                    className="w-full rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50">
                    Preview with first {file ? Math.min(3, file.totalRows) : 3} rows
                  </button>
                </div>
              )}

              {/* Test progress + results */}
              {(testRunning || testDone) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
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
                              <tr key={i} className="border-t border-zinc-50">
                                {inputColumns.map((c) => <td key={c} className="max-w-[120px] truncate whitespace-nowrap px-2 py-1.5 text-zinc-500">{file?.rows[i]?.[c]}</td>)}
                                {outputColumns.map((c) => <td key={c.key} className="max-w-[180px] truncate whitespace-nowrap bg-emerald-50/40 px-2 py-1.5 text-emerald-800">{r.data[c.key] || "-"}</td>)}
                                <td className="px-2 py-1.5">{r.success ? <span className="font-medium text-emerald-600">OK</span> : <span className="font-medium text-red-500" title={r.error}>Err</span>}</td>
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
                        className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
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

              {/* Full run progress */}
              {(fullRunning || fullDone) && (
                <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{fullCompleted + fullFailed} / {file?.totalRows} processed</span>
                    <span className="tabular-nums">{fullCompleted} OK &middot; {fullFailed} failed</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div className={`h-full rounded-full transition-all ${fullDone ? "bg-emerald-500" : "bg-zinc-900"}`} style={{ width: `${((fullCompleted + fullFailed) / (file?.totalRows || 1)) * 100}%` }} />
                  </div>

                  {fullRunning && (
                    <div className="flex gap-2">
                      <button onClick={() => { pauseRef.current = !pauseRef.current; setFullPaused(!fullPaused); }}
                        className="flex-1 rounded-lg border border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                        {fullPaused ? "Resume" : "Pause"}
                      </button>
                      <button onClick={() => { stopRef.current = true; pauseRef.current = false; setFullRunning(false); setFullDone(true); }}
                        className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Stop</button>
                    </div>
                  )}

                  {fullDone && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-800">Enrichment complete</p>
                        <p className="mt-0.5 text-xs text-emerald-600">{fullCompleted} rows enriched successfully{fullFailed > 0 ? `, ${fullFailed} failed` : ""}. {outputColumns.length} new columns added.</p>
                      </div>
                      <button onClick={handleDownload}
                        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                        Download Enriched File
                      </button>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ============ RIGHT COLUMN — Cost sidebar ============ */}
          <div className="hidden lg:block">
            <div className="sticky top-20 space-y-4">

              {/* Cost estimate — works WITHOUT API key */}
              <SectionCard>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Cost Estimate</h3>
                {costEstimate ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-500">Rows</span><span className="font-medium text-zinc-900">{costEstimate.totalRows.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Model</span><span className="font-medium text-zinc-900">{costEstimate.modelName}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Output fields</span><span className="font-medium text-zinc-900">{outputColumns.length}</span></div>
                    </div>
                    <div className="border-t border-zinc-100 pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-500">Input tokens</span><span className="text-zinc-700">${costEstimate.inputCost.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Output tokens</span><span className="text-zinc-700">${costEstimate.outputCost.toFixed(2)}</span></div>
                      {costEstimate.searchCost > 0 && (
                        <div className="flex justify-between"><span className="text-zinc-500">Web search</span><span className="text-zinc-700">${costEstimate.searchCost.toFixed(2)}</span></div>
                      )}
                    </div>
                    {costEstimate.freeSearchNote && <p className="text-[11px] text-emerald-600">{costEstimate.freeSearchNote}</p>}
                    <div className="border-t border-zinc-100 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Estimated Total</span>
                      <span className="text-lg font-bold text-zinc-900">~${costEstimate.totalCost.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400">Actual costs may vary +/-20%. You pay the AI provider directly.</p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">Upload a file and configure enrichment to see your cost estimate. No API key needed.</p>
                )}
              </SectionCard>

              {/* Privacy */}
              <SectionCard>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Privacy</h3>
                <ul className="space-y-1.5 text-[11px] text-zinc-500">
                  {["API key in browser memory only", "Files parsed client-side", "No database, no cookies", "No analytics or tracking", "100% open source"].map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <div className="text-center text-[10px] text-zinc-400">
                <p>Pricing last updated: {PRICING_LAST_UPDATED}</p>
                <p className="mt-0.5"><a href={providerPricingUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-500 underline">Official pricing</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile cost bar */}
      {costEstimate && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white p-3 shadow-lg lg:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">{costEstimate.totalRows.toLocaleString()} rows &middot; {costEstimate.modelName}</span>
            <span className="font-bold text-zinc-900">~${costEstimate.totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
