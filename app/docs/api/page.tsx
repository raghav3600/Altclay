import type { Metadata } from "next";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { ContentPage, H2, H3, P, UL, LI, Pre, Code, CTA } from "@/app/components/ContentPage";

export const metadata: Metadata = pageMetadata({
  title: "HTTP API: call OpenClay from your own code",
  description:
    "Enrich rows programmatically with a single POST. Works against a self-hosted instance or your own fork. No SDK, no auth layer, no rate limits of ours.",
  path: "/docs/api",
  keywords: [
    "data enrichment API",
    "AI enrichment API endpoint",
    "self hosted enrichment API",
    "enrich rows programmatically",
    "OpenClay API",
  ],
});

export default function ApiDocsPage() {
  return (
    <ContentPage
      title="Call OpenClay from your own code"
      lede="The UI is one client of a small HTTP API. If you are wiring enrichment into a pipeline rather than clicking through a browser, POST to it directly."
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Docs", path: "/docs/api" },
        { name: "HTTP API", path: "/docs/api" },
      ]}
    >
      <H2>Before you start</H2>
      <UL>
        <LI>
          <strong className="font-semibold text-ink">Run your own instance.</strong> The hosted
          endpoint at openclay.io exists to serve the web app and carries no uptime promise for
          programmatic use. Self-hosting takes three commands. See the{" "}
          <Code>/self-host</Code> guide.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">There is no OpenClay auth.</strong> The API
          forwards whatever provider key you send. Anyone who can reach your instance can spend your
          key, so do not expose it publicly without putting your own auth in front.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">One row per request.</strong> There is no batch
          endpoint by design, which keeps the server stateless. Fan out client-side with whatever
          concurrency your quota tolerates.
        </LI>
      </UL>

      <H2>POST /api/enrich</H2>
      <P>Sends one prompt to one model and returns parsed JSON plus token usage.</P>

      <H3>Request</H3>
      <Pre>{`curl -X POST http://localhost:3000/api/enrich \\
  -H 'content-type: application/json' \\
  -d '{
    "provider": "gemini",
    "apiKey": "AIza, ...",
    "modelId": "gemini-3-flash-preview",
    "prompt": "Find the CEO of Stripe. Return ONLY JSON: {\\"ceo\\":\\"string\\"}",
    "useWebSearch": true
  }'`}</Pre>

      <div className="thin-scroll mt-4 overflow-x-auto rounded border border-line">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-surface-2">
            <tr>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Field</th>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Type</th>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["provider", "string", "anthropic | gemini | grok | openai | custom"],
              ["apiKey", "string", "Your provider key. Optional only when provider is custom and the gateway needs none."],
              ["modelId", "string", "A model id from /models, or your own for a custom endpoint."],
              ["prompt", "string", "The fully-rendered prompt for one row. Ask for strict JSON."],
              ["useWebSearch", "boolean", "Defaults to true. Ignored by models without search."],
              ["baseUrl", "string", "Custom provider only. An OpenAI-compatible /v1 base URL."],
            ].map(([f, t, n]) => (
              <tr key={f} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-ink">{f}</td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-ink-3">{t}</td>
                <td className="px-3 py-2 text-ink-2">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H3>Response</H3>
      <Pre>{`{
  "data":         { "ceo": "Patrick Collison" },
  "inputTokens":  1284,
  "outputTokens": 31
}`}</Pre>
      <P>
        <Code>data</Code> is whatever JSON the model returned, flattened to string values so it maps
        cleanly onto spreadsheet cells. Nested objects are stringified rather than rendered as
        <Code>[object Object]</Code>.
      </P>

      <H3>Errors</H3>
      <P>
        The upstream status is preserved rather than collapsed into a 500, because that distinction
        is what makes a retry loop possible.
      </P>
      <UL>
        <LI>
          <Code>429</Code>: rate limited. Retry with backoff. <Code>retryAfterMs</Code> is included
          when the provider sent a Retry-After header.
        </LI>
        <LI>
          <Code>5xx</Code>: transient provider failure, worth retrying.
        </LI>
        <LI>
          <Code>400 / 401 / 403 / 404</Code>: bad request, bad key, no access, unknown model. These
          fail identically on every attempt, so do not retry them.
        </LI>
        <LI>
          <Code>422</Code>: the model replied but not with usable JSON, or was cut off. Usually a
          prompt problem.
        </LI>
      </UL>
      <Pre>{`{ "error": "Provider rejected the request (HTTP 404): model not found" }`}</Pre>

      <H2>POST /api/validate-key</H2>
      <P>Cheap probe to confirm a key works before spending real tokens on a batch.</P>
      <Pre>{`curl -X POST http://localhost:3000/api/validate-key \\
  -H 'content-type: application/json' \\
  -d '{ "provider": "openai", "apiKey": "sk-..." }'

# -> { "valid": true }
# -> { "valid": false, "error": "Key rejected by the provider." }
# -> { "valid": true, "warning": "Key is valid but currently rate limited." }`}</Pre>
      <P>
        A 429 reports <Code>valid: true</Code> with a warning, because a rate limit proves the key is
        real. Any other 4xx reports <Code>valid: false</Code> with the provider&apos;s own message.
      </P>

      <H2>A worked example</H2>
      <P>Enriching a CSV from Node, with bounded concurrency and retry on 429:</P>
      <Pre>{`import { readFileSync } from "node:fs";

const API = "http://localhost:3000/api/enrich";
const rows = JSON.parse(readFileSync("rows.json", "utf8"));

async function enrich(row) {
  const prompt = \`Find the CEO and funding of \${row.company}.
Return ONLY JSON: {"ceo":"string","funding":"string"}\`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        provider: "gemini",
        apiKey: process.env.GEMINI_API_KEY,
        modelId: "gemini-3-flash-preview",
        prompt,
      }),
    });

    if (res.ok) return { ...row, ...(await res.json()).data };

    // Only 429 and 5xx are worth another attempt.
    if (res.status !== 429 && res.status < 500) {
      throw new Error((await res.json()).error);
    }
    // Full jitter: random within a growing ceiling, so parallel
    // workers don't all retry on the same tick.
    await new Promise((r) => setTimeout(r, Math.random() * 1000 * 2 ** attempt));
  }
  throw new Error("exhausted retries");
}

// Keep concurrency modest; raise it once you know your quota.
const LIMIT = 3;
const out = [];
for (let i = 0; i < rows.length; i += LIMIT) {
  out.push(...(await Promise.all(rows.slice(i, i + LIMIT).map(enrich))));
}
console.log(JSON.stringify(out, null, 2));`}</Pre>

      <H2>Machine-readable summary</H2>
      <P>
        <Code>{SITE_URL}/llms.txt</Code> carries a plain-text description of the project, the full
        model catalog with current prices, and a precise statement of scope, written for
        assistants and agents rather than browsers.
      </P>

      <CTA label="Or use the web app" />
    </ContentPage>
  );
}
