"use client";

import { useState } from "react";
import type { Provider } from "@/lib/types";
import TrustBanner from "./TrustBanner";

interface ApiKeyStepProps {
  onComplete: (provider: Provider, apiKey: string) => void;
}

export default function ApiKeyStep({ onComplete }: ApiKeyStepProps) {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }
    setValidating(true);
    setError("");
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        onComplete(provider, apiKey.trim());
      } else {
        setError(data.error || "Invalid API key. Please check and try again.");
      }
    } catch {
      setError("Failed to validate key. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Step 1: Connect Your API
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose your AI provider and paste your API key
        </p>
      </div>

      <TrustBanner message="Your API key is never stored, logged, or sent to our servers. It's used only in your current browser session to make API calls. When you close this tab, your key is gone." />

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Provider
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setProvider("anthropic"); setError(""); }}
            className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${
              provider === "anthropic"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            Anthropic (Claude)
          </button>
          <button
            type="button"
            onClick={() => { setProvider("gemini"); setError(""); }}
            className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${
              provider === "gemini"
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            Google (Gemini)
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="api-key"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setError(""); }}
          placeholder={
            provider === "anthropic"
              ? "sk-ant-..."
              : "AIza..."
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={handleValidate}
        disabled={validating || !apiKey.trim()}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {validating ? "Validating..." : "Validate & Continue"}
      </button>

      <p className="text-center text-xs text-gray-400">
        Don&apos;t have an API key?{" "}
        {provider === "anthropic" ? (
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline"
          >
            Get one from Anthropic (new users get $5 free credit)
          </a>
        ) : (
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline"
          >
            Get one from Google AI Studio
          </a>
        )}
      </p>
    </div>
  );
}
