"use client";

import type { CostEstimate } from "@/lib/types";
import { PRICING_LAST_UPDATED, ANTHROPIC_PRICING_URL, GEMINI_PRICING_URL } from "@/lib/pricing";

interface EstimateStepProps {
  estimate: CostEstimate;
  provider: "anthropic" | "gemini";
  onContinue: () => void;
}

function formatCost(n: number): string {
  return n < 0.01 && n > 0 ? "<$0.01" : `$${n.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function EstimateStep({
  estimate,
  provider,
  onContinue,
}: EstimateStepProps) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Step 4: Cost Estimate
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Review the estimated cost before proceeding
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 space-y-2 border-b border-gray-100 pb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rows to process</span>
            <span className="font-medium text-gray-900">
              {estimate.totalRows}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Model</span>
            <span className="font-medium text-gray-900">
              {estimate.modelName}
            </span>
          </div>
        </div>

        <div className="mb-4 space-y-2 border-b border-gray-100 pb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Token Costs
          </h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Input: ~{formatTokens(estimate.totalInputTokens)} tokens
            </span>
            <span className="text-gray-900">{formatCost(estimate.inputCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Output: ~{formatTokens(estimate.totalOutputTokens)} tokens
            </span>
            <span className="text-gray-900">
              {formatCost(estimate.outputCost)}
            </span>
          </div>
        </div>

        <div className="mb-4 space-y-2 border-b border-gray-100 pb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Search Costs
          </h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {estimate.totalRows}{" "}
              {provider === "anthropic" ? "web searches" : "grounded prompts"} x{" "}
              ${estimate.searchCostPerRow.toFixed(3)}/each
            </span>
            <span className="text-gray-900">
              {formatCost(estimate.searchCost)}
            </span>
          </div>
          {estimate.freeSearchNote && (
            <p className="text-xs text-emerald-600">
              {estimate.freeSearchNote}
            </p>
          )}
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span className="text-gray-900">Estimated Total</span>
          <span className="text-indigo-600">
            ~{formatCost(estimate.totalCost)}
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-amber-600">
        This is an estimate. Actual costs may vary by +/-20% based on response
        lengths and search complexity.
      </p>

      <p className="text-center text-xs text-gray-400">
        Pricing last updated: {PRICING_LAST_UPDATED}.{" "}
        <a
          href={
            provider === "anthropic" ? ANTHROPIC_PRICING_URL : GEMINI_PRICING_URL
          }
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 underline"
        >
          View official pricing
        </a>
      </p>

      <button
        onClick={onContinue}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
      >
        Continue to Test Run
      </button>
    </div>
  );
}
