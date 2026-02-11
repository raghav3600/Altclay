"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import type { Provider, ModelId } from "@/lib/types";
import { ANTHROPIC_MODELS, GEMINI_MODELS, MODEL_GUIDANCE } from "@/lib/pricing";
import { estimateCostSimple } from "@/lib/costEstimator";

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

// All models flattened for the calculator
const ALL_MODELS: { id: ModelId; name: string; provider: Provider }[] = [
  ...Object.entries(ANTHROPIC_MODELS).map(([id, m]) => ({ id: id as ModelId, name: m.name, provider: "anthropic" as Provider })),
  ...Object.entries(GEMINI_MODELS).map(([id, m]) => ({ id: id as ModelId, name: m.name, provider: "gemini" as Provider })),
];

function CostCalculator() {
  const [rows, setRows] = useState(500);
  const [fields, setFields] = useState(5);
  const [selectedModel, setSelectedModel] = useState<{ id: ModelId; provider: Provider }>({ id: "claude-sonnet-4-5-20250929", provider: "anthropic" });

  const estimate = useMemo(() => {
    if (rows <= 0 || fields <= 0) return null;
    return estimateCostSimple(rows, fields, selectedModel.provider, selectedModel.id);
  }, [rows, fields, selectedModel]);

  const guidance = MODEL_GUIDANCE[selectedModel.id];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
      <div className="border-b border-white/5 px-6 py-4">
        <h3 className="text-sm font-semibold text-white">Estimate Calculator</h3>
        <p className="mt-0.5 text-xs text-zinc-500">See what the AI provider will charge you. We charge nothing.</p>
      </div>

      <div className="grid gap-6 p-6 sm:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Number of rows</label>
            <input type="number" value={rows} onChange={(e) => setRows(Math.max(0, parseInt(e.target.value) || 0))} min={0}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">
              New columns to add
              <span className="ml-1.5 font-normal text-zinc-600">(e.g. CEO name, funding, employee count)</span>
            </label>
            <input type="number" value={fields} onChange={(e) => setFields(Math.max(0, parseInt(e.target.value) || 0))} min={0}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-400">Model</label>
            <select
              value={selectedModel.id}
              onChange={(e) => {
                const m = ALL_MODELS.find((x) => x.id === e.target.value);
                if (m) setSelectedModel({ id: m.id, provider: m.provider });
              }}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none">
              <optgroup label="Anthropic (Claude)">
                {ALL_MODELS.filter((m) => m.provider === "anthropic").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </optgroup>
              <optgroup label="Google (Gemini)">
                {ALL_MODELS.filter((m) => m.provider === "gemini").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </optgroup>
            </select>
            {guidance && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                <span className="text-blue-400">Has web search</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-500">{guidance.bestFor}</span>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center rounded-xl border border-white/5 bg-zinc-800/50 p-6">
          {estimate ? (
            <div className="space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">FreeClay platform fee</span><span className="font-semibold text-emerald-400">$0.00</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Input tokens</span><span className="text-zinc-300">${estimate.inputCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Output tokens</span><span className="text-zinc-300">${estimate.outputCost.toFixed(2)}</span></div>
                {estimate.searchCost > 0 && <div className="flex justify-between"><span className="text-zinc-500">Web search</span><span className="text-zinc-300">${estimate.searchCost.toFixed(2)}</span></div>}
              </div>
              {estimate.freeSearchNote && <p className="text-[11px] text-emerald-400">{estimate.freeSearchNote}</p>}
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-zinc-400">Estimated total</span>
                  <span className="text-3xl font-bold text-white">~${estimate.totalCost.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-600">~${(estimate.totalCost / rows).toFixed(4)} per row &middot; Paid directly to AI provider, not us</p>
              </div>
              <Link href="/tool" className="mt-2 block rounded-lg bg-white py-2.5 text-center text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200">
                Start free enrichment
              </Link>
            </div>
          ) : (
            <p className="text-center text-sm text-zinc-500">Enter your parameters to see estimate</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">

      {/* NAV */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-[#09090b]">F</div>
            <span className="text-base font-bold tracking-tight">FreeClay</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#how" className="hidden text-sm text-zinc-400 transition hover:text-white sm:block">How It Works</a>
            <a href="#calculator" className="hidden text-sm text-zinc-400 transition hover:text-white sm:block">Calculator</a>
            <a href="#about" className="hidden text-sm text-zinc-400 transition hover:text-white sm:block">About Me</a>
            <Link href="/tool" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#09090b] transition hover:bg-zinc-200">
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-36 pb-24 sm:pt-44 sm:pb-32">
        <div className="pointer-events-none absolute inset-0" style={{backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "64px 64px"}} />
        <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            100% free &middot; No sign-up &middot; No credit card
          </div>

          <h1 className="animate-fade-in-up delay-100 text-[2.75rem] font-extrabold leading-[1.08] tracking-tight sm:text-7xl lg:text-8xl">
            Free data enrichment.<br />
            <span className="gradient-text">Powered by your API key.</span>
          </h1>

          <div className="animate-fade-in-up delay-300 mt-10">
            <Link href="/tool" className="animate-pulse-glow inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#09090b] shadow-xl transition hover:bg-zinc-100">
              Start 100% Free Enrichment
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>

          <div className="animate-fade-in delay-500 mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
            {["We charge $0 — always", "No data stored", "No tracking", "Open source"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Spreadsheet Demo */}
        <div className="animate-fade-in-up delay-700 mx-auto mt-20 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-1.5 border-b border-white/5 bg-zinc-900 px-4 py-2.5">
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <div className="h-3 w-3 rounded-full bg-zinc-700" />
              <span className="ml-3 text-xs text-zinc-500">prospect_list.csv — FreeClay</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-white/5 text-left">
                    <th className="px-4 py-3 font-medium text-zinc-400">Company</th>
                    <th className="px-4 py-3 font-medium text-zinc-400">Domain</th>
                    <th className="border-l border-indigo-500/30 bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Decision Maker</th>
                    <th className="bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Open Roles</th>
                    <th className="bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Sustainability Initiatives</th>
                    <th className="bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Recent News</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {[
                    { co: "Stripe", d: "stripe.com", dm: "Patrick Collison, CEO", roles: "14 engineering roles", sust: "100% renewable energy ops", news: "Launched Stripe Tax in 12 new markets" },
                    { co: "Vercel", d: "vercel.com", dm: "Guillermo Rauch, CEO", roles: "8 open roles", sust: "Carbon-neutral hosting", news: "Announced Next.js 16 at VConf" },
                    { co: "Linear", d: "linear.app", dm: "Karri Saarinen, CEO", roles: "3 engineering roles", sust: "Remote-first, low footprint", news: "Raised Series B at $400M valuation" },
                    { co: "Notion", d: "notion.so", dm: "Ivan Zhao, CEO", roles: "22 open roles", sust: "LEED-certified offices", news: "Launched Notion Mail & Calendar" },
                    { co: "Figma", d: "figma.com", dm: "Dylan Field, CEO", roles: "18 open roles", sust: "Green energy data centers", news: "Figma Slides GA release" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.03] transition hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-white">{r.co}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{r.d}</td>
                      <td className="border-l border-indigo-500/30 bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.dm}</td>
                      <td className="bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.roles}</td>
                      <td className="bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.sust}</td>
                      <td className="bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.news}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-2.5">
              <span className="text-xs text-zinc-500">5 of 500 rows enriched</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-zinc-600">Your data</span>
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  AI enriched
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-t border-white/5 bg-zinc-900/50 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">How it works</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">Four steps. Under two minutes.</h2>
          </R>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Upload your spreadsheet", d: "CSV or Excel. Parsed 100% in your browser. Nothing touches any server.", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
              { n: "02", t: "Describe what you need", d: "Type in plain English. We auto-detect the new columns to add to your file.", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" },
              { n: "03", t: "Pick a model", d: "Choose Claude or Gemini. See the estimated API usage before you start.", icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" },
              { n: "04", t: "Add key, preview & run", d: "Test 3 rows free. Then run the full batch and download your enriched file.", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" },
            ].map((s, i) => (
              <R key={s.n} className={`delay-${(i + 1) * 100}`}>
                <div className="group rounded-2xl border border-white/5 bg-zinc-900 p-6 transition hover:border-indigo-500/20 hover:bg-zinc-900/80">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-indigo-400 transition group-hover:bg-indigo-500/10">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                  </div>
                  <span className="text-xs font-bold text-indigo-400/60">{s.n}</span>
                  <h3 className="mt-1 text-base font-semibold text-white">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{s.d}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ESTIMATE CALCULATOR */}
      <section id="calculator" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">100% free platform</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">We charge nothing.<br />See your API estimate.</h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              FreeClay is 100% free. The only thing you pay is the AI provider&apos;s token usage — at their published rates, with zero markup from us.
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
      <section id="compare" className="border-t border-white/5 bg-zinc-900/50 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Why FreeClay</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              Same enrichment. <span className="gradient-text">100% free.</span>
            </h2>
          </R>

          <R className="delay-200">
            <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
              <div className="grid grid-cols-3 border-b border-white/5 text-sm">
                <div className="px-6 py-4" />
                <div className="border-l border-white/5 px-6 py-4 text-zinc-500">Clay</div>
                <div className="border-l border-indigo-500/30 bg-indigo-500/5 px-6 py-4 font-semibold text-indigo-300">FreeClay</div>
              </div>
              {[
                ["Platform fee", "$149 \u2013 $800/mo", "$0 forever"],
                ["500 rows enriched", "Eats your credits", "~$2 \u2013 $10 in API usage"],
                ["Your data", "On their servers", "Never leaves your browser"],
                ["AI providers", "Their selection", "Claude or Gemini"],
                ["Source code", "Proprietary", "Fully open source"],
                ["Account required", "Yes + credit card", "No"],
              ].map(([feat, clay, free], i) => (
                <div key={i} className="grid grid-cols-3 border-b border-white/[0.03] text-sm last:border-0">
                  <div className="px-6 py-3.5 font-medium text-zinc-300">{feat}</div>
                  <div className="border-l border-white/5 px-6 py-3.5 text-zinc-500">{clay}</div>
                  <div className="border-l border-indigo-500/30 bg-indigo-500/[0.03] px-6 py-3.5 font-medium text-indigo-300">{free}</div>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* BYOK — trimmed */}
      <section id="byok" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Bring Your Own Key</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">Your key. Your usage.<br />We see nothing.</h2>
          </R>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { title: "No middleman", desc: "Your API key goes directly to the AI provider. We never see, store, or log it.", label: "Direct" },
              { title: "No markup", desc: "You pay the provider's published rate. We add $0. Ever.", label: "$0 fee" },
              { title: "Preview first", desc: "Test on 3 rows before running the full batch. No surprises.", label: "Safe" },
            ].map((f, i) => (
              <R key={f.title} className={`delay-${(i + 1) * 100}`}>
                <div className="rounded-2xl border border-white/5 bg-zinc-900 p-6">
                  <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">{f.label}</span>
                  <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.desc}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST / PRIVACY */}
      <section className="border-t border-white/5 bg-zinc-900/50 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Trust architecture</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">We literally can&apos;t see your data.</h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              No database. No cookies. No localStorage. Everything stays in your browser. Close the tab and it&apos;s all gone.
            </p>
          </R>

          <R className="delay-200">
            <div className="mt-14 flex flex-col items-center gap-0 sm:flex-row sm:justify-center sm:gap-0">
              <div className="animate-float rounded-xl border border-white/10 bg-zinc-900 px-8 py-5 text-center">
                <div className="text-3xl">{"\u{1F4BB}"}</div>
                <div className="mt-2 text-sm font-semibold text-white">Your Browser</div>
                <div className="text-xs text-zinc-500">Parsing + API key</div>
              </div>
              <div className="flex flex-col items-center py-2 sm:flex-row sm:py-0 sm:px-2">
                <div className="h-8 w-px bg-gradient-to-b from-indigo-500/50 to-indigo-500/20 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
                <span className="py-1 text-[11px] text-indigo-400 sm:px-3">direct API call</span>
                <div className="h-8 w-px bg-gradient-to-b from-indigo-500/20 to-indigo-500/50 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
              </div>
              <div className="animate-float delay-300 rounded-xl border border-white/10 bg-zinc-900 px-8 py-5 text-center">
                <div className="text-3xl">{"\u{1F916}"}</div>
                <div className="mt-2 text-sm font-semibold text-white">Claude / Gemini</div>
                <div className="text-xs text-zinc-500">AI + Web search</div>
              </div>
              <div className="flex flex-col items-center py-2 sm:flex-row sm:py-0 sm:px-2">
                <div className="h-8 w-px bg-gradient-to-b from-emerald-500/50 to-emerald-500/20 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
                <span className="py-1 text-[11px] text-emerald-400 sm:px-3">results</span>
                <div className="h-8 w-px bg-gradient-to-b from-emerald-500/20 to-emerald-500/50 sm:h-px sm:w-20 sm:bg-gradient-to-r" />
              </div>
              <div className="animate-float delay-600 rounded-xl border border-white/10 bg-zinc-900 px-8 py-5 text-center">
                <div className="text-3xl">{"\u{1F4BE}"}</div>
                <div className="mt-2 text-sm font-semibold text-white">Download</div>
                <div className="text-xs text-zinc-500">Enriched file</div>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-zinc-600">Our server is a CORS proxy only. Zero logging. Zero storage. Verify it yourself — we&apos;re open source.</p>
          </R>
        </div>
      </section>

      {/* WORKS FOR ANYTHING */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Universal</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">Works for any dataset.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400">
              Describe what you need in plain English. No rigid templates.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {["Companies", "Universities", "People", "Countries", "Products", "Research", "Startups", "Restaurants", "Real Estate", "Anything"].map((t) => (
                <span key={t} className="rounded-full border border-white/5 bg-zinc-900 px-4 py-2 text-sm text-zinc-400">{t}</span>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/5 bg-zinc-900/50 px-6 py-28 sm:py-36">
        <div className="pointer-events-none absolute inset-0" style={{backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "64px 64px"}} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/8 blur-[100px]" />

        <div className="relative mx-auto max-w-2xl text-center">
          <R>
            <h2 className="text-4xl font-extrabold sm:text-6xl">
              Your data. Your key.<br /><span className="gradient-text">100% free.</span>
            </h2>
            <p className="mt-6 text-lg text-zinc-400">
              No account. No credit card. No catch. Start enriching now.
            </p>
            <Link href="/tool" className="animate-pulse-glow mt-10 inline-flex items-center gap-2.5 rounded-xl bg-white px-10 py-4 text-base font-bold text-[#09090b] shadow-xl transition hover:bg-zinc-100">
              Open FreeClay
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </R>
        </div>
      </section>

      {/* CREATED BY */}
      <section id="about" className="border-t border-white/5 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Created by</p>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">Raghav</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
              Built FreeClay because data enrichment shouldn&apos;t cost $800/month. If you find it useful, connect with me.
            </p>
            <a
              href="https://www.linkedin.com/in/-raghav/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/10"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Connect on LinkedIn
            </a>
          </R>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-zinc-600 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] font-black text-[#09090b]">F</div>
              <span>FreeClay — 100% free, open-source data enrichment.</span>
            </div>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 transition hover:text-white">Source on GitHub</a>
          </div>
          <p className="mt-4 text-center text-[10px] leading-relaxed text-zinc-700">
            Disclaimer: FreeClay is provided as-is without warranty. AI-generated data may be inaccurate — always verify results. We are not responsible for the accuracy, completeness, or consequences of any enrichment output. Use at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
