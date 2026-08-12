import type {
  Provider,
  OutputColumn,
  ParsedFile,
  EnrichmentResult,
  RunStats,
} from "./types";

/*
 * Session recovery.
 *
 * localStorage rather than sessionStorage so work survives a full tab close,
 * not just a reload — losing a half-finished 2,000-row run to an accidental
 * Cmd-W is expensive in real money, not just time.
 *
 * PRIVACY (see CLAUDE.md): the API key is never part of the saved session and
 * must never be added to SessionPayload. Everything here stays on the user's
 * own device; nothing is transmitted. Spreadsheet contents *are* persisted, so
 * the UI offers an explicit "discard" and the privacy page discloses it.
 */

const SESSION_KEY = "openclay_session_v2";
const SCHEMA_VERSION = 2;

/** Above this we stop trying to persist rather than thrash against the quota. */
const MAX_PERSISTED_ROWS = 5_000;

export interface SessionPayload {
  file: ParsedFile | null;
  description: string;
  inputColumns: string[];
  outputColumns: OutputColumn[];
  provider: Provider;
  modelId: string;
  useWebSearch: boolean;
  concurrency: number;
  advancedMode: boolean;
  customTemplate: string;
  testResults: EnrichmentResult[];
  testDone: boolean;
  fullResults: EnrichmentResult[];
  fullDone: boolean;
  stats: RunStats;
}

export interface SavedSession extends SessionPayload {
  version: number;
  savedAt: number;
}

export interface SaveOutcome {
  ok: boolean;
  reason?: "quota" | "too-large" | "unavailable";
}

/** Only offer to restore when there is actually something worth restoring. */
export function hasMeaningfulWork(s: SessionPayload): boolean {
  return Boolean(
    s.file ||
      s.description.trim() ||
      s.outputColumns.length > 0 ||
      s.testResults.length > 0 ||
      s.fullResults.length > 0
  );
}

export function saveSession(payload: SessionPayload): SaveOutcome {
  if (typeof window === "undefined") return { ok: false, reason: "unavailable" };

  // A very large sheet will blow the ~5MB localStorage budget. Rather than fail
  // noisily on every keystroke, skip persistence and let the caller say so once.
  if ((payload.file?.totalRows ?? 0) > MAX_PERSISTED_ROWS) {
    return { ok: false, reason: "too-large" };
  }

  try {
    const data: SavedSession = { version: SCHEMA_VERSION, savedAt: Date.now(), ...payload };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, reason: quota ? "quota" : "unavailable" };
  }
}

export function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    // A schema bump means the shape may not match what the app expects now;
    // discarding is safer than restoring a half-understood object into state.
    if (parsed.version !== SCHEMA_VERSION) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage disabled — nothing to clear */
  }
}

export function timeAgo(ts: number, now: number = Date.now()): string {
  const mins = Math.floor((now - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
