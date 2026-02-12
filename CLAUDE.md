# CLAUDE.md — OpenClay

## What is this?
OpenClay is a free, open-source web tool that lets users enrich spreadsheet data using their own AI API keys (Claude or Gemini). No accounts, no storage, no cost to us. Universal — works for any dataset type (companies, universities, people, countries, etc.).

## Stack
- Next.js (App Router) with TypeScript
- Tailwind CSS for styling
- Vercel for deployment (free tier)
- No database — everything is stateless and in-memory

## Key Principles
1. TRUST FIRST: Never store, log, or persist API keys or user data. Show privacy messaging on every step.
2. BYOK: User provides their own API key. Zero cost to us.
3. UNIVERSAL: Meta-prompt templates work for any dataset — not just B2B sales.
4. ACCURATE COSTS: Cost estimator must use real, current pricing from pricing.ts.
5. TEST BEFORE COMMIT: Users always test 5 rows before running the full batch.

## Architecture
- API routes are thin proxies — they pass the user's API key to Claude/Gemini and return the result. They log nothing.
- File parsing happens client-side (xlsx, papaparse)
- Cost estimation uses token counting + model pricing tables from lib/pricing.ts
- Enrichment runs one API call per row with retry logic and concurrency control
- API key lives in React state only — never localStorage, never cookies

## Models Supported
- Anthropic: Claude Haiku 4.5, Sonnet 4.5, Opus 4.5
- Google: Gemini 2.0 Flash, 2.5 Flash, 2.5 Pro

## Privacy Rules (NON-NEGOTIABLE)
- NEVER use localStorage or cookies for API keys
- NEVER log request bodies, API keys, or user data in server functions
- ALWAYS show trust/privacy messaging on every step of the UI
- API key stays in React useState() and nowhere else
- Vercel Web Analytics is used for anonymous page views (no cookies, no personal data)

## Commands
- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
