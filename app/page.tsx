"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { ALL_MODELS, MODELS_BY_PROVIDER, PROVIDER_META, CATALOG_PROVIDERS, getModel } from "@/lib/pricing";
import { estimateCostSimple } from "@/lib/costEstimator";
import { formatUSD, formatUSDRange } from "@/lib/runStats";
import { FAQJsonLd, FAQ_ITEMS } from "./structured-data";
import { SiteFooter } from "./components/ContentPage";
import {
  ProviderLogo,
  CheckIcon,
  LockIcon,
  GlobeIcon,
  AlertIcon,
  PlusIcon,
  LinkedInIcon,
  GitHubIcon,
} from "./components/icons";

/* ------------------------------------------------------------------ */
/*  Reveal-on-scroll                                                    */
/* ------------------------------------------------------------------ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function R({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-ink sm:text-4xl">
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/*  Cost calculator                                                     */
/* ------------------------------------------------------------------ */

function CostCalculator() {
  const [rows, setRows] = useState(500);
  const [fields, setFields] = useState(5);
  const [modelId, setModelId] = useState("gemini-3-flash-preview");

  const model = getModel(modelId);
  const estimate = useMemo(
    () => (rows > 0 && fields > 0 && model ? estimateCostSimple(rows, fields, modelId) : null),
    [rows, fields, modelId, model]
  );

  // Cheapest model for the current shape, so we can point out a better option.
  const cheapest = useMemo(() => {
    if (rows <= 0 || fields <= 0) return null;
    return ALL_MODELS.map((m) => ({
      model: m,
      total: estimateCostSimple(rows, fields, m.id).low.totalCost,
    })).sort((a, b) => a.total - b.total)[0];
  }, [rows, fields]);

  return (
    <div className="overflow-hidden rounded border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">What will it cost?</h3>
          <p className="mt-0.5 text-[11px] text-ink-2">
            Paid to the provider at their published rates. OpenClay takes nothing.
          </p>
        </div>
        <span className="hidden rounded border border-data-line bg-data-soft px-2 py-1 font-mono text-[10px] text-data sm:inline">
          $0 platform fee
        </span>
      </div>

      <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-5">
        <div className="space-y-4">
          <div>
            <label htmlFor="calc-rows" className="eyebrow">
              Rows to enrich
            </label>
            <input
              id="calc-rows"
              type="number"
              min={0}
              value={rows}
              onChange={(e) => setRows(Math.max(0, parseInt(e.target.value) || 0))}
              className="mt-1.5 w-full rounded border border-line bg-surface-2 px-2.5 py-2 font-mono text-sm text-ink focus:border-accent focus:bg-surface focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="calc-fields" className="eyebrow">
              New columns per row
            </label>
            <input
              id="calc-fields"
              type="number"
              min={0}
              value={fields}
              onChange={(e) => setFields(Math.max(0, parseInt(e.target.value) || 0))}
              className="mt-1.5 w-full rounded border border-line bg-surface-2 px-2.5 py-2 font-mono text-sm text-ink focus:border-accent focus:bg-surface focus:outline-none"
            />
            <p className="mt-1 font-mono text-[10px] text-ink-3">e.g. CEO, funding, headcount</p>
          </div>

          <div>
            <label htmlFor="calc-model" className="eyebrow">
              Model
            </label>
            <select
              id="calc-model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="mt-1.5 w-full rounded border border-line bg-surface-2 px-2.5 py-2 font-mono text-xs text-ink focus:border-accent focus:bg-surface focus:outline-none"
            >
              {CATALOG_PROVIDERS.map((p) => (
                <optgroup key={p} label={`${PROVIDER_META[p].company} (${PROVIDER_META[p].name})`}>
                  {MODELS_BY_PROVIDER[p].map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — ${m.inputPer1M}/${m.outputPer1M} per 1M
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {model && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-snug text-ink-2">
                <ProviderLogo provider={model.provider} className="h-3 w-3 shrink-0" />
                {model.bestFor}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center rounded border border-line bg-surface-2 p-4">
          {estimate ? (
            <>
              <div className="text-center">
                <div className="eyebrow">Estimated range</div>
                <div className="mt-1 font-mono text-3xl font-bold text-ink tnum">
                  {formatUSDRange(estimate.low.totalCost, estimate.high.totalCost)}
                </div>
                <div className="mt-1 font-mono text-[10px] text-ink-3 tnum">
                  ${(estimate.low.totalCost / rows).toFixed(4)}–
                  {(estimate.high.totalCost / rows).toFixed(4)} per row
                </div>
              </div>

              <dl className="mt-4 space-y-1 border-t border-line pt-3 font-mono text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-ink-3">OpenClay fee</dt>
                  <dd className="font-semibold text-data">$0.00</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-3">Input tokens</dt>
                  <dd className="text-ink-2 tnum">
                    {formatUSDRange(estimate.low.inputCost, estimate.high.inputCost)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-3">Output tokens</dt>
                  <dd className="text-ink-2 tnum">{formatUSD(estimate.low.outputCost)}</dd>
                </div>
                {estimate.low.searchCost >= 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-3">Web search</dt>
                    <dd className="text-ink-2 tnum">{formatUSD(estimate.low.searchCost)}</dd>
                  </div>
                )}
              </dl>

              {estimate.low.freeSearchNote && (
                <p className="mt-2 text-[10px] leading-snug text-data">{estimate.low.freeSearchNote}</p>
              )}

              {cheapest && cheapest.model.id !== modelId && (
                <button
                  onClick={() => setModelId(cheapest.model.id)}
                  className="mt-2 text-left text-[10px] leading-snug text-accent underline decoration-accent-line underline-offset-2"
                >
                  {cheapest.model.name} would run this for about {formatUSD(cheapest.total)} — switch?
                </button>
              )}

              <Link
                href="/tool"
                className="mt-4 block rounded bg-accent py-2.5 text-center text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                Start enriching
              </Link>
            </>
          ) : (
            <p className="text-center text-xs text-ink-3">Enter rows and columns to see an estimate.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const DEMO_ROWS = [
  {
    co: "Stripe",
    d: "stripe.com",
    dm: "Patrick Collison (Co-founder & CEO)",
    roles: "~14 engineering openings on their careers page",
    news: "Expanded Stripe Tax to 12 additional markets",
  },
  {
    co: "Vercel",
    d: "vercel.com",
    dm: "Guillermo Rauch, CEO & Co-founder",
    roles: "~8 open positions, mostly engineering and sales",
    news: "Announced Next.js 16 with major performance work",
  },
  {
    co: "Linear",
    d: "linear.app",
    dm: "Karri Saarinen, Co-founder & CEO",
    roles: "3 roles (2 engineering, 1 design)",
    news: "Reported Series B at ~$400M valuation",
  },
  {
    co: "Notion",
    d: "notion.so",
    dm: "Ivan Zhao, CEO & Co-founder",
    roles: "~22 roles across engineering, product and GTM",
    news: "Launched Notion Mail and calendar integration",
  },
];

const USE_CASES = [
  { title: "Companies", examples: "CEO, funding raised, headcount, tech stack, recent news" },
  { title: "People", examples: "Current employer, job title, LinkedIn URL, published work" },
  { title: "Startups", examples: "Latest round, investors, product summary, competitors" },
  { title: "Universities", examples: "Ranking, acceptance rate, tuition, notable alumni" },
  { title: "Products", examples: "Pricing, reviews, feature set, competitors, G2 rating" },
  { title: "Anything else", examples: "Countries, property, restaurants, papers — just describe it" },
];

const STEPS = [
  {
    n: "01",
    t: "Load your spreadsheet",
    d: "CSV or Excel, parsed entirely in your browser. Nothing reaches a server.",
  },
  {
    n: "02",
    t: "Say what you need",
    d: "Plain English, or start from a preset. New columns are detected for you.",
  },
  {
    n: "03",
    t: "Pick a model, add your key",
    d: "GPT, Gemini, Claude or Grok. See the cost before you commit. Key stays in memory.",
  },
  {
    n: "04",
    t: "Test 5 rows, then run",
    d: "The test gives you an exact per-row cost and a fill-rate check. Then run the batch.",
  },
];

const COMPARISON: [string, string, string][] = [
  ["Platform fee", "$149 – $800/mo", "$0 forever"],
  ["AI research per row", "Uses your Clay credits", "Paid to the provider directly"],
  ["500 rows researched", "Eats credit quota", "~$1 – $10 in API usage"],
  ["Model choice", "Claygent's model", `${CATALOG_PROVIDERS.length} providers, ${ALL_MODELS.length} models`],
  ["Web search", "Yes, via Claygent", "Yes, built in"],
  ["Where your data lives", "Their servers", "Your browser"],
  ["Rate-limit handling", "Managed for you", "Backoff + retry + tunable concurrency"],
  ["Source code", "Proprietary", "Fully open source"],
  ["Account required", "Yes, plus a card", "No"],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ---------- NAV ---------- */}
      <nav className="fixed top-0 z-50 w-full border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="" className="h-7 w-7" />
            <span className="text-sm font-bold tracking-tight">OpenClay</span>
          </Link>
          <div className="flex items-center gap-5">
            {[
              ["#how", "How it works"],
              ["#calculator", "Pricing"],
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="hidden font-mono text-[11px] text-ink-2 transition-colors hover:text-accent sm:block"
              >
                {label}
              </a>
            ))}
            <Link
              href="/tool"
              className="rounded bg-accent px-3.5 py-1.5 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Open the app
            </Link>
          </div>
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <section className="blueprint-grid relative overflow-hidden border-b border-line px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="animate-rise mb-6 inline-flex items-center gap-2 rounded border border-line bg-surface px-2.5 py-1 font-mono text-[10px] text-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-data" />
            Free forever · No sign-up · No card
          </div>

          <h1 className="animate-rise delay-100 text-[2.5rem] font-extrabold leading-[1.03] tracking-[-0.02em] text-ink sm:text-6xl">
            Enrich a spreadsheet
            <br />
            <span className="text-accent">with your own API key.</span>
          </h1>

          <p className="animate-rise delay-200 mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
            The open-source alternative to Clay. Point it at a CSV, describe what you need in plain
            English, and it researches every row with AI and live web search. You pay the model provider
            directly — we take nothing.
          </p>

          <div className="animate-rise delay-300 mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tool"
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-accent px-7 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover sm:w-auto"
            >
              Start enriching — free
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href="#how"
              className="inline-flex w-full items-center justify-center rounded border border-line-strong bg-surface px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 sm:w-auto"
            >
              See how it works
            </a>
          </div>

          <div className="animate-fade delay-500 mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] text-ink-3">
            {["We charge $0, always", "Nothing stored", "Open source", `${CATALOG_PROVIDERS.length} providers, ${ALL_MODELS.length} models`].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckIcon className="h-3 w-3 text-data" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Demo table */}
        <div className="animate-rise delay-700 mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded border border-line bg-surface shadow-sm">
            <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-line-strong" />
              <span className="h-2 w-2 rounded-full bg-line-strong" />
              <span className="h-2 w-2 rounded-full bg-line-strong" />
              <span className="ml-2 font-mono text-[10px] text-ink-3">
                prospect_list.csv — enriched
              </span>
            </div>
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[11px]">
                <thead>
                  <tr className="bg-surface-2 text-left">
                    <th className="border-b border-line px-3 py-2 font-medium text-ink-3">Company</th>
                    <th className="border-b border-line px-3 py-2 font-medium text-ink-3">Domain</th>
                    {["Decision maker", "Open roles", "Recent news"].map((h) => (
                      <th
                        key={h}
                        className="border-b border-data-line bg-data-soft px-3 py-2 font-medium text-data"
                      >
                        <span className="flex items-center gap-1">
                          <PlusIcon className="h-2.5 w-2.5" />
                          {h}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ROWS.map((r) => (
                    <tr key={r.co} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-semibold text-ink">{r.co}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-ink-3">{r.d}</td>
                      <td className="bg-data-soft/40 px-3 py-2 text-ink-2">{r.dm}</td>
                      <td className="bg-data-soft/40 px-3 py-2 text-ink-2">{r.roles}</td>
                      <td className="bg-data-soft/40 px-3 py-2 text-ink-2">{r.news}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
              <span className="font-mono text-[10px] text-ink-3">
                Illustrative example. Real output varies — always verify.
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-data">
                <span className="h-1.5 w-1.5 rounded-full bg-data" />
                AI-generated columns
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- USE CASES ---------- */}
      <section className="border-b border-line px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <R>
            <SectionLabel>What it does</SectionLabel>
            <Heading>Research for any dataset.</Heading>
            <p className="mt-4 max-w-2xl text-base text-ink-2">
              Every row gets its own prompt, its own web search and its own answer. It works for any kind
              of list — not just companies. Browse{" "}
              <Link
                href="/use-cases"
                className="text-accent underline decoration-accent-line underline-offset-2"
              >
                worked examples
              </Link>
              .
            </p>
          </R>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((item, i) => (
              <R key={item.title} className={`delay-${((i % 4) + 1) * 100}`}>
                <div className="h-full rounded border border-line bg-surface p-4 transition-colors hover:border-line-strong">
                  <h3 className="text-sm font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-ink-2">
                    {item.examples}
                  </p>
                </div>
              </R>
            ))}
          </div>

          {/* Honest limitations */}
          <R className="delay-400">
            <div className="mt-12 rounded border border-warn-line bg-warn-soft p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-warn">
                <AlertIcon className="h-4 w-4" />
                Where this differs from Clay — and where it falls short
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">
                Clay connects to 150+ verified data providers (Apollo, ZoomInfo, Clearbit) for structured
                lookups. OpenClay does something different: it uses{" "}
                <strong className="font-semibold text-ink">AI plus live web search</strong> to research each
                row, closer to Clay&apos;s Claygent. That trade-off cuts both ways:
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-2">
                Full breakdown on the{" "}
                <Link
                  href="/alternatives/clay"
                  className="text-accent underline decoration-accent-line underline-offset-2"
                >
                  Clay comparison page
                </Link>
                .
              </p>
              <ul className="mt-3 space-y-2 text-[13px] text-ink-2">
                {[
                  ["good", "Public information, news, company overviews — anything findable on the open web"],
                  ["good", "Custom research questions that don't fit a rigid data-provider schema"],
                  ["bad", "Verified contact emails and phone numbers, or anything behind a proprietary database"],
                  ["bad", "Guaranteed accuracy — a model can be confidently wrong, so spot-check before acting"],
                ].map(([kind, text]) => (
                  <li key={text} className="flex items-start gap-2">
                    {kind === "good" ? (
                      <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-data" />
                    ) : (
                      <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
                    )}
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </R>
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how" className="border-b border-line bg-surface-2 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <R>
            <SectionLabel>How it works</SectionLabel>
            <Heading>Four steps, about two minutes.</Heading>
          </R>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <R key={s.n} className={`delay-${(i + 1) * 100}`}>
                <div className="h-full rounded border border-line bg-surface p-4">
                  <span className="font-mono text-[11px] font-bold text-accent">{s.n}</span>
                  <h3 className="mt-1.5 text-sm font-semibold text-ink">{s.t}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">{s.d}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CALCULATOR ---------- */}
      <section id="calculator" className="border-b border-line px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <R>
            <SectionLabel>Pricing</SectionLabel>
            <Heading>
              We charge nothing.
              <br />
              Here is what the model costs.
            </Heading>
            <p className="mt-4 max-w-2xl text-base text-ink-2">
              No markup, no credits, no seats. You are billed by OpenAI, Google, Anthropic or xAI at their
              published rates — and the tool tells you the number before you commit. See{" "}
              <Link
                href="/models"
                className="text-accent underline decoration-accent-line underline-offset-2"
              >
                every model compared
              </Link>
              .
            </p>
          </R>
          <R className="delay-200">
            <div className="mt-10">
              <CostCalculator />
            </div>
          </R>
        </div>
      </section>

      {/* ---------- COMPARISON ---------- */}
      <section id="compare" className="border-b border-line bg-surface-2 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <R>
            <SectionLabel>Why OpenClay</SectionLabel>
            <Heading>
              The same AI research,
              <br />
              <span className="text-accent">without the subscription.</span>
            </Heading>
          </R>

          <R className="delay-200">
            <div className="mt-10 overflow-hidden rounded border border-line bg-surface">
              <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-line font-mono text-[10px]">
                <div className="px-4 py-2.5" />
                <div className="border-l border-line px-4 py-2.5 uppercase tracking-wide text-ink-3">
                  Clay (Claygent)
                </div>
                <div className="border-l border-accent-line bg-accent-soft px-4 py-2.5 font-semibold uppercase tracking-wide text-accent">
                  OpenClay
                </div>
              </div>
              {COMPARISON.map(([feat, clay, ours]) => (
                <div
                  key={feat}
                  className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-line text-[12px] last:border-0"
                >
                  <div className="px-4 py-2.5 font-medium text-ink">{feat}</div>
                  <div className="border-l border-line px-4 py-2.5 text-ink-3">{clay}</div>
                  <div className="border-l border-accent-line bg-accent-soft/40 px-4 py-2.5 font-medium text-ink">
                    {ours}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] text-ink-3">
              Clay pricing from their public pricing page and subject to change. Comparison covers
              AI-research features only, not Clay&apos;s data-provider integrations.
            </p>
          </R>
        </div>
      </section>

      {/* ---------- PRIVACY ---------- */}
      <section className="border-b border-line px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <R>
            <SectionLabel>Privacy &amp; trust</SectionLabel>
            <Heading>We cannot see your data.</Heading>
            <p className="mt-4 max-w-2xl text-base text-ink-2">
              This is an architectural claim, not a policy promise. Files are parsed in your browser. Your
              key is held in React state. The API route is a stateless proxy that logs nothing.
            </p>
          </R>

          {/* Data-flow diagram */}
          <R className="delay-200">
            <div className="mt-10 grid items-stretch gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {[
                { label: "Your browser", sub: "Parses the file, holds the key", icon: <LockIcon className="h-4 w-4" /> },
                { label: "Model provider", sub: "OpenAI · Google · Anthropic · xAI", icon: <GlobeIcon className="h-4 w-4" /> },
                { label: "Your download", sub: "Enriched file, locally built", icon: <CheckIcon className="h-4 w-4" /> },
              ].map((box, i) => (
                <div key={box.label} className="contents">
                  {i > 0 && (
                    <div
                      aria-hidden="true"
                      className="flex items-center justify-center py-1 font-mono text-[10px] text-ink-3 sm:px-1"
                    >
                      <span className="sm:hidden">↓</span>
                      <span className="hidden sm:inline">→</span>
                    </div>
                  )}
                  <div className="rounded border border-line bg-surface px-4 py-4 text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded border border-line text-ink-2">
                      {box.icon}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-ink">{box.label}</div>
                    <div className="mt-0.5 font-mono text-[10px] leading-snug text-ink-3">{box.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center font-mono text-[10px] text-ink-3">
              The proxy exists only because browsers block direct cross-origin calls to these APIs.
            </p>
          </R>

          <R className="delay-300">
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {[
                "No database",
                "No cookies",
                "No localStorage",
                "Key in memory only",
                "Files never uploaded",
                "Nothing logged",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5 font-mono text-[11px] text-ink-2">
                  <CheckIcon className="h-3 w-3 shrink-0 text-data" />
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-ink-3">
              Don&apos;t take our word for it —{" "}
              <a
                href="https://github.com/raghav3600/Altclay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-accent-line underline-offset-2"
              >
                read the source
              </a>
              .
            </p>
          </R>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="border-b border-line bg-surface-2 px-4 py-24 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <R>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              Your data. Your key.
              <br />
              <span className="text-accent">Zero platform fee.</span>
            </h2>
            <p className="mt-5 text-base text-ink-2">No account, no card, no catch.</p>
            <Link
              href="/tool"
              className="mt-8 inline-flex items-center gap-2 rounded bg-accent px-8 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
            >
              Open OpenClay
              <span aria-hidden="true">→</span>
            </Link>
          </R>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section id="faq" className="border-b border-line px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <FAQJsonLd />
          <R>
            <SectionLabel>FAQ</SectionLabel>
            <Heading>Frequently asked questions</Heading>
          </R>
          <div className="mt-10 divide-y divide-line overflow-hidden rounded border border-line bg-surface">
            {FAQ_ITEMS.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-[13px] font-semibold text-ink marker:[font-size:0] hover:bg-surface-2">
                  {faq.q}
                  <PlusIcon className="h-3.5 w-3.5 shrink-0 text-ink-3 transition-transform group-open:rotate-45" />
                </summary>
                <div className="border-t border-line bg-surface-2 px-4 py-3.5 text-[13px] leading-relaxed text-ink-2">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FEEDBACK / ABOUT ---------- */}
      <section id="feedback" className="border-b border-line px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <R>
            <SectionLabel>Feedback</SectionLabel>
            <h2 className="mt-3 text-xl font-bold text-ink sm:text-2xl">
              Built in the open by Raghav
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-ink-2">
              OpenClay exists because enrichment shouldn&apos;t cost $150 a month. Several features here —
              the reset control, the token and rate-limit stats, exponential backoff — came from users who
              wrote in. Tell me what&apos;s missing.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <a
                href="https://www.linkedin.com/in/-raghav/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-line-strong bg-surface px-4 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
              >
                <LinkedInIcon className="h-3.5 w-3.5" />
                Connect on LinkedIn
              </a>
              <a
                href="https://github.com/raghav3600/Altclay"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border border-line-strong bg-surface px-4 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
              >
                <GitHubIcon className="h-3.5 w-3.5" />
                Open an issue
              </a>
            </div>
          </R>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
