"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import type { Provider, ModelId } from "@/lib/types";
import { ANTHROPIC_MODELS, GEMINI_MODELS, MODEL_GUIDANCE } from "@/lib/pricing";
import { estimateCostSimple } from "@/lib/costEstimator";

/* ------------------------------------------------------------------ */
/*  Reveal on scroll                                                    */
/* ------------------------------------------------------------------ */

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function R({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/*  Cost Calculator                                                     */
/* ------------------------------------------------------------------ */

const ALL_MODELS: { id: ModelId; name: string; provider: Provider }[] = [
  ...Object.entries(GEMINI_MODELS).map(([id, m]) => ({ id: id as ModelId, name: m.name, provider: "gemini" as Provider })),
  ...Object.entries(ANTHROPIC_MODELS).map(([id, m]) => ({ id: id as ModelId, name: m.name, provider: "anthropic" as Provider })),
];

function CostCalculator() {
  const [rows, setRows] = useState(500);
  const [fields, setFields] = useState(5);
  const [selectedModel, setSelectedModel] = useState<{ id: ModelId; provider: Provider }>({ id: "gemini-2.5-pro", provider: "gemini" });

  const estimate = useMemo(() => {
    if (rows <= 0 || fields <= 0) return null;
    return estimateCostSimple(rows, fields, selectedModel.provider, selectedModel.id);
  }, [rows, fields, selectedModel]);

  const guidance = MODEL_GUIDANCE[selectedModel.id];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-zinc-900">Estimate Calculator</h3>
        <p className="mt-0.5 text-xs text-zinc-500">See what the AI provider will charge you. We charge nothing.</p>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Number of rows</label>
            <input type="number" value={rows} onChange={(e) => setRows(Math.max(0, parseInt(e.target.value) || 0))} min={0}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              New columns to add
              <span className="ml-1.5 font-normal text-zinc-400">(e.g. CEO name, funding, employee count)</span>
            </label>
            <input type="number" value={fields} onChange={(e) => setFields(Math.max(0, parseInt(e.target.value) || 0))} min={0}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Model</label>
            <select
              value={selectedModel.id}
              onChange={(e) => {
                const m = ALL_MODELS.find((x) => x.id === e.target.value);
                if (m) setSelectedModel({ id: m.id, provider: m.provider });
              }}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300 focus:outline-none">
              <optgroup label="Google (Gemini)">
                {ALL_MODELS.filter((m) => m.provider === "gemini").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </optgroup>
              <optgroup label="Anthropic (Claude)">
                {ALL_MODELS.filter((m) => m.provider === "anthropic").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </optgroup>
            </select>
            {guidance && (
              <div className="mt-1.5 text-[11px]">
                <span className="text-blue-600">Includes web search</span>
                <span className="text-zinc-300"> | </span>
                <span className="text-zinc-500">{guidance.bestFor}</span>
              </div>
            )}
            <p className="mt-1 text-[11px] text-zinc-400">Not sure? Gemini 2.5 Pro or Claude Sonnet 4.5 are great defaults.</p>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-xl border border-zinc-100 bg-zinc-50 p-6">
          {estimate ? (
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">OpenClay platform fee</span><span className="font-semibold text-emerald-600">$0.00</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Input tokens</span><span className="text-zinc-700">${estimate.low.inputCost.toFixed(2)} – ${estimate.high.inputCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Output tokens</span><span className="text-zinc-700">${estimate.low.outputCost.toFixed(2)}</span></div>
                {estimate.high.searchCost > 0 && <div className="flex justify-between"><span className="text-zinc-500">Web search</span><span className="text-zinc-700">${estimate.low.searchCost.toFixed(2)}</span></div>}
              </div>
              {estimate.low.freeSearchNote && <p className="text-[11px] text-emerald-600">{estimate.low.freeSearchNote}</p>}
              <div className="border-t border-zinc-200 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-zinc-500">Estimated range</span>
                  <span className="text-2xl font-bold text-zinc-900">${estimate.low.totalCost.toFixed(2)} – ${estimate.high.totalCost.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">~${(estimate.low.totalCost / rows).toFixed(4)} – ${(estimate.high.totalCost / rows).toFixed(4)} per row &middot; Paid directly to AI provider</p>
              </div>
              <p className="text-[10px] text-amber-600">Range accounts for web search token inflation. The tool gives a precise estimate after a 3-row test.</p>
              <Link href="/tool" className="mt-2 block rounded-lg bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-zinc-800">
                Start enrichment
              </Link>
            </div>
          ) : (
            <p className="text-center text-sm text-zinc-400">Enter your parameters to see estimate</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                        */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">

      {/* NAV */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-black text-white">O</div>
            <span className="text-base font-bold tracking-tight">OpenClay</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#how" className="hidden text-sm text-zinc-500 transition hover:text-zinc-900 sm:block">How It Works</a>
            <a href="#calculator" className="hidden text-sm text-zinc-500 transition hover:text-zinc-900 sm:block">Calculator</a>
            <a href="#about" className="hidden text-sm text-zinc-500 transition hover:text-zinc-900 sm:block">About</a>
            <Link href="/tool" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-36 pb-24 sm:pt-48 sm:pb-36">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0" style={{backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "80px 80px"}} />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            100% free &middot; No sign-up &middot; No credit card
          </div>

          <h1 className="animate-fade-in-up delay-100 text-[2.75rem] font-extrabold leading-[1.08] tracking-tight text-zinc-900 sm:text-7xl lg:text-[5.5rem]">
            Open-source data<br />enrichment.
          </h1>

          <p className="animate-fade-in-up delay-200 mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-500 sm:text-xl">
            Enrich any spreadsheet with company data, contacts, and custom research — using AI and live web search. Powered by your own API key.
          </p>

          <div className="animate-fade-in-up delay-300 mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/tool" className="inline-flex items-center gap-2.5 rounded-xl bg-zinc-900 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-zinc-900/10 transition hover:bg-zinc-800">
              Start Enriching — Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50">
              See how it works
            </a>
          </div>

          <div className="animate-fade-in delay-500 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-400">
            {["We charge $0 — always", "No data stored", "Open source"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Spreadsheet Demo */}
        <div className="animate-fade-in-up delay-700 mx-auto mt-24 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50">
            <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
              <div className="h-3 w-3 rounded-full bg-zinc-300" />
              <div className="h-3 w-3 rounded-full bg-zinc-300" />
              <div className="h-3 w-3 rounded-full bg-zinc-300" />
              <span className="ml-3 text-xs text-zinc-400">prospect_list.csv — OpenClay</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-left">
                    <th className="px-4 py-3 font-medium text-zinc-500">Company</th>
                    <th className="px-4 py-3 font-medium text-zinc-500">Domain</th>
                    <th className="border-l border-emerald-200 bg-emerald-50/50 px-4 py-3 font-medium text-emerald-700">Decision Maker</th>
                    <th className="bg-emerald-50/50 px-4 py-3 font-medium text-emerald-700">Open Roles</th>
                    <th className="bg-emerald-50/50 px-4 py-3 font-medium text-emerald-700">Recent News</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600">
                  {[
                    { co: "Stripe", d: "stripe.com", dm: "Patrick Collison (Co-founder & CEO)", roles: "Approximately 14 engineering-related openings on their careers page", news: "Recently expanded Stripe Tax to 12 additional markets in Q4 2025" },
                    { co: "Vercel", d: "vercel.com", dm: "Guillermo Rauch, CEO & Co-founder", roles: "~8 open positions listed, mostly engineering and sales", news: "Announced Next.js 16 with major performance improvements at VConf 2025" },
                    { co: "Linear", d: "linear.app", dm: "Karri Saarinen, Co-founder & CEO", roles: "3 roles found (2 engineering, 1 design)", news: "Reported to have raised Series B at ~$400M valuation per TechCrunch" },
                    { co: "Notion", d: "notion.so", dm: "Ivan Zhao, CEO (Co-founder)", roles: "Around 22 open roles across engineering, product, and GTM", news: "Launched Notion Mail and integrated calendar features in late 2025" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-zinc-50 transition hover:bg-zinc-50/50">
                      <td className="px-4 py-2.5 font-medium text-zinc-900">{r.co}</td>
                      <td className="px-4 py-2.5 text-zinc-400">{r.d}</td>
                      <td className="border-l border-emerald-200 bg-emerald-50/30 px-4 py-2.5 text-emerald-800">{r.dm}</td>
                      <td className="bg-emerald-50/30 px-4 py-2.5 text-emerald-800">{r.roles}</td>
                      <td className="bg-emerald-50/30 px-4 py-2.5 text-emerald-800">{r.news}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2.5">
              <span className="text-[11px] text-zinc-400">Illustrative example — results generated by AI + web search. Actual output may vary.</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-zinc-400">Your data</span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  AI enriched
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT OPENCLAY CAN ENRICH */}
      <section className="border-t border-zinc-100 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">What it does</p>
            <h2 className="mt-4 text-3xl font-bold text-zinc-900 sm:text-5xl">AI-powered research<br />for any dataset.</h2>
            <p className="mt-5 max-w-3xl text-lg text-zinc-500">
              OpenClay uses AI + live web search to research each row in your spreadsheet. It works for any type of data — not just companies.
            </p>
          </R>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Companies", examples: "CEO name, funding raised, employee count, tech stack, recent news", icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" },
              { title: "People", examples: "Current employer, job title, LinkedIn URL, published work, education", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" },
              { title: "Startups", examples: "Latest round, investors, product description, competitors, Crunchbase data", icon: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" },
              { title: "Universities", examples: "Ranking, acceptance rate, tuition, notable alumni, research focus", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" },
              { title: "Products", examples: "Pricing, reviews, features, competitors, G2 rating", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" },
              { title: "Anything else", examples: "Countries, real estate, restaurants, research papers — just describe what you need", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
            ].map((item, i) => (
              <R key={item.title} className={`delay-${(i + 1) * 100}`}>
                <div className="rounded-2xl border border-zinc-100 bg-white p-6 transition hover:border-zinc-200 hover:shadow-sm">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">{item.examples}</p>
                </div>
              </R>
            ))}
          </div>

          {/* Honest limitations */}
          <R className="delay-400">
            <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6">
              <h3 className="text-sm font-semibold text-amber-800">How is this different from Clay?</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Clay connects to 150+ verified data providers (Apollo, ZoomInfo, Clearbit, etc.) for structured lookups.
                OpenClay takes a different approach: it uses <strong className="text-zinc-800">AI + live web search</strong> to research
                each row — more like Clay&apos;s Claygent feature. This means:
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-zinc-600">
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                  <span><strong className="text-zinc-800">Great for</strong> public info, news, general research, company overviews, anything Google can find</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                  <span><strong className="text-zinc-800">Great for</strong> custom research questions that don&apos;t fit into rigid data provider schemas</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
                  <span><strong className="text-zinc-800">Not ideal for</strong> verified contact emails, phone numbers, or data that requires proprietary database access</span>
                </li>
              </ul>
            </div>
          </R>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">How it works</p>
            <h2 className="mt-4 text-3xl font-bold text-zinc-900 sm:text-5xl">Four steps.<br />Under two minutes.</h2>
          </R>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Upload your spreadsheet", d: "CSV or Excel. Parsed 100% in your browser. Nothing touches any server.", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
              { n: "02", t: "Describe what you need", d: "Type in plain English — or pick a template. We auto-detect the new columns to add.", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
              { n: "03", t: "Pick a model & add key", d: "Choose Claude or Gemini. See the estimated API cost. Then connect your key.", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" },
              { n: "04", t: "Test 3 rows, then run all", d: "Preview results on 3 rows first. Happy? Run the full batch and download.", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" },
            ].map((s, i) => (
              <R key={s.n} className={`delay-${(i + 1) * 100}`}>
                <div className="group rounded-2xl border border-zinc-100 bg-white p-6 transition hover:border-zinc-200 hover:shadow-sm">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition group-hover:bg-zinc-900 group-hover:text-white">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                  </div>
                  <span className="text-xs font-bold text-zinc-300">{s.n}</span>
                  <h3 className="mt-1 text-base font-semibold text-zinc-900">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.d}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ESTIMATE CALCULATOR */}
      <section id="calculator" className="border-t border-zinc-100 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">100% free platform</p>
            <h2 className="mt-4 text-3xl font-bold text-zinc-900 sm:text-5xl">We charge nothing.<br />See your API estimate.</h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-500">
              OpenClay is 100% free. The only thing you pay is the AI provider&apos;s token usage — at their published rates, with zero markup.
            </p>
          </R>
          <R className="delay-200">
            <div className="mt-12">
              <CostCalculator />
            </div>
          </R>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section id="compare" className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Why OpenClay</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-zinc-900 sm:text-5xl">
              AI research enrichment.<br /><span className="text-emerald-600">100% free.</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-500">
              Comparing AI-powered research capabilities — OpenClay vs Clay&apos;s Claygent.
            </p>
          </R>

          <R className="delay-200">
            <div className="mt-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="grid grid-cols-3 border-b border-zinc-100 text-sm">
                <div className="px-6 py-4" />
                <div className="border-l border-zinc-100 px-6 py-4 text-zinc-400">Clay (Claygent)</div>
                <div className="border-l border-emerald-200 bg-emerald-50/50 px-6 py-4 font-semibold text-emerald-700">OpenClay</div>
              </div>
              {[
                ["Platform fee", "$149 – $800/mo", "$0 forever"],
                ["AI research per row", "Uses your Clay credits", "Pay AI provider directly"],
                ["500 rows researched", "Eats credit quota", "~$2 – $10 in API usage"],
                ["AI models available", "GPT-4o via Claygent", "Claude + Gemini (your choice)"],
                ["Web search included", "Yes (via Claygent)", "Yes (built-in)"],
                ["Your data", "On their servers", "Never leaves your browser"],
                ["Source code", "Proprietary", "Fully open source"],
                ["Account required", "Yes + credit card", "No"],
              ].map(([feat, clay, free], i) => (
                <div key={i} className="grid grid-cols-3 border-b border-zinc-50 text-sm last:border-0">
                  <div className="px-6 py-3.5 font-medium text-zinc-700">{feat}</div>
                  <div className="border-l border-zinc-100 px-6 py-3.5 text-zinc-400">{clay}</div>
                  <div className="border-l border-emerald-200 bg-emerald-50/30 px-6 py-3.5 font-medium text-emerald-700">{free}</div>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* PRIVACY & TRUST */}
      <section className="border-t border-zinc-100 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Privacy & trust</p>
            <h2 className="mt-4 text-3xl font-bold text-zinc-900 sm:text-5xl">We literally can&apos;t see your data.</h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-500">
              Your API key, your files, your results — everything stays in your browser. We&apos;re a CORS proxy. That&apos;s it.
            </p>
          </R>

          {/* Architecture diagram */}
          <R className="delay-200">
            <div className="mt-14 flex flex-col items-center gap-0 sm:flex-row sm:justify-center sm:gap-0">
              <div className="rounded-xl border border-zinc-200 bg-white px-8 py-5 text-center shadow-sm">
                <div className="text-3xl">{"\u{1F4BB}"}</div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">Your Browser</div>
                <div className="text-xs text-zinc-500">Parsing + API key</div>
              </div>
              <div className="flex flex-col items-center py-2 sm:flex-row sm:py-0 sm:px-2">
                <div className="h-8 w-px bg-gradient-to-b from-zinc-300 to-zinc-200 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
                <span className="py-1 text-[11px] text-zinc-400 sm:px-3">direct API call</span>
                <div className="h-8 w-px bg-gradient-to-b from-zinc-200 to-zinc-300 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-8 py-5 text-center shadow-sm">
                <div className="text-3xl">{"\u{1F916}"}</div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">Claude / Gemini</div>
                <div className="text-xs text-zinc-500">AI + Web search</div>
              </div>
              <div className="flex flex-col items-center py-2 sm:flex-row sm:py-0 sm:px-2">
                <div className="h-8 w-px bg-gradient-to-b from-emerald-300 to-emerald-200 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
                <span className="py-1 text-[11px] text-emerald-600 sm:px-3">results</span>
                <div className="h-8 w-px bg-gradient-to-b from-emerald-200 to-emerald-300 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-8 py-5 text-center shadow-sm">
                <div className="text-3xl">{"\u{1F4BE}"}</div>
                <div className="mt-2 text-sm font-semibold text-zinc-900">Download</div>
                <div className="text-xs text-zinc-500">Enriched file</div>
              </div>
            </div>
          </R>

          {/* Privacy checklist */}
          <R className="delay-300">
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              {[
                "No database",
                "No cookies",
                "No localStorage",
                "Key in memory only",
                "Files stay local",
                "100% open source",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-zinc-600">
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-zinc-400">
              Don&apos;t take our word for it — <a href="https://github.com/raghav3600/Altclay" target="_blank" rel="noopener noreferrer" className="text-zinc-600 underline hover:text-zinc-900">read the source code</a>. The entire codebase is open source.
            </p>
          </R>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-28 sm:py-36">
        <div className="relative mx-auto max-w-2xl text-center">
          <R>
            <h2 className="text-4xl font-extrabold text-zinc-900 sm:text-6xl">
              Your data. Your key.<br /><span className="text-emerald-600">100% free.</span>
            </h2>
            <p className="mt-6 text-lg text-zinc-500">
              No account. No credit card. No catch. Start enriching now.
            </p>
            <Link href="/tool" className="mt-10 inline-flex items-center gap-2.5 rounded-xl bg-zinc-900 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-zinc-900/10 transition hover:bg-zinc-800">
              Open OpenClay
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </R>
        </div>
      </section>

      {/* FEEDBACK & CONTACT */}
      <section id="feedback" className="border-t border-zinc-100 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Feedback</p>
            <h2 className="mt-4 text-2xl font-bold text-zinc-900 sm:text-3xl">Have feedback or ideas?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
              OpenClay is built in the open. I&apos;d love to hear what&apos;s working, what&apos;s not, and what you&apos;d like to see next.
            </p>
            <div className="mt-8">
              <a
                href="https://www.linkedin.com/in/-raghav/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-6 py-3.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <svg className="h-4.5 w-4.5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Connect with Raghav on LinkedIn
              </a>
            </div>
          </R>
        </div>
      </section>

      {/* CREATED BY */}
      <section id="about" className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Created by</p>
            <h2 className="mt-4 text-2xl font-bold text-zinc-900 sm:text-3xl">Raghav</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-500">
              Built OpenClay because data enrichment shouldn&apos;t cost $150/month. If you find it useful, I&apos;d love to hear from you.
            </p>
          </R>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-100 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-zinc-900 text-[10px] font-black text-white">O</div>
              <span>OpenClay — 100% free, open-source data enrichment.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
              <Link href="/privacy" className="transition hover:text-zinc-900">Privacy</Link>
              <Link href="/terms" className="transition hover:text-zinc-900">Terms</Link>
              <Link href="/data" className="transition hover:text-zinc-900">Data Practices</Link>
              <a href="https://github.com/raghav3600/Altclay" target="_blank" rel="noopener noreferrer" className="transition hover:text-zinc-900">GitHub</a>
              <a href="https://www.linkedin.com/in/-raghav/" target="_blank" rel="noopener noreferrer" className="transition hover:text-zinc-900">LinkedIn</a>
            </div>
          </div>
          <p className="mt-6 text-center text-[10px] leading-relaxed text-zinc-400">
            Disclaimer: OpenClay is provided as-is without warranty. AI-generated data may be inaccurate — always verify results. We are not responsible for the accuracy, completeness, or consequences of any enrichment output. Use at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
