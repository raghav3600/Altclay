"use client";

import { useState, useRef } from "react";
import type { ParsedFile } from "@/lib/types";
import { parseFile } from "@/lib/fileParser";
import TrustBanner from "./TrustBanner";

interface FileUploadStepProps {
  onComplete: (file: ParsedFile) => void;
}

export default function FileUploadStep({ onComplete }: FileUploadStepProps) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ParsedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFile = async (file: File) => {
    setError("");
    if (file.size > MAX_SIZE) {
      setError("File exceeds 10MB limit. Please use a smaller file.");
      return;
    }
    setParsing(true);
    try {
      const parsed = await parseFile(file);
      if (parsed.totalRows === 0) {
        setError("File appears to be empty. Please check your file.");
        setParsing(false);
        return;
      }
      setPreview(parsed);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Step 2: Upload Your File
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload an Excel (.xlsx, .xls) or CSV file
        </p>
      </div>

      <TrustBanner message="Your data never leaves your browser. Files are processed in-memory. Nothing is uploaded to our servers or stored anywhere. We have no database, no analytics tracking your data, no cookies." />

      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 transition ${
            dragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <p className="text-sm text-gray-600">
            {parsing
              ? "Parsing file..."
              : "Drag & drop your file here, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            .xlsx, .xls, or .csv — Max 10MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {preview.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {preview.totalRows} rows &middot; {preview.columns.length}{" "}
                columns
              </p>
            </div>
            <button
              onClick={() => { setPreview(null); setError(""); }}
              className="text-sm text-red-600 hover:text-red-500"
            >
              Remove
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {preview.columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-700"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {preview.columns.map((col) => (
                      <td
                        key={col}
                        className="max-w-[200px] truncate whitespace-nowrap px-3 py-2 text-gray-600"
                      >
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.totalRows > 10 && (
              <p className="border-t border-gray-100 px-3 py-2 text-center text-xs text-gray-400">
                Showing 10 of {preview.totalRows} rows
              </p>
            )}
          </div>

          <button
            onClick={() => onComplete(preview)}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Continue with this file
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
