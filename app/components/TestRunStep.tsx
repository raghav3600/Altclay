"use client";

import { useState } from "react";
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

interface TestRunStepProps {
  config: EnrichmentConfig;
  file: ParsedFile;
  onComplete: () => void;
}

export default function TestRunStep({
  config,
  file,
  onComplete,
}: TestRunStepProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const testRows = file.rows.slice(0, 5);
  const preset = getPreset(config.category);

  const runTest = async () => {
    setRunning(true);
    setResults([]);
    setProgress(0);
    setActualCost(0);
    setError("");
    setDone(false);

    const newResults: EnrichmentResult[] = [];
    let cost = 0;

    for (let i = 0; i < testRows.length; i++) {
      setProgress(i);
      const row = testRows[i];
      const prompt = buildPrompt(
        config.inputColumns,
        row,
        config.selectedFields,
        preset.contextLabel,
        config.customPrompt
      );

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
        newResults.push({ rowIndex: i, success: true, data: result.data });
        // Rough cost tracking
        cost +=
          (result.inputTokens / 1_000_000) * 3 +
          (result.outputTokens / 1_000_000) * 15 +
          0.01;
      } catch (err) {
        newResults.push({
          rowIndex: i,
          success: false,
          data: {},
          error: (err as Error).message,
        });
      }
      setResults([...newResults]);
    }

    setProgress(testRows.length);
    setActualCost(cost);
    setDone(true);
    setRunning(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Step 5: Test Run
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Test with the first {Math.min(5, file.totalRows)} rows to validate
          quality before running the full enrichment
        </p>
      </div>

      <TrustBanner message="API calls are made directly to your AI provider using your key. Nothing is logged or stored." />

      {!running && !done && (
        <button
          onClick={runTest}
          className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-400"
        >
          Test with first {Math.min(5, file.totalRows)} rows
        </button>
      )}

      {(running || done) && (
        <>
          <div className="flex items-center gap-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${(progress / testRows.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {progress}/{testRows.length}
            </span>
          </div>

          {results.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      #
                    </th>
                    {config.inputColumns.map((col) => (
                      <th
                        key={col}
                        className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-700"
                      >
                        {col}
                      </th>
                    ))}
                    {config.selectedFields.map((f) => (
                      <th
                        key={f.key}
                        className="whitespace-nowrap bg-emerald-50 px-3 py-2 text-left font-medium text-emerald-700"
                      >
                        {f.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      {config.inputColumns.map((col) => (
                        <td
                          key={col}
                          className="max-w-[150px] truncate whitespace-nowrap px-3 py-2 text-gray-600"
                        >
                          {testRows[i][col]}
                        </td>
                      ))}
                      {config.selectedFields.map((f) => (
                        <td
                          key={f.key}
                          className="max-w-[200px] truncate whitespace-nowrap bg-emerald-50 px-3 py-2 text-emerald-800"
                        >
                          {r.data[f.key] || "-"}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {r.success ? (
                          <span className="text-emerald-600">OK</span>
                        ) : (
                          <span className="text-red-600" title={r.error}>
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {done && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Test complete:{" "}
                {results.filter((r) => r.success).length}/{results.length}{" "}
                successful. Estimated cost: ~${actualCost.toFixed(4)}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={onComplete}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Continue to Full Run
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
