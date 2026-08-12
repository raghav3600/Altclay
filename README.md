<div align="center">

# OpenClay

**Enrich any spreadsheet with AI and live web search, using your own API key.**

The free, open-source alternative to Clay's AI research layer.
No account, no database, no platform fee.

[Live app](https://openclay.io/tool) · [vs Clay](https://openclay.io/alternatives/clay) · [Models & pricing](https://openclay.io/models) · [Use cases](https://openclay.io/use-cases) · [Self-host](https://openclay.io/self-host) · [HTTP API](https://openclay.io/docs/api)

</div>

---

## Quick start

```bash
git clone https://github.com/raghav3600/Altclay.git openclay && cd openclay && npm install && npm run dev
```

Open <http://localhost:3000>. There is no `.env` to fill in: API keys are entered in the browser at run time and never read from the environment.

<details>
<summary><strong>Other ways to run it</strong></summary>

**Without git history** (smaller, faster):

```bash
npx degit raghav3600/Altclay openclay && cd openclay && npm install && npm run dev
```

**Docker:**

```bash
docker compose up --build
```

**One-line setup script.** It clones, installs and starts. Read it first if you'd rather not pipe a script into your shell; it is a dozen lines and lives at [`public/install.sh`](public/install.sh):

```bash
curl -fsSL https://openclay.io/install.sh | sh
```

**Deploy your own:** fork, import into Vercel, deploy. No environment variables required.

</details>

## What it does

Upload a CSV or Excel file, describe what you need in plain English, and OpenClay builds one prompt per row, substituting that row's values, runs it against a model you choose, and writes the answers back as new columns.

```
Company    Domain        →  CEO name          Funding    Recent news
Stripe     stripe.com    →  Patrick Collison  $8.7B      Expanded Stripe Tax…
Vercel     vercel.com    →  Guillermo Rauch   $563M      Announced Next.js 16…
```

You pay the model provider directly. OpenClay takes nothing, and could not if it wanted to: there is no billing code in the repo.

## Requirements

- Node.js 20+
- An API key from OpenAI, Google, Anthropic or xAI, or any OpenAI-compatible endpoint

## Models

Four providers plus **any OpenAI-compatible endpoint** (Azure, OpenRouter, Groq, Together, Fireworks, vLLM, Ollama, LM Studio). The live catalog lives in [`lib/pricing.ts`](lib/pricing.ts); [/models](https://openclay.io/models) renders it with current prices.

Lists are ordered most capable first, driven by an explicit `rank` on each model rather than inferred from price, since a previous-generation flagship can cost more than a current-generation mid-tier while being less capable.

| Provider | Cheapest per 1,000 rows | Notes |
| --- | --- | --- |
| Google Gemini | ~$0.27 | 5,000 free grounded searches/month |
| xAI Grok | ~$5.66 | Search rate is our estimate; xAI publishes none |
| Anthropic Claude | ~$11.30 | $10/1k searches, no free tier |
| OpenAI GPT | ~$11.82 | $10/1k searches **plus** ~8k tokens of search content |

Figures include token cost, search fees and free allowances. Full table at [/models](https://openclay.io/models), source of truth in [`lib/pricing.ts`](lib/pricing.ts).

## Scope

OpenClay is the research layer. It covers any question whose answer is publicly findable and can be written as a sentence:

- Company context: leadership, funding, headcount, tech stack, recent news
- Custom questions no data-provider schema has a field for
- Any kind of list: products, universities, competitors, countries
- Live answers, researched at the moment you run them

It is not a contact database. Verified emails and phone numbers come from licensed providers such as Apollo or ZoomInfo, and running one of those alongside OpenClay is a common and effective setup: the provider supplies the contact record, OpenClay supplies the context around it. CRM sync and scheduled runs also stay with your existing stack.

As with any AI output, spot-check before acting on it. The five-row test reports a fill rate so you can see quality before committing to a batch.

## Privacy

These are architectural properties rather than policy promises, and you can verify each one in the source:

- Spreadsheets are parsed **in your browser** and never uploaded.
- Your API key lives in React state. Never written to disk, a database, a cookie or a log.
- The API routes are stateless proxies that exist only because browsers block cross-origin calls to provider APIs. They log nothing.
- No user accounts, no database.
- In-progress work is saved to your own `localStorage` so a reload doesn't lose a run. The key is never part of it.

## Project layout

| Path | What lives there |
| --- | --- |
| `app/tool/page.tsx` | The enrichment UI and run loop |
| `app/api/enrich/route.ts` | Provider proxy; one branch per provider |
| `lib/pricing.ts` | **Model catalog.** Add a model here and the picker, estimator, pricing pages and SEO copy all pick it up |
| `lib/promptTemplates.ts` | Per-row prompt building and template validation |
| `lib/enrichClient.ts` | Retry loop with jittered exponential backoff |
| `lib/runStats.ts` | Token-rate tracking, ETA, blank-cell counting |
| `lib/customEndpoint.ts` | URL validation for user-supplied endpoints (SSRF guard) |
| `lib/content.ts` | Use-case page content |
| `lib/alternatives.ts` | The Clay-alternative page cluster |
| `lib/sessionStore.ts` | Session recovery, never stores the API key |
| `lib/seo.ts` | Metadata, canonicals and JSON-LD helpers |

## Common changes

**Add a model**, append a `ModelConfig` to the right array in `lib/pricing.ts`. Set `tier` to control whether it appears before "show all". Nothing else needs touching.

**Add a provider**, extend the `Provider` union in `lib/types.ts`, add a `PROVIDER_META` entry, and add a branch in both API routes. TypeScript's exhaustive `Record` checks will point at every other place that needs updating.

**Change the theme**, every colour is a CSS variable at the top of `app/globals.css`, defined once for light and once for dark.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENCLAY_ALLOW_PRIVATE_ENDPOINTS` | `false` | Allows custom endpoints on loopback/private addresses so you can use a local model. **Only enable on an instance that isn't publicly reachable**, otherwise it becomes an SSRF vector. |

## Programmatic use

```bash
curl -X POST http://localhost:3000/api/enrich \
  -H 'content-type: application/json' \
  -d '{"provider":"gemini","apiKey":"AIza...","modelId":"gemini-3-flash-preview",
       "prompt":"Find the CEO of Stripe. Return ONLY JSON: {\"ceo\":\"string\"}"}'
```

Full reference, including the retry semantics and a worked Node example: [/docs/api](https://openclay.io/docs/api).

> The API forwards whatever provider key you send and has no auth of its own. Don't expose an instance publicly without putting your own auth in front of it.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm start       # serve the production build
npm run lint    # eslint
```

## Contributing

Issues and PRs welcome. Two things worth knowing:

1. **Pricing must be verifiable.** If you add or change a model, cite the provider's published rate in the PR, `lib/pricing.ts` carries a "last verified" date for a reason.
2. **Privacy rules are non-negotiable.** No localStorage for API keys, no logging of request bodies, no analytics on user data. See `CLAUDE.md`.

## Licence

Open source. See the repository for details.

---

Built by [Raghav](https://openclay.io/about), because enrichment shouldn't cost $150/month.
