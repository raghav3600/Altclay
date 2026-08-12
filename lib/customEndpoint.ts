/*
 * Validation for user-supplied endpoint URLs.
 *
 * The custom provider lets a user name any host, and the proxy then fetches it
 * server-side. That is a server-side request forgery primitive unless it is
 * constrained: without a check, "http://169.254.169.254/latest/meta-data/" or
 * "http://localhost:6379" would be fetched by our server, from inside our
 * network, with our credentials available to whatever responds.
 *
 * Self-hosters legitimately want localhost, that is how you reach Ollama or
 * LM Studio, so private ranges are permitted only when the deployment opts in
 * via OPENCLAY_ALLOW_PRIVATE_ENDPOINTS. The hosted instance leaves it off.
 */

export interface EndpointCheck {
  ok: boolean;
  url?: URL;
  error?: string;
}

/** Literal loopback / link-local / private ranges, by hostname or IP. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  "metadata.google.internal",
  "metadata.goog",
]);

function isPrivateIPv4(host: string): boolean {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, b, Number(m[3]), Number(m[4])].some((n) => n > 255)) return false;

  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 0) return true; // "this network"
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  return false;
}

function isPrivateIPv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    h === "::1" ||
    h === "::" ||
    h.startsWith("fc") || // unique local
    h.startsWith("fd") ||
    h.startsWith("fe80") // link-local
  );
}

export function privateEndpointsAllowed(): boolean {
  return process.env.OPENCLAY_ALLOW_PRIVATE_ENDPOINTS === "true";
}

/**
 * Validate a base URL before the server will fetch it.
 * Returns a parsed URL on success so callers don't re-parse.
 */
export function checkEndpointUrl(raw: string, allowPrivate = privateEndpointsAllowed()): EndpointCheck {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { ok: false, error: "Base URL is required." };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "That is not a valid URL. Include the scheme, e.g. https://api.example.com/v1" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: `Unsupported scheme "${url.protocol}". Use https (or http for a local model).` };
  }

  const host = url.hostname.toLowerCase();
  const isPrivate =
    BLOCKED_HOSTNAMES.has(host) ||
    isPrivateIPv4(host) ||
    isPrivateIPv6(host) ||
    host.endsWith(".local") ||
    host.endsWith(".internal");

  if (isPrivate && !allowPrivate) {
    return {
      ok: false,
      error:
        "This host is on a private or loopback address, which the hosted instance will not call. Self-host OpenClay and set OPENCLAY_ALLOW_PRIVATE_ENDPOINTS=true to use a local model.",
    };
  }

  // Plaintext to a public host would put the API key on the wire.
  if (url.protocol === "http:" && !isPrivate) {
    return { ok: false, error: "Use https for a public host, http would send your API key in plaintext." };
  }

  return { ok: true, url };
}

/**
 * Build the chat-completions URL from a user's base URL.
 * Accepts ".../v1", ".../v1/", or a full ".../v1/chat/completions" so people
 * can paste whatever their provider's docs showed them.
 */
export function chatCompletionsUrl(baseUrl: string): string {
  const base = baseUrl.trim().replace(/\/+$/, "");
  if (base.endsWith("/chat/completions")) return base;
  return `${base}/chat/completions`;
}
