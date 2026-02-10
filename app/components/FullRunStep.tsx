"use client";

import { useState, useRef, useCallback } from "react";
import type {
  EnrichmentConfig,
  EnrichmentResult,
  ParsedFile,
  AnthropicModelId,
  GeminiModelId,
} from "@/lib/types";
import { buildPrompt, getPreset } from "@/lib/promptTemplates";
import { enrichRowAnthropic } from "@/lib/anthropic";
import { enrichRowGemini } from "@/lib/gemini";
import TrustBanner from "./TrustBanner";

interface FullRunStepProps {
  config: EnrichmentConfig;
  file: ParsedFile;
  onComplete: (results: EnrichmentResult[]) => void;
}

export default function FullRunStep({
  config,
  file,
  onComplete,
}: FullRunStepProps) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [failed, setFailed] = useState(0);
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [showConfirm, setShowConfirm] = useState(true);
  const [done, setDone] = useState(false);

  const pauseRef = useRef(false);
  const stopRef = useRef(false);

  const preset = getPreset(config.category);

  const enrichRow = useCallback(
    async (row: Record<string, string>, index: number): Promise<EnrichmentResult> => {
      const prompt = buildPrompt(
        config.inputColumns,
        row,
        config.selectedFields,
        preset.contextLabel,
        config.customPrompt
      );

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          let result;
          if (config.provider === "anthropic") {
            result = await enrichRowAnthropic(
              config.apiKey,
              config.modelId as AnthropicModelId,
              prompt
            );
          } else {
            result = await enrichRowGemini(
              config.apiKey,
              config.modelId as GeminiModelId,
              prompt
            );
          }
          return { rowIndex: index, success: true, data: result.data };
        } catch (err) {
          if (attempt === 2) {
            return {
              rowIndex: index,
              success: false,
              data: {},
              error: (err as Error).message,
            };
          }
          // Exponential backoff
          await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
      return { rowIndex: index, success: false, data: {}, error: "Max retries exceeded" };
    },
    [config, preset]
  );

  const runEnrichment = async () => {
    setShowConfirm(false);
    setRunning(true);
    setPaused(false);
    setDone(false);
    stopRef.current = false;
    pauseRef.current = false;

    const allResults: EnrichmentResult[] = new Array(file.rows.length);
    let completedCount = 0;
    let failedCount = 0;

    const CONCURRENCY = 3;
    let nextIndex = 0;

    const processNext = async (): Promise<void> => {
      while (nextIndex < file.rows.length) {
        if (stopRef.current) return;

        while (pauseRef.current) {
          await new Promise((r) => setTimeout(r, 200));
          if (stopRef.current) return;
        }

        const idx = nextIndex++;
        if (idx >= file.rows.length) return;

        const result = await enrichRow(file.rows[idx], idx);
        allResults[idx] = result;

        if (result.success) {
          completedCount++;
        } else {
          failedCount++;
        }

        setCompleted(completedCount);
        setFailed(failedCount);
        setResults([...allResults.filter(Boolean)]);
      }
    };

    const workers = Array.from({ length: CONCURRENCY }, () => processNext());
    await Promise.all(workers);

    setRunning(false);
    setDone(true);
    onComplete(allResults.filter(Boolean));
  };

  const handlePause = () => {
    pauseRef.current = !pauseRef.current;
    setPaused(!paused);
  };

  const handleStop = () => {
    stopRef.current = true;
    pauseRef.current = false;
    setRunning(false);
    setDone(true);
    onComplete(results);
  };

  const total = file.totalRows;
  const pct = total > 0 ? ((completed + failed) / total) * 100 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Step 6: Full Enrichment
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Process all {total} rows
        </p>
      </div>

      <TrustBanner message="All processing happens through direct API calls to your provider. Nothing is stored or logged." />

      {showConfirm && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            This will process <strong>{total}</strong> rows. Proceed?
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={runEnrichment}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Run Full Enrichment
            </button>
          </div>
        </div>
      )}

      {(running || done) && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {completed + failed} / {total} rows processed
              </span>
              <span className="text-gray-400">
                {completed} OK, {failed} failed
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {running && (
            <div className="flex gap-3">
              <button
                onClick={handlePause}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                onClick={handleStop}
                className="flex-1 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Stop
              </button>
            </div>
          )}

          {done && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Enrichment complete. {completed} successful, {failed} failed out of{" "}
              {completed + failed} processed.
            </div>
          )}
        </>
      )}
    </div>
  );
}
