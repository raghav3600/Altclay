"use client";

import { useState } from "react";
import type {
  Provider,
  ModelId,
  EnrichmentCategory,
  EnrichmentField,
  ParsedFile,
  AnthropicModelId,
  GeminiModelId,
} from "@/lib/types";
import { ANTHROPIC_MODELS, GEMINI_MODELS } from "@/lib/pricing";
import { CATEGORY_PRESETS, getPreset, buildPrompt } from "@/lib/promptTemplates";

interface ConfigureStepProps {
  provider: Provider;
  file: ParsedFile;
  onComplete: (config: {
    modelId: ModelId;
    inputColumns: string[];
    category: EnrichmentCategory;
    selectedFields: EnrichmentField[];
    customPrompt?: string;
    useAdvancedMode: boolean;
  }) => void;
}

export default function ConfigureStep({
  provider,
  file,
  onComplete,
}: ConfigureStepProps) {
  const [modelId, setModelId] = useState<ModelId>(
    provider === "anthropic" ? "claude-sonnet-4-5-20250929" : "gemini-2.0-flash"
  );
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [category, setCategory] = useState<EnrichmentCategory>("companies");
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<Set<string>>(new Set());
  const [customFields, setCustomFields] = useState<EnrichmentField[]>([]);
  const [customFieldName, setCustomFieldName] = useState("");
  const [customFieldDesc, setCustomFieldDesc] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const preset = getPreset(category);
  const availableFields = category === "custom" ? customFields : preset.fields;

  const toggleColumn = (col: string) => {
    setInputColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  const toggleField = (key: string) => {
    setSelectedFieldKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAllFields = () => {
    setSelectedFieldKeys(new Set(availableFields.map((f) => f.key)));
  };

  const addCustomField = () => {
    if (!customFieldName.trim()) return;
    const key = customFieldName.trim().toLowerCase().replace(/\s+/g, "_");
    const field: EnrichmentField = {
      key,
      label: customFieldName.trim(),
      description: customFieldDesc.trim() || customFieldName.trim(),
    };
    setCustomFields((prev) => [...prev, field]);
    setSelectedFieldKeys((prev) => new Set([...prev, key]));
    setCustomFieldName("");
    setCustomFieldDesc("");
  };

  const handleCategoryChange = (cat: EnrichmentCategory) => {
    setCategory(cat);
    setSelectedFieldKeys(new Set());
    if (cat !== "custom") {
      setCustomFields([]);
    }
  };

  const selectedFields = availableFields.filter((f) =>
    selectedFieldKeys.has(f.key)
  );

  const generatedPrompt =
    inputColumns.length > 0 && selectedFields.length > 0
      ? buildPrompt(
          inputColumns,
          file.rows[0],
          selectedFields,
          preset.contextLabel
        )
      : "";

  const canContinue =
    inputColumns.length > 0 &&
    selectedFields.length > 0 &&
    (advancedMode ? customPrompt.trim().length > 0 : true);

  const models =
    provider === "anthropic"
      ? Object.entries(ANTHROPIC_MODELS)
      : Object.entries(GEMINI_MODELS);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Step 3: Configure Enrichment
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose your model, select input columns, and pick what data you want
        </p>
      </div>

      {/* Model Selection */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Select Model
        </h3>
        <div className="grid gap-2">
          {models.map(([id, model]) => (
            <button
              key={id}
              onClick={() => setModelId(id as ModelId)}
              className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left text-sm transition ${
                modelId === id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div>
                <span className="font-medium text-gray-900">
                  {model.name}
                </span>
                {model.recommended && (
                  <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    Recommended
                  </span>
                )}
                <span className="ml-2 text-xs text-gray-500">
                  {model.label}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                ${model.inputPer1M}/${model.outputPer1M} per 1M tokens
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Columns */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          Select Input Columns (data to research)
        </h3>
        <div className="flex flex-wrap gap-2">
          {file.columns.map((col) => (
            <button
              key={col}
              onClick={() => toggleColumn(col)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                inputColumns.includes(col)
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700">
          What are you enriching?
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleCategoryChange(p.id)}
              className={`rounded-lg border-2 px-3 py-2.5 text-left text-xs transition ${
                category === p.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-lg">{p.icon}</div>
              <div className="mt-1 font-medium text-gray-900">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Field Selection */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Select Output Fields
          </h3>
          {availableFields.length > 0 && (
            <button
              onClick={selectAllFields}
              className="text-xs text-indigo-600 hover:text-indigo-500"
            >
              Select all
            </button>
          )}
        </div>

        {category === "custom" && (
          <div className="mb-4 flex gap-2">
            <input
              value={customFieldName}
              onChange={(e) => setCustomFieldName(e.target.value)}
              placeholder="Field name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
            />
            <input
              value={customFieldDesc}
              onChange={(e) => setCustomFieldDesc(e.target.value)}
              placeholder="Description (optional)"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
            />
            <button
              onClick={addCustomField}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Add
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {availableFields.map((f) => (
            <button
              key={f.key}
              onClick={() => toggleField(f.key)}
              className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                selectedFieldKeys.has(f.key)
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="font-medium">{f.label}</div>
              <div className="mt-0.5 text-gray-400">{f.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Mode Toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={advancedMode}
            onChange={(e) => {
              setAdvancedMode(e.target.checked);
              if (e.target.checked && generatedPrompt) {
                setCustomPrompt(generatedPrompt);
              }
            }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-gray-700">Advanced mode: Edit prompt directly</span>
        </label>

        {advancedMode && (
          <div className="mt-3">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 font-mono text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 focus:outline-none"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>
                Use {"{column_name}"} to reference columns
              </span>
              <button
                onClick={() => setCustomPrompt(generatedPrompt)}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Reset to template
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Continue */}
      <button
        onClick={() =>
          onComplete({
            modelId,
            inputColumns,
            category,
            selectedFields,
            customPrompt: advancedMode ? customPrompt : undefined,
            useAdvancedMode: advancedMode,
          })
        }
        disabled={!canContinue}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue to Cost Estimate
      </button>
    </div>
  );
}
