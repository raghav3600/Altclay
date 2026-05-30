import type {
  Provider,
  ModelId,
  OutputColumn,
  ParsedFile,
  EnrichmentResult,
} from "./types";

// localStorage so the session survives BOTH a reload and a full tab close.
// NOTE (privacy): the API key is NEVER persisted — it stays in React state only.
const SESSION_KEY = "openclay_session_v1";
const SCHEMA_VERSION = 1;

export interface SavedSession {
  version: number;
  savedAt: number;
  file: ParsedFile | null;
  enrichmentDescription: string;
  inputColumns: string[];
  outputColumns: OutputColumn[];
  provider: Provider;
  modelId: ModelId;
  useWebSearch: boolean;
  advancedMode: boolean;
  customPrompt: string;
  testResults: EnrichmentResult[];
  testDone: boolean;
  fullResults: EnrichmentResult[];
  fullCompleted: number;
  fullFailed: number;
  fullDone: boolean;
}

export type SessionPayload = Omit<SavedSession, "version" | "savedAt">;

/** Returns true if the saved session has meaningful work worth restoring. */
export function hasMeaningfulWork(s: SessionPayload): boolean {
  return Boolean(
    s.file ||
      s.enrichmentDescription.trim() ||
      s.outputColumns.length > 0 ||
      s.fullResults.length > 0 ||
      s.testResults.length > 0
  );
}

export function saveSession(payload: SessionPayload): { ok: boolean; quotaExceeded?: boolean } {
  if (typeof window === "undefined") return { ok: false };
  try {
    const data: SavedSession = { version: SCHEMA_VERSION, savedAt: Date.now(), ...payload };
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (err) {
    const quotaExceeded =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, quotaExceeded };
  }
}

export function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
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
    // ignore
  }
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
