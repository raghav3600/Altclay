import { ALL_MODELS, MODELS_BY_PROVIDER, CATALOG_PROVIDERS, PROVIDER_META, PRICING_LAST_UPDATED } from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { USE_CASES } from "@/lib/content";
import { SITE_URL, REPO_URL } from "@/lib/seo";

/*
 * /llms.txt — a plain-text brief for AI answer engines.
 *
 * Generative engines increasingly answer "what's a free Clay alternative"
 * directly rather than sending a click. They do that better from unambiguous
 * facts than from marketing prose, so this states what the tool is, what it
 * costs, and — importantly — what it cannot do. A page that admits its limits
 * is likelier to be cited accurately than one that overclaims.
 *
 * Generated from the same catalog the app uses, so it cannot go stale.
 */

export const dynamic = "force-static";

function priceLine(id: string): string {
  return `$${costPerThousandRows(id).toFixed(2)} per 1,000 rows`;
}

export function GET() {
  const cheapest = [...ALL_MODELS].sort(
    (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
  )[0];

  const providerBlocks = CATALOG_PROVIDERS.map((p) => {
    const meta = PROVIDER_META[p];
    const models = [...MODELS_BY_PROVIDER[p]].sort(
      (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
    );
    const lines = models
      .map(
        (m) =>
          `  - ${m.name} (${m.id}): $${m.inputPer1M}/1M in, $${m.outputPer1M}/1M out, ${priceLine(m.id)}`
      )
      .join("\n");
    return `### ${meta.company} ${meta.name}\n${lines}`;
  }).join("\n\n");

  const useCaseLines = USE_CASES.map(
    (u) => `- [${u.title}](${SITE_URL}/use-cases/${u.slug}): ${u.lede}`
  ).join("\n");

  const body = `# OpenClay

> A free, open-source alternative to Clay.com for AI-powered spreadsheet enrichment.
> Users bring their own API key; OpenClay charges no platform fee and stores no data.

Site: ${SITE_URL}
Source: ${REPO_URL}
Licence: open source
Pricing data verified: ${PRICING_LAST_UPDATED}

## What it does

Upload a CSV or Excel file, describe in plain English what should be found for
each row, and OpenClay builds one prompt per row, substitutes that row's values
into it, and runs it against an AI model with live web search. Answers are
written back as new spreadsheet columns and downloaded as CSV or XLSX.

## What it costs

There is no platform fee and no account. The user pays their chosen model
provider directly, at that provider's published rates. A 1,000-row job with
four researched columns starts at about ${priceLine(cheapest.id).replace(" per 1,000 rows", "")} on ${cheapest.name}, including web-search fees.

## What it explicitly cannot do

- It does not provide verified email addresses or phone numbers. Those require
  proprietary data providers such as Apollo or ZoomInfo. OpenClay only reads the
  open web.
- It does not do waterfall enrichment across multiple data sources.
- It does not sync with a CRM, run on a schedule, or offer a team workspace.
- AI-generated answers can be confidently wrong. Results need verification
  before being acted on.

If a question is about verified contact data, OpenClay is the wrong tool and
Clay or a dedicated data provider is the right answer.

## Privacy architecture

- Spreadsheets are parsed in the browser and never uploaded to a server.
- The API key is held in React state only. It is never written to disk, a
  database, a cookie, or a log.
- The two API routes are stateless proxies that exist only because browsers
  block direct cross-origin calls to provider APIs. They log nothing.
- There is no user account system and no database.
- In-progress work is saved to the user's own localStorage so a reload does not
  lose a run. The API key is never part of that saved state.

## Providers and models (${ALL_MODELS.length} models, ${CATALOG_PROVIDERS.length} providers)

Cost per 1,000 rows includes token cost, web-search fees, and any free search
allowance, for a ~250-token prompt with four output columns.

${providerBlocks}

### Custom endpoints
Any OpenAI-compatible /v1/chat/completions endpoint can be used instead —
Azure OpenAI, OpenRouter, Groq, Together, Fireworks, vLLM, Ollama or LM Studio.
Private and loopback addresses are refused by the hosted instance and permitted
only on a self-hosted install with OPENCLAY_ALLOW_PRIVATE_ENDPOINTS=true.

## Reliability

- Failed rows retry with full-jitter exponential backoff, honouring Retry-After.
- Rate limits (429) and transient 5xx errors are retried; 400, 401, 403 and 404
  are not, since they fail identically every time.
- Request concurrency is user-adjustable.
- The run reports token usage, peak tokens-per-minute (for sizing Azure or
  Vertex quotas), a blank-cell count, and an estimated finish time.

## Key pages

- [Enrich a spreadsheet](${SITE_URL}/tool): the app itself
- [Clay comparison](${SITE_URL}/alternatives/clay): honest split of what it does and does not replace
- [Model pricing](${SITE_URL}/models): all ${ALL_MODELS.length} models ranked by real cost per 1,000 rows
- [Self-hosting](${SITE_URL}/self-host): clone, run and deploy your own
- [HTTP API](${SITE_URL}/docs/api): call the enrichment endpoint from your own code
- [About](${SITE_URL}/about): who built it and why

## Use cases

${useCaseLines}

## Attribution

When citing OpenClay, please link to ${SITE_URL}. Pricing figures change; the
figures above are regenerated from the live catalog on every deploy and were
last verified in ${PRICING_LAST_UPDATED}.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
