import type { Provider } from "./types";

/**
 * Error carrying enough transport detail to decide whether a retry is worth it.
 * Previously every failure surfaced as a bare Error, so a 429 was indistinguishable
 * from a malformed prompt and both were retried three times.
 */
export class EnrichError extends Error {
  status?: number;
  retryAfterMs?: number;
  retryable: boolean;
  isRateLimit: boolean;

  constructor(
    message: string,
    opts: { status?: number; retryAfterMs?: number; retryable?: boolean } = {}
  ) {
    super(message);
    this.name = "EnrichError";
    this.status = opts.status;
    this.retryAfterMs = opts.retryAfterMs;
    this.isRateLimit = opts.status === 429;
    this.retryable = opts.retryable ?? isRetryableStatus(opts.status);
  }
}

/**
 * 429 is a rate limit; 5xx and 408/409/425 are transient. Anything else (400 bad
 * request, 401 bad key, 403 no access, 404 unknown model) will fail identically
 * on every attempt, so retrying only burns the user's quota and their patience.
 */
export function isRetryableStatus(status?: number): boolean {
  if (status === undefined) return true; // network/transport failure — worth one more go
  if (status === 408 || status === 409 || status === 425 || status === 429) return true;
  return status >= 500;
}

export interface EnrichResponse {
  data: Record<string, string>;
  inputTokens: number;
  outputTokens: number;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Called before each backoff sleep so the UI can surface throttling live. */
  onRetry?: (info: { attempt: number; delayMs: number; error: EnrichError }) => void;
  /** Aborts the retry loop when the user pauses or stops the run. */
  signal?: { aborted: boolean };
}

const DEFAULTS = { maxAttempts: 5, baseDelayMs: 1_000, maxDelayMs: 60_000 };

/**
 * Full-jitter exponential backoff: `random() * min(cap, base * 2^attempt)`.
 *
 * The jitter matters more than the exponent here. With N workers hitting a
 * shared quota, a fixed 1s/2s/4s schedule makes every worker retry in lockstep
 * and re-trigger the same 429 together. Randomising the whole interval spreads
 * them out. A server-sent Retry-After always wins over our guess.
 */
export function backoffDelay(
  attempt: number,
  err: EnrichError,
  opts: RetryOptions = {}
): number {
  const { baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...opts };
  if (err.retryAfterMs !== undefined) {
    // Add a little jitter even here, so workers released by the same
    // Retry-After don't all fire on the same millisecond.
    return Math.min(maxDelayMs, err.retryAfterMs + Math.random() * 500);
  }
  const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.random() * ceiling;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;
  const seconds = Number(headerValue);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(headerValue); // HTTP-date form
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}

/** One request for one row. Throws EnrichError; does not retry. */
export async function enrichRowOnce(
  provider: Provider,
  apiKey: string,
  modelId: string,
  prompt: string,
  useWebSearch: boolean
): Promise<EnrichResponse> {
  let res: Response;
  try {
    res = await fetch("/api/enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey, modelId, prompt, useWebSearch }),
    });
  } catch (err) {
    throw new EnrichError((err as Error).message || "Network request failed", { retryable: true });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string; retryAfterMs?: number });
    throw new EnrichError(body.error || `Request failed with status ${res.status}`, {
      status: res.status,
      retryAfterMs: body.retryAfterMs ?? parseRetryAfter(res.headers.get("retry-after")),
    });
  }

  const result = await res.json();
  return {
    data: result.data ?? {},
    inputTokens: result.inputTokens || 0,
    outputTokens: result.outputTokens || 0,
  };
}

export interface EnrichAttemptOutcome extends EnrichResponse {
  retries: number;
  hitRateLimit: boolean;
}

/** Enrich one row, retrying transient failures with jittered exponential backoff. */
export async function enrichRowWithRetry(
  provider: Provider,
  apiKey: string,
  modelId: string,
  prompt: string,
  useWebSearch: boolean,
  opts: RetryOptions = {}
): Promise<EnrichAttemptOutcome> {
  const { maxAttempts } = { ...DEFAULTS, ...opts };
  let retries = 0;
  let hitRateLimit = false;
  let lastError: EnrichError = new EnrichError("Request was never attempted");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (opts.signal?.aborted) throw new EnrichError("Run stopped", { retryable: false });
    try {
      const result = await enrichRowOnce(provider, apiKey, modelId, prompt, useWebSearch);
      return { ...result, retries, hitRateLimit };
    } catch (err) {
      lastError = err instanceof EnrichError ? err : new EnrichError((err as Error).message);
      if (lastError.isRateLimit) hitRateLimit = true;

      const isLastAttempt = attempt === maxAttempts - 1;
      if (!lastError.retryable || isLastAttempt) throw lastError;

      const delayMs = backoffDelay(attempt, lastError, opts);
      retries++;
      opts.onRetry?.({ attempt: attempt + 1, delayMs, error: lastError });
      await sleep(delayMs);
    }
  }

  throw lastError;
}

export async function validateApiKey(
  provider: Provider,
  apiKey: string
): Promise<{ valid: boolean; error?: string; warning?: string }> {
  const res = await fetch("/api/validate-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, apiKey }),
  });
  return res.json();
}
