"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">

      {/* ━━━ NAV ━━━ */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-[#09090b]">F</div>
            <span className="text-base font-bold tracking-tight">FreeClay</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#how" className="hidden text-sm text-zinc-400 transition hover:text-white sm:block">How It Works</a>
            <a href="#compare" className="hidden text-sm text-zinc-400 transition hover:text-white sm:block">vs Clay</a>
            <a href="#byok" className="hidden text-sm text-zinc-400 transition hover:text-white sm:block">BYOK</a>
            <Link href="/tool" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#09090b] transition hover:bg-zinc-200">
              Open App
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden px-6 pt-36 pb-24 sm:pt-44 sm:pb-32">
        {/* Grid bg */}
        <div className="pointer-events-none absolute inset-0" style={{backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "64px 64px"}} />
        {/* Glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            100% free. 100% open source. Zero catch.
          </div>

          <h1 className="animate-fade-in-up delay-100 text-[2.75rem] font-extrabold leading-[1.08] tracking-tight sm:text-7xl lg:text-8xl">
            Stop paying $800/mo<br />
            <span className="gradient-text">to enrich a spreadsheet.</span>
          </h1>

          <p className="animate-fade-in-up delay-200 mx-auto mt-7 max-w-xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            FreeClay does exactly what Clay does — but you bring your own API key and pay <span className="text-white font-medium">only for the tokens you use</span>. No subscription. No platform fee. No middleman.
          </p>

          <div className="animate-fade-in-up delay-300 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/tool" className="animate-pulse-glow inline-flex items-center gap-2.5 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#09090b] shadow-xl transition hover:bg-zinc-100">
              Start Enriching — Free Forever
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-zinc-300 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10">
              See How It Works
            </a>
          </div>

          <div className="animate-fade-in delay-500 mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
            {["No sign-up required", "No data ever stored", "No tracking whatsoever"].map((t) => (
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
                    <th className="border-l border-indigo-500/30 bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Description</th>
                    <th className="bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Industry</th>
                    <th className="bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Employees</th>
                    <th className="bg-indigo-500/5 px-4 py-3 font-medium text-indigo-300">Funding</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300">
                  {[
                    { co: "Stripe", d: "stripe.com", desc: "Financial infrastructure for the internet", ind: "Fintech", emp: "~8,000", f: "$8.7B" },
                    { co: "Vercel", d: "vercel.com", desc: "Cloud platform for frontend frameworks", ind: "DevTools", emp: "~500", f: "$563M" },
                    { co: "Linear", d: "linear.app", desc: "Streamlined issue tracking for teams", ind: "SaaS", emp: "~80", f: "$52M" },
                    { co: "Notion", d: "notion.so", desc: "All-in-one workspace for teams", ind: "Productivity", emp: "~800", f: "$343M" },
                    { co: "Figma", d: "figma.com", desc: "Collaborative interface design tool", ind: "Design", emp: "~1,200", f: "$333M" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.03] transition hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-white">{r.co}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{r.d}</td>
                      <td className="border-l border-indigo-500/30 bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.desc}</td>
                      <td className="bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.ind}</td>
                      <td className="bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.emp}</td>
                      <td className="bg-indigo-500/5 px-4 py-2.5 text-indigo-200">{r.f}</td>
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

      {/* ━━━ SOCIAL PROOF NUMBERS ━━━ */}
      <section className="border-y border-white/5 bg-zinc-900/50 px-6 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
          <R>
            <div className="text-4xl font-extrabold text-white sm:text-5xl">$0</div>
            <div className="mt-2 text-sm text-zinc-400">Platform fee. Forever.</div>
          </R>
          <R className="delay-100">
            <div className="text-4xl font-extrabold sm:text-5xl"><span className="gradient-text-green">~$5</span></div>
            <div className="mt-2 text-sm text-zinc-400">To enrich 500 rows with Claude</div>
          </R>
          <R className="delay-200">
            <div className="text-4xl font-extrabold text-white sm:text-5xl">0 bytes</div>
            <div className="mt-2 text-sm text-zinc-400">Of your data stored. Ever.</div>
          </R>
        </div>
      </section>

      {/* ━━━ THE PROBLEM ━━━ */}
      <section id="compare" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">The problem</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
              Clay charges <span className="text-red-400">$149&ndash;$800/mo</span><br />for something AI APIs do for pennies.
            </h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              Data enrichment isn&apos;t magic. It&apos;s an API call with a good prompt. Clay wraps that in a subscription and marks it up 100x. We cut out the middleman entirely.
            </p>
          </R>

          {/* Comparison */}
          <R className="delay-200">
            <div className="mt-14 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
              <div className="grid grid-cols-3 border-b border-white/5 text-sm">
                <div className="px-6 py-4" />
                <div className="border-l border-white/5 px-6 py-4 text-zinc-500">Clay</div>
                <div className="border-l border-indigo-500/30 bg-indigo-500/5 px-6 py-4 font-semibold text-indigo-300">FreeClay</div>
              </div>
              {[
                ["Platform cost", "$149 \u2013 $800/mo", "$0 forever"],
                ["500 rows enriched", "Eats your credits", "~$2 \u2013 $10 in API costs"],
                ["Your data", "On their servers", "Never leaves your browser"],
                ["Your API key", "Their infrastructure", "Your browser memory only"],
                ["Source code", "Proprietary", "Fully open source"],
                ["Analytics & tracking", "Yes", "None"],
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

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section id="how" className="border-t border-white/5 bg-zinc-900/50 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">How it works</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">Four steps. Under two minutes.</h2>
          </R>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Paste your API key", d: "Claude or Gemini. Stays in browser memory. Never stored, never logged.", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" },
              { n: "02", t: "Upload your spreadsheet", d: "CSV or Excel. Parsed 100% client-side. Nothing touches any server.", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
              { n: "03", t: "Pick what you need", d: "Choose a template or create custom fields. See the cost before you spend.", icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" },
              { n: "04", t: "Run & download", d: "Test 5 rows first. Then batch process everything. Download your enriched file.", icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" },
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

      {/* ━━━ BYOK ━━━ */}
      <section id="byok" className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Bring Your Own Key</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">You own the connection.<br />You see every cent.</h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              Use your own Claude or Gemini API key. Every enrichment shows you the exact token count and cost before you run it. No hidden fees, no opaque credit systems.
            </p>
          </R>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {[
              { title: "Know the cost upfront", desc: "Real-time cost calculator with per-row breakdown. See what 500 rows will cost before you process a single one.", label: "Transparent" },
              { title: "Pay only for tokens", desc: "No markup. You pay Anthropic or Google directly at their published rates. We add literally $0.", label: "Direct" },
              { title: "Test before you commit", desc: "Always test on 5 rows first. Validate quality. See actual cost. Then decide if you want to run the full batch.", label: "Safe" },
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

          {/* Cost example */}
          <R className="delay-400">
            <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
              <div className="border-b border-white/5 px-6 py-4">
                <span className="text-sm font-medium text-zinc-400">Example: 500 companies with Claude Sonnet 4.5</span>
              </div>
              <div className="grid gap-px bg-white/[0.03] sm:grid-cols-4">
                {[
                  { label: "Input tokens", val: "$1.50" },
                  { label: "Output tokens", val: "$1.88" },
                  { label: "Web searches", val: "$5.00" },
                  { label: "Total", val: "$8.38", highlight: true },
                ].map((c) => (
                  <div key={c.label} className={`bg-zinc-900 px-6 py-5 ${c.highlight ? "bg-indigo-500/5" : ""}`}>
                    <div className="text-xs text-zinc-500">{c.label}</div>
                    <div className={`mt-1 text-2xl font-bold ${c.highlight ? "text-indigo-300" : "text-white"}`}>{c.val}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 px-6 py-3 text-xs text-zinc-600">
                That&apos;s roughly $0.017 per company. Clay would charge you $149/mo just to start.
              </div>
            </div>
          </R>
        </div>
      </section>

      {/* ━━━ TRUST / PRIVACY ━━━ */}
      <section className="border-t border-white/5 bg-zinc-900/50 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Trust architecture</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">We literally can&apos;t see your data.</h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              No database. No cookies. No localStorage. Your file is parsed in the browser. Your API key lives in React state. When you close the tab, everything is gone.
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

      {/* ━━━ WORKS FOR EVERYTHING ━━━ */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <R>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Universal enrichment</p>
            <h2 className="mt-4 text-3xl font-bold sm:text-5xl">Not just for sales teams.</h2>
            <p className="mt-5 max-w-2xl text-lg text-zinc-400">
              Built-in templates for any dataset type. Or create your own custom fields.
            </p>
          </R>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "\u{1F3E2}", t: "Companies", d: "Description, industry, funding, employees, tech stack, competitors" },
              { icon: "\u{1F393}", t: "Universities", d: "Rankings, programs, acceptance rate, tuition, research output" },
              { icon: "\u{1F464}", t: "People", d: "Current role, company, education, achievements, expertise" },
              { icon: "\u{1F30D}", t: "Countries", d: "GDP, population, government, industries, trading partners" },
              { icon: "\u{1F52C}", t: "Research", d: "Key findings, citations, methodology, impact factor, authors" },
              { icon: "\u{1F4E6}", t: "Custom", d: "Define your own fields. Any data type. Any enrichment." },
            ].map((c, i) => (
              <R key={c.t} className={`delay-${(i % 3 + 1) * 100}`}>
                <div className="rounded-xl border border-white/5 bg-zinc-900 p-5 transition hover:border-white/10">
                  <span className="text-2xl">{c.icon}</span>
                  <h3 className="mt-3 text-sm font-semibold text-white">{c.t}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{c.d}</p>
                </div>
              </R>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="relative overflow-hidden border-t border-white/5 px-6 py-28 sm:py-36">
        <div className="pointer-events-none absolute inset-0" style={{backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "64px 64px"}} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/8 blur-[100px]" />

        <div className="relative mx-auto max-w-2xl text-center">
          <R>
            <h2 className="text-4xl font-extrabold sm:text-6xl">
              Your data. Your key.<br /><span className="gradient-text">Your enrichment.</span>
            </h2>
            <p className="mt-6 text-lg text-zinc-400">
              No account. No credit card. No catch. Just paste your key and go.
            </p>
            <Link href="/tool" className="animate-pulse-glow mt-10 inline-flex items-center gap-2.5 rounded-xl bg-white px-10 py-4 text-base font-bold text-[#09090b] shadow-xl transition hover:bg-zinc-100">
              Open FreeClay
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </R>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-zinc-600 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] font-black text-[#09090b]">F</div>
            <span>FreeClay — Open source data enrichment. No accounts. No tracking. No storage.</span>
          </div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 transition hover:text-white">Source on GitHub</a>
        </div>
      </footer>
    </div>
  );
}
