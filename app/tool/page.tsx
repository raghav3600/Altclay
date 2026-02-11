"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import type {
  Provider,
  ModelId,
  EnrichmentCategory,
  EnrichmentField,
  ParsedFile,
  EnrichmentResult,
  AnthropicModelId,
  GeminiModelId,
} from "@/lib/types";
import { ANTHROPIC_MODELS, GEMINI_MODELS, PRICING_LAST_UPDATED, ANTHROPIC_PRICING_URL, GEMINI_PRICING_URL } from "@/lib/pricing";
import { CATEGORY_PRESETS, getPreset, buildPrompt } from "@/lib/promptTemplates";
import { estimateInputTokensPerRow, estimateOutputTokensPerRow, calculateCostEstimate } from "@/lib/costEstimator";
import { parseFile, exportToFile } from "@/lib/fileParser";
import { enrichRowAnthropic } from "@/lib/anthropic";
import { enrichRowGemini } from "@/lib/gemini";

/* ------------------------------------------------------------------ */
/*  Tiny helper components                                             */
/* ------------------------------------------------------------------ */

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

function SectionTitle({ num, title, done, active }: { num: number; title: string; done: boolean; active: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"}`}>
        {done ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        ) : num}
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

function TrustBadge({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-700">
      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
      {text}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ToolPage() {
  // --- state ---
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [keyValid, setKeyValid] = useState(false);
  const [validating, setValidating] = useState(false);
  const [keyError, setKeyError] = useState("");

  const [file, setFile] = useState<ParsedFile | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modelId, setModelId] = useState<ModelId>("claude-sonnet-4-5-20250929");
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [category, setCategory] = useState<EnrichmentCategory>("companies");
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<Set<string>>(new Set());
  const [customFields, setCustomFields] = useState<EnrichmentField[]>([]);
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldDesc, setCustomFieldDesc] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  // test + run
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

  // derived
  const preset = getPreset(category);
  const availableFields = category === "custom" ? customFields : preset.fields;
  const selectedFields = availableFields.filter((f) => selectedFieldKeys.has(f.key));

  const models = provider === "anthropic" ? Object.entries(ANTHROPIC_MODELS) : Object.entries(GEMINI_MODELS);

  const generatedPrompt = (file && inputColumns.length > 0 && selectedFields.length > 0)
    ? buildPrompt(inputColumns, file.rows[0], selectedFields, preset.contextLabel)
    : "";

  const configReady = keyValid && file && inputColumns.length > 0 && selectedFields.length > 0 && (!advancedMode || customPrompt.trim().length > 0);

  const costEstimate = useMemo(() => {
    if (!file || inputColumns.length === 0 || selectedFields.length === 0) return null;
    const sample = buildPrompt(inputColumns, file.rows[0], selectedFields, preset.contextLabel, advancedMode ? customPrompt : undefined);
    const inp = estimateInputTokensPerRow(sample, provider, modelId);
    const out = estimateOutputTokensPerRow(selectedFields);
    return calculateCostEstimate(file.totalRows, inp, out, provider, modelId);
  }, [file, inputColumns, selectedFields, preset, customPrompt, advancedMode, provider, modelId]);

  const config = { provider, apiKey, modelId, inputColumns, category, selectedFields, customPrompt: advancedMode ? customPrompt : undefined, useAdvancedMode: advancedMode };

  /* ---- handlers ---- */
  const validateKey = async () => {
    if (!apiKey.trim()) { setKeyError("Please enter an API key"); return; }
    setValidating(true); setKeyError("");
    try {
      const res = await fetch("/api/validate-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, apiKey: apiKey.trim() }) });
      const data = await res.json();
      if (data.valid) { setKeyValid(true); } else { setKeyError(data.error || "Invalid API key"); }
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
      setSelectedFieldKeys(new Set());
      setTestDone(false); setTestResults([]); setFullDone(false); setFullResults([]);
    } catch (err) { setFileError((err as Error).message); }
  };

  const toggleColumn = (col: string) => setInputColumns((p) => p.includes(col) ? p.filter((c) => c !== col) : [...p, col]);
  const toggleField = (key: string) => setSelectedFieldKeys((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const selectAllFields = () => setSelectedFieldKeys(new Set(availableFields.map((f) => f.key)));

  const handleCategoryChange = (cat: EnrichmentCategory) => { setCategory(cat); setSelectedFieldKeys(new Set()); if (cat !== "custom") setCustomFields([]); };

  const addCustomField = () => {
    if (!customFieldName.trim()) return;
    const key = customFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    setCustomFields((p) => [...p, { key, label: customFieldName.trim(), description: customFieldDesc.trim() || customFieldName.trim() }]);
    setSelectedFieldKeys((p) => new Set([...p, key]));
    setCustomFieldName(""); setCustomFieldDesc("");
  };

  const enrichSingleRow = useCallback(async (row: Record<string, string>, index: number): Promise<EnrichmentResult> => {
    const prompt = buildPrompt(config.inputColumns, row, config.selectedFields, preset.contextLabel, config.customPrompt);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = config.provider === "anthropic"
          ? await enrichRowAnthropic(config.apiKey, config.modelId as AnthropicModelId, prompt)
          : await enrichRowGemini(config.apiKey, config.modelId as GeminiModelId, prompt);
        return { rowIndex: index, success: true, data: result.data };
      } catch (err) {
        if (attempt === 2) return { rowIndex: index, success: false, data: {}, error: (err as Error).message };
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
    return { rowIndex: index, success: false, data: {}, error: "Max retries" };
  }, [config, preset]);

  const runTest = async () => {
    if (!file) return;
    setTestRunning(true); setTestResults([]); setTestDone(false);
    const rows = file.rows.slice(0, 5);
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
      for (const f of selectedFields) empty[f.key] = r ? `Error: ${r.error || "Failed"}` : "";
      return empty;
    });
    const blob = exportToFile(file, enriched, selectedFields.map((f) => f.key));
    const ext = file.fileType === "csv" ? "csv" : "xlsx";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${file.fileName.replace(/\.[^.]+$/, "")}_enriched.${ext}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  /* ---- render ---- */
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">F</div>
            <span className="text-base font-bold text-gray-900">FreeClay</span>
          </Link>
          <TrustBadge text="Your API key and data exist only in this browser tab." />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          {/* ============ LEFT COLUMN ============ */}
          <div className="space-y-5">

            {/* --- 1. API Key + Provider --- */}
            <SectionCard>
              <SectionTitle num={1} title="Connect API" done={keyValid} active={!keyValid} />
              {!keyValid ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setProvider("anthropic"); setKeyError(""); setModelId("claude-sonnet-4-5-20250929"); }}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition ${provider === "anthropic" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      Anthropic (Claude)
                    </button>
                    <button onClick={() => { setProvider("gemini"); setKeyError(""); setModelId("gemini-2.0-flash"); }}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition ${provider === "gemini" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      Google (Gemini)
                    </button>
                  </div>
                  <input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setKeyError(""); }}
                    placeholder={provider === "anthropic" ? "sk-ant-..." : "AIza..."}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  />
                  {keyError && <p className="text-xs text-red-600">{keyError}</p>}
                  <button onClick={validateKey} disabled={validating || !apiKey.trim()}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50">
                    {validating ? "Validating..." : "Validate & Connect"}
                  </button>
                  <p className="text-center text-[11px] text-gray-400">
                    {provider === "anthropic"
                      ? <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Get a key from Anthropic</a>
                      : <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Get a key from Google AI Studio</a>}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                  <span className="text-xs text-emerald-700">{provider === "anthropic" ? "Anthropic" : "Gemini"} connected</span>
                  <button onClick={() => { setKeyValid(false); setApiKey(""); }} className="text-xs text-red-500 hover:text-red-600">Disconnect</button>
                </div>
              )}
            </SectionCard>

            {/* --- 2. File Upload --- */}
            <SectionCard>
              <SectionTitle num={2} title="Upload File" done={!!file} active={keyValid && !file} />
              {!file ? (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 transition ${dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"} ${!keyValid ? "pointer-events-none opacity-50" : ""}`}>
                    <svg className="mb-2 h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    <p className="text-xs text-gray-500">Drop your file here or click to browse</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">.xlsx, .xls, or .csv — Max 10MB</p>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} className="hidden" />
                  </div>
                  {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
                  <TrustBadge text="Files are parsed in your browser. Nothing is uploaded to any server." />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-gray-900">{file.fileName}</p>
                      <p className="text-[11px] text-gray-400">{file.totalRows} rows &middot; {file.columns.length} columns</p>
                    </div>
                    <button onClick={() => { setFile(null); setInputColumns([]); setTestDone(false); setFullDone(false); }} className="text-xs text-red-500 hover:text-red-600">Remove</button>
                  </div>
                  <div className="max-h-48 overflow-auto rounded-lg border border-gray-200">
                    <table className="min-w-full text-[11px]">
                      <thead className="sticky top-0 bg-gray-50"><tr>{file.columns.map((c) => <th key={c} className="whitespace-nowrap px-2.5 py-1.5 text-left font-medium text-gray-600">{c}</th>)}</tr></thead>
                      <tbody>{file.rows.slice(0, 8).map((r, i) => <tr key={i} className="border-t border-gray-50">{file.columns.map((c) => <td key={c} className="max-w-[160px] truncate whitespace-nowrap px-2.5 py-1.5 text-gray-500">{r[c]}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* --- 3. Configure --- */}
            <SectionCard className={!file ? "opacity-50 pointer-events-none" : ""}>
              <SectionTitle num={3} title="Configure Enrichment" done={configReady || false} active={!!file && !configReady} />

              {/* Model */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Model</label>
                <div className="grid gap-1.5">
                  {models.map(([id, model]) => (
                    <button key={id} onClick={() => setModelId(id as ModelId)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition ${modelId === id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <span>
                        <span className="font-medium text-gray-900">{model.name}</span>
                        {model.recommended && <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">Recommended</span>}
                        <span className="ml-1.5 text-[11px] text-gray-400">{model.label}</span>
                      </span>
                      <span className="text-[11px] text-gray-400">${model.inputPer1M}/${model.outputPer1M} /1M</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Columns */}
              {file && (
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">Input Columns (data to research)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {file.columns.map((col) => (
                      <button key={col} onClick={() => toggleColumn(col)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${inputColumns.includes(col) ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-gray-600">Enrichment Type</label>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {CATEGORY_PRESETS.map((p) => (
                    <button key={p.id} onClick={() => handleCategoryChange(p.id)}
                      className={`rounded-lg border px-2.5 py-2 text-left text-[11px] transition ${category === p.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <span className="text-base">{p.icon}</span>
                      <div className="mt-0.5 font-medium text-gray-900">{p.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom field adder */}
              {category === "custom" && (
                <div className="mb-3 flex gap-1.5">
                  <input value={customFieldName} onChange={(e) => setCustomFieldName(e.target.value)} placeholder="Field name"
                    className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none" />
                  <input value={customFieldDesc} onChange={(e) => setCustomFieldDesc(e.target.value)} placeholder="Description"
                    className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none" />
                  <button onClick={addCustomField} className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">Add</button>
                </div>
              )}

              {/* Output Fields */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Output Fields</label>
                  {availableFields.length > 0 && <button onClick={selectAllFields} className="text-[11px] text-indigo-600 hover:text-indigo-500">Select all</button>}
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {availableFields.map((f) => (
                    <button key={f.key} onClick={() => toggleField(f.key)}
                      className={`rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition ${selectedFieldKeys.has(f.key) ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <div className="font-medium">{f.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced mode */}
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={advancedMode}
                  onChange={(e) => { setAdvancedMode(e.target.checked); if (e.target.checked && generatedPrompt) setCustomPrompt(generatedPrompt); }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-gray-600">Advanced: Edit prompt</span>
              </label>
              {advancedMode && (
                <div className="mt-2">
                  <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={8}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-[11px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none" />
                  <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                    <span>Use {"{column_name}"} to reference columns</span>
                    <button onClick={() => setCustomPrompt(generatedPrompt)} className="text-indigo-600">Reset</button>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* --- 4. Test + Run + Download --- */}
            <SectionCard className={!configReady ? "opacity-50 pointer-events-none" : ""}>
              <SectionTitle num={4} title="Test, Run & Download" done={fullDone} active={!!configReady && !fullDone} />

              {/* Test */}
              {!testDone && !testRunning && (
                <button onClick={runTest} disabled={!configReady}
                  className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50">
                  Test with first {file ? Math.min(5, file.totalRows) : 5} rows
                </button>
              )}

              {(testRunning || testDone) && (
                <div className="space-y-3">
                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(testResults.length / Math.min(5, file?.totalRows || 5)) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-500">{testResults.length}/{Math.min(5, file?.totalRows || 5)}</span>
                  </div>

                  {/* Results table */}
                  {testResults.length > 0 && (
                    <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
                      <table className="min-w-full text-[11px]">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr>
                            {inputColumns.map((c) => <th key={c} className="whitespace-nowrap px-2 py-1.5 text-left font-medium text-gray-600">{c}</th>)}
                            {selectedFields.map((f) => <th key={f.key} className="whitespace-nowrap bg-emerald-50 px-2 py-1.5 text-left font-medium text-emerald-700">{f.label}</th>)}
                            <th className="px-2 py-1.5 text-left font-medium text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {testResults.map((r, i) => (
                            <tr key={i} className="border-t border-gray-50">
                              {inputColumns.map((c) => <td key={c} className="max-w-[120px] truncate whitespace-nowrap px-2 py-1.5 text-gray-500">{file?.rows[i]?.[c]}</td>)}
                              {selectedFields.map((f) => <td key={f.key} className="max-w-[160px] truncate whitespace-nowrap bg-emerald-50/50 px-2 py-1.5 text-emerald-800">{r.data[f.key] || "-"}</td>)}
                              <td className="px-2 py-1.5">{r.success ? <span className="text-emerald-600">OK</span> : <span className="text-red-500">Err</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {testDone && !fullRunning && !fullDone && (
                    <div className="flex gap-2">
                      <button onClick={() => { setTestDone(false); setTestResults([]); }} className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">Re-test</button>
                      <button onClick={runFull} className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500">
                        Run all {file?.totalRows} rows
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Full run progress */}
              {(fullRunning || fullDone) && (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{fullCompleted + fullFailed} / {file?.totalRows} processed</span>
                    <span>{fullCompleted} OK, {fullFailed} failed</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((fullCompleted + fullFailed) / (file?.totalRows || 1)) * 100}%` }} />
                  </div>

                  {fullRunning && (
                    <div className="flex gap-2">
                      <button onClick={() => { pauseRef.current = !pauseRef.current; setFullPaused(!fullPaused); }}
                        className="flex-1 rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50">
                        {fullPaused ? "Resume" : "Pause"}
                      </button>
                      <button onClick={() => { stopRef.current = true; pauseRef.current = false; setFullRunning(false); setFullDone(true); }}
                        className="flex-1 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Stop</button>
                    </div>
                  )}

                  {fullDone && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        Done! {fullCompleted} successful, {fullFailed} failed.
                      </div>
                      <button onClick={handleDownload}
                        className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500">
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
              <SectionCard>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Cost Estimate</h3>
                {costEstimate ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Rows</span><span className="font-medium text-gray-900">{costEstimate.totalRows}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Model</span><span className="font-medium text-gray-900">{costEstimate.modelName}</span></div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Input tokens</span><span className="text-gray-700">${costEstimate.inputCost.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Output tokens</span><span className="text-gray-700">${costEstimate.outputCost.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Search</span><span className="text-gray-700">${costEstimate.searchCost.toFixed(2)}</span></div>
                    </div>
                    {costEstimate.freeSearchNote && <p className="text-[11px] text-emerald-600">{costEstimate.freeSearchNote}</p>}
                    <div className="border-t border-gray-100 pt-3 flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Estimated Total</span>
                      <span className="text-sm font-bold text-indigo-600">~${costEstimate.totalCost.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-amber-600">Actual costs may vary +/-20%.</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Configure your enrichment to see cost estimate.</p>
                )}
              </SectionCard>

              <SectionCard>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Privacy</h3>
                <ul className="space-y-1.5 text-[11px] text-gray-500">
                  <li className="flex items-start gap-1.5">
                    <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    API key in browser memory only
                  </li>
                  <li className="flex items-start gap-1.5">
                    <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    Files parsed client-side
                  </li>
                  <li className="flex items-start gap-1.5">
                    <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    No database, no cookies
                  </li>
                  <li className="flex items-start gap-1.5">
                    <svg className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    No analytics or tracking
                  </li>
                </ul>
              </SectionCard>

              <div className="text-center text-[10px] text-gray-400">
                <p>Pricing last updated: {PRICING_LAST_UPDATED}</p>
                <p className="mt-0.5">
                  <a href={provider === "anthropic" ? ANTHROPIC_PRICING_URL : GEMINI_PRICING_URL} target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline">Official pricing</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile cost bar */}
      {costEstimate && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-3 shadow-lg lg:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{costEstimate.totalRows} rows &middot; {costEstimate.modelName}</span>
            <span className="font-bold text-indigo-600">~${costEstimate.totalCost.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
