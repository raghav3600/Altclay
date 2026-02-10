"use client";

import { useMemo } from "react";
import type { EnrichmentResult, ParsedFile, EnrichmentField } from "@/lib/types";
import { exportToFile } from "@/lib/fileParser";

interface DownloadStepProps {
  file: ParsedFile;
  results: EnrichmentResult[];
  selectedFields: EnrichmentField[];
}

export default function DownloadStep({
  file,
  results,
  selectedFields,
}: DownloadStepProps) {
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  const downloadBlob = useMemo(() => {
    const enrichedRows = file.rows.map((_, i) => {
      const result = results.find((r) => r.rowIndex === i);
      if (result?.success) return result.data;
      // Fill failed rows with empty/error markers
      const empty: Record<string, string> = {};
      for (const f of selectedFields) {
        empty[f.key] = result ? `Error: ${result.error || "Failed"}` : "";
      }
      return empty;
    });

    const newColumns = selectedFields.map((f) => f.key);
    return exportToFile(file, enrichedRows, newColumns);
  }, [file, results, selectedFields]);

  const handleDownload = () => {
    const ext = file.fileType === "csv" ? "csv" : "xlsx";
    const baseName = file.fileName.replace(/\.[^.]+$/, "");
    const downloadName = `${baseName}_enriched.${ext}`;

    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Step 7: Download Results
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Your enriched file is ready
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 text-left">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total rows</span>
            <span className="font-medium text-gray-900">{file.totalRows}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Successful</span>
            <span className="font-medium text-emerald-600">{successful}</span>
          </div>
          {failed > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Failed</span>
              <span className="font-medium text-red-600">{failed}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">New columns added</span>
            <span className="font-medium text-gray-900">
              {selectedFields.length}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
      >
        Download Enriched File
      </button>

      <p className="text-xs text-gray-400">
        Original columns preserved. New columns appended on the right.
        {failed > 0 && " Failed rows are marked with error messages."}
      </p>
    </div>
  );
}
