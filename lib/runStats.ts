import type { OutputColumn } from "./types";

/**
 * Tracks tokens consumed in a sliding 60-second window and remembers the peak.
 *
 * The peak is the number that matters when sizing a provider rate limit: Azure
 * OpenAI, Vertex and Bedrock all throttle on tokens-per-minute, and an average
 * hides the bursts that actually trigger a 429. A run averaging 20k TPM that
 * peaks at 90k needs a 90k quota, not a 20k one.
 */
export class TokenRateTracker {
  private samples: { at: number; tokens: number }[] = [];
  private peak = 0;

  /** Record a completed request. Returns the current window total and the peak. */
  add(tokens: number, now: number = Date.now()): { current: number; peak: number } {
    this.samples.push({ at: now, tokens });
    this.trim(now);
    const current = this.windowTotal();
    if (current > this.peak) this.peak = current;
    return { current, peak: this.peak };
  }

  /** Current 60s window total, recomputed against the clock. */
  current(now: number = Date.now()): number {
    this.trim(now);
    return this.windowTotal();
  }

  peakPerMinute(): number {
    return this.peak;
  }

  reset(): void {
    this.samples = [];
    this.peak = 0;
  }

  private trim(now: number): void {
    const cutoff = now - 60_000;
    let drop = 0;
    while (drop < this.samples.length && this.samples[drop].at < cutoff) drop++;
    if (drop > 0) this.samples.splice(0, drop);
  }

  private windowTotal(): number {
    let sum = 0;
    for (const s of this.samples) sum += s.tokens;
    return sum;
  }
}

/**
 * Count cells the model couldn't fill. Treats blank, "N/A", "n/a", "unknown"
 * and "none" as misses — models use all of these interchangeably, so counting
 * only the literal "N/A" the prompt asks for would undercount badly.
 */
const MISSING_VALUES = new Set(["", "n/a", "na", "none", "unknown", "not available", "null", "-"]);

export function countMissingCells(
  data: Record<string, string>,
  outputColumns: OutputColumn[]
): number {
  let missing = 0;
  for (const col of outputColumns) {
    const value = (data[col.key] ?? "").trim().toLowerCase();
    if (MISSING_VALUES.has(value)) missing++;
  }
  return missing;
}

/**
 * Remaining time from the throughput observed so far.
 *
 * Uses the overall rate since the run started rather than a recent-window rate:
 * with a handful of concurrent workers the instantaneous rate swings wildly, and
 * an estimate that jumps between "2 minutes" and "40 minutes" is worse than one
 * that converges slowly. Returns null until there's enough signal to be useful.
 */
export function estimateRemainingMs(
  completed: number,
  total: number,
  startedAt: number | null,
  now: number = Date.now()
): number | null {
  if (!startedAt || completed < 2 || completed >= total) return null;
  const elapsed = now - startedAt;
  if (elapsed <= 0) return null;
  const msPerRow = elapsed / completed;
  return Math.round(msPerRow * (total - completed));
}

/** "1h 04m", "3m 20s", "45s" — compact enough for a progress line. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/** Wall-clock finish time, for runs long enough that a duration isn't intuitive. */
export function formatFinishTime(remainingMs: number, now: number = Date.now()): string {
  return new Date(now + remainingMs).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Money, rounded honestly.
 *
 * A run that costs a third of a cent is not "$0.00" — that reads as free and
 * makes the whole estimator look broken. Sub-cent totals get "<$0.01" instead.
 */
export function formatUSD(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0.00";
  if (n < 0.01) return "<$0.01";
  return `$${n.toFixed(2)}`;
}

/** Collapses to a single figure when both ends round the same way. */
export function formatUSDRange(low: number, high: number): string {
  const a = formatUSD(low);
  const b = formatUSD(high);
  return a === b ? a : `${a}–${b}`;
}

/** 12345 -> "12.3k", 1234567 -> "1.23M". Keeps token counts scannable. */
export function formatTokens(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}
