# CLAUDE.md, OpenClay

## What is this?
OpenClay is a free, open-source web tool that lets users enrich spreadsheet data using their own AI API keys (Claude or Gemini). No accounts, no storage, no cost to us. Universal, works for any dataset type (companies, universities, people, countries, etc.).

## Stack
- Next.js (App Router) with TypeScript
- Tailwind CSS for styling
- Vercel for deployment (free tier)
- No database, everything is stateless and in-memory

## Key Principles
1. TRUST FIRST: Never store, log, or persist API keys or user data. Show privacy messaging on every step.
2. BYOK: User provides their own API key. Zero cost to us.
3. UNIVERSAL: Meta-prompt templates work for any dataset, not just B2B sales.
4. ACCURATE COSTS: Cost estimator must use real, current pricing from pricing.ts.
5. TEST BEFORE COMMIT: Users always test 5 rows before running the full batch.

## Architecture
- API routes are thin proxies, they pass the user's API key to Claude/Gemini and return the result. They log nothing.
- File parsing happens client-side (xlsx, papaparse)
- Cost estimation uses token counting + model pricing tables from lib/pricing.ts
- Enrichment runs one API call per row with retry logic and concurrency control
- API key lives in React state only, never localStorage, never cookies

## Models Supported
The catalog lives in `lib/pricing.ts` as a single `ModelConfig[]` per provider,
add models there and the picker, cost estimator, landing page and SEO copy all
pick them up. Do not hard-code model names or counts in the UI.

- OpenAI: GPT-5.6 (Luna/Terra/Sol), GPT-5 (Mini/Nano), GPT-5.4 family, GPT-5.1
- Google: Gemini 3.x (Flash, Flash-Lite, Pro) and the 2.5 series
- Anthropic: Claude Haiku 4.5, Sonnet 5, Opus 5, plus previous flagships
- xAI: Grok 4.3, 4.5, and the 4.20 variants
- Custom: any OpenAI-compatible /v1/chat/completions endpoint (Azure, OpenRouter,
  Groq, Together, vLLM, Ollama, LM Studio), configured by the user at run time

Each model carries a `tier` (recommended/standard/legacy) that drives what the
picker shows before "show all", and its own search pricing, including any
per-search token overhead, which for OpenAI dominates the cost of a short row.

## Privacy Rules (NON-NEGOTIABLE)
- NEVER use localStorage or cookies for API keys
- NEVER log request bodies, API keys, or user data in server functions
- ALWAYS show trust/privacy messaging on every step of the UI
- API key stays in React useState() and nowhere else
- Vercel Web Analytics is used for anonymous page views (no cookies, no personal data)
- Session recovery (lib/sessionStore.ts) persists the in-progress session (file, settings, results) to localStorage on the user's own device so work survives a reload/tab-close. The API key is NEVER part of the saved session. This local-only storage is disclosed on the privacy page and clearable via "Start fresh".

## Environment
- `OPENCLAY_ALLOW_PRIVATE_ENDPOINTS` (default false), permits custom endpoints on
  loopback/private addresses so a self-hoster can use a local model. Leave OFF on
  any publicly reachable instance: the proxy runs server-side, so allowing private
  addresses turns a user-supplied URL into an SSRF vector (cloud metadata, internal
  services). Validation lives in `lib/customEndpoint.ts`.

## Commands
- `npm run dev`, Start development server
- `npm run build`, Build for production
- `npm run lint`, Run ESLint
- `npm run typecheck`, tsc --noEmit
- `npm run setup`, install and start (for people who just cloned)
