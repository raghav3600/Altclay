"use client";

import { useState, useMemo } from "react";
import type {
  WizardStep,
  Provider,
  ModelId,
  EnrichmentCategory,
  EnrichmentField,
  ParsedFile,
  EnrichmentResult,
  CostEstimate,
} from "@/lib/types";
import { buildPrompt, getPreset } from "@/lib/promptTemplates";
import {
  estimateInputTokensPerRow,
  estimateOutputTokensPerRow,
  calculateCostEstimate,
} from "@/lib/costEstimator";

import LandingHero from "./components/LandingHero";
import ApiKeyStep from "./components/ApiKeyStep";
import FileUploadStep from "./components/FileUploadStep";
import ConfigureStep from "./components/ConfigureStep";
import EstimateStep from "./components/EstimateStep";
import TestRunStep from "./components/TestRunStep";
import FullRunStep from "./components/FullRunStep";
import DownloadStep from "./components/DownloadStep";

const STEP_ORDER: WizardStep[] = [
  "landing",
  "api-key",
  "upload",
  "configure",
  "estimate",
  "test",
  "run",
  "download",
];

const STEP_LABELS: Record<WizardStep, string> = {
  landing: "Home",
  "api-key": "API Key",
  upload: "Upload",
  configure: "Configure",
  estimate: "Estimate",
  test: "Test",
  run: "Run",
  download: "Download",
};

export default function Home() {
  const [step, setStep] = useState<WizardStep>("landing");

  // State held only in memory
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [file, setFile] = useState<ParsedFile | null>(null);
  const [modelId, setModelId] = useState<ModelId>("claude-sonnet-4-5-20250929");
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [category, setCategory] = useState<EnrichmentCategory>("companies");
  const [selectedFields, setSelectedFields] = useState<EnrichmentField[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string | undefined>();
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);
  const [enrichResults, setEnrichResults] = useState<EnrichmentResult[]>([]);

  const currentStepIndex = STEP_ORDER.indexOf(step);

  const costEstimate: CostEstimate | null = useMemo(() => {
    if (!file || inputColumns.length === 0 || selectedFields.length === 0) {
      return null;
    }
    const preset = getPreset(category);
    const samplePrompt = buildPrompt(
      inputColumns,
      file.rows[0],
      selectedFields,
      preset.contextLabel,
      customPrompt
    );
    const inputTokens = estimateInputTokensPerRow(samplePrompt, provider, modelId);
    const outputTokens = estimateOutputTokensPerRow(selectedFields);
    return calculateCostEstimate(
      file.totalRows,
      inputTokens,
      outputTokens,
      provider,
      modelId
    );
  }, [file, inputColumns, selectedFields, category, customPrompt, provider, modelId]);

  const config = {
    provider,
    apiKey,
    modelId,
    inputColumns,
    category,
    selectedFields,
    customPrompt,
    useAdvancedMode,
  };

  return (
    <div>
      {/* Step indicator */}
      {step !== "landing" && (
        <div className="border-b border-gray-100 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-center justify-between">
            <button
              onClick={() => setStep("landing")}
              className="text-lg font-bold text-gray-900"
            >
              FreeClay
            </button>
            <div className="flex gap-1">
              {STEP_ORDER.filter((s) => s !== "landing").map((s, i) => {
                const sIdx = STEP_ORDER.indexOf(s);
                const isCurrent = s === step;
                const isPast = sIdx < currentStepIndex;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      if (isPast) setStep(s);
                    }}
                    disabled={!isPast && !isCurrent}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      isCurrent
                        ? "bg-indigo-600 text-white"
                        : isPast
                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i + 1}. {STEP_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-8">
        {step === "landing" && (
          <LandingHero onGetStarted={() => setStep("api-key")} />
        )}

        {step === "api-key" && (
          <ApiKeyStep
            onComplete={(p, k) => {
              setProvider(p);
              setApiKey(k);
              setStep("upload");
            }}
          />
        )}

        {step === "upload" && (
          <FileUploadStep
            onComplete={(f) => {
              setFile(f);
              setStep("configure");
            }}
          />
        )}

        {step === "configure" && file && (
          <ConfigureStep
            provider={provider}
            file={file}
            onComplete={(cfg) => {
              setModelId(cfg.modelId);
              setInputColumns(cfg.inputColumns);
              setCategory(cfg.category);
              setSelectedFields(cfg.selectedFields);
              setCustomPrompt(cfg.customPrompt);
              setUseAdvancedMode(cfg.useAdvancedMode);
              setStep("estimate");
            }}
          />
        )}

        {step === "estimate" && costEstimate && (
          <EstimateStep
            estimate={costEstimate}
            provider={provider}
            onContinue={() => setStep("test")}
          />
        )}

        {step === "test" && file && (
          <TestRunStep
            config={config}
            file={file}
            onComplete={() => setStep("run")}
          />
        )}

        {step === "run" && file && (
          <FullRunStep
            config={config}
            file={file}
            onComplete={(results) => {
              setEnrichResults(results);
              setStep("download");
            }}
          />
        )}

        {step === "download" && file && (
          <DownloadStep
            file={file}
            results={enrichResults}
            selectedFields={selectedFields}
          />
        )}
      </div>
    </div>
  );
}
