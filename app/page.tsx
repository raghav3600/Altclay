"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

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
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

const STEPS = [
  { num: "01", title: "Paste Your API Key", desc: "Bring your Anthropic or Google Gemini key. It never leaves your browser.",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg> },
  { num: "02", title: "Upload Your Spreadsheet", desc: "Drop in any Excel or CSV file. Parsed entirely in your browser.",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg> },
  { num: "03", title: "Pick What You Need", desc: "Choose from preset templates or define custom enrichment fields.",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { num: "04", title: "Run & Download", desc: "Test on 5 rows, then enrich everything. Download your enriched file.",
    icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg> },
];

const FEATURES = [
  { title: "100% Private", desc: "No databases, no cookies, no tracking. Your API key lives only in browser memory.",
    icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> },
  { title: "Universal Templates", desc: "Companies, universities, people, countries, products, research — or define your own.",
    icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
  { title: "Cost Transparency", desc: "See exactly what you'll pay before spending a cent. Real-time estimates with current pricing.",
    icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> },
  { title: "AI Web Search", desc: "Claude and Gemini search the web in real-time to find accurate, up-to-date data for every row.",
    icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg> },
  { title: "Open Source", desc: "Every line of code is public. Verify the privacy claims yourself. No hidden anything.",
    icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg> },
  { title: "Batch Processing", desc: "Process hundreds of rows with concurrency, pause/resume, and automatic retry logic.",
    icon: <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg> },
];

const COMPARISONS = [
  { feature: "Monthly cost", clay: "$149 - $800/mo", free: "$0 platform fee" },
  { feature: "500 row enrichment", clay: "Uses your credits", free: "~$2 - $10 API cost" },
  { feature: "Data privacy", clay: "Stored on their servers", free: "Never leaves your browser" },
  { feature: "Source code", clay: "Proprietary", free: "100% open source" },
  { feature: "API key storage", clay: "Their infrastructure", free: "Browser memory only" },
  { feature: "Tracking / Analytics", clay: "Yes", free: "None. Zero. Nada." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">F</div>
            <span className="text-lg font-bold text-gray-900">FreeClay</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden text-sm text-gray-600 transition hover:text-gray-900 sm:block">How It Works</a>
            <a href="#features" className="hidden text-sm text-gray-600 transition hover:text-gray-900 sm:block">Features</a>
            <a href="#pricing" className="hidden text-sm text-gray-600 transition hover:text-gray-900 sm:block">Pricing</a>
            <Link href="/tool" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">Open App</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-100 opacity-40 blur-3xl" />
          <div className="absolute top-20 -left-40 h-60 w-60 rounded-full bg-purple-100 opacity-40 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-40 w-[600px] -translate-x-1/2 rounded-full bg-indigo-50 opacity-60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              100% Free &amp; Open Source
            </div>
          </div>

          <h1 className="animate-fade-in-up delay-100 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-7xl">
            Enrich any spreadsheet<br />
            <span className="gradient-text">with AI</span>
          </h1>

          <p className="animate-fade-in-up delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 sm:text-xl">
            The free alternative to Clay. Upload your data, pick what you need, and let Claude or Gemini do the research. You bring the API key — we bring the tool.
          </p>

          <div className="animate-fade-in-up delay-300 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/tool" className="animate-pulse-glow inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500">
              Start Enriching — It&apos;s Free
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50">
              See How It Works
            </a>
          </div>

          <div className="animate-fade-in delay-500 mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
            {["No account needed", "No data stored", "No tracking"].map((t) => (
              <span key={t} className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Spreadsheet preview */}
        <div className="animate-fade-in-up delay-700 mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50">
            <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs text-gray-400">companies.xlsx — FreeClay</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Company</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Website</th>
                    <th className="border-l-2 border-indigo-200 bg-indigo-50/50 px-4 py-2.5 text-left font-semibold text-indigo-600">Description</th>
                    <th className="bg-indigo-50/50 px-4 py-2.5 text-left font-semibold text-indigo-600">Industry</th>
                    <th className="bg-indigo-50/50 px-4 py-2.5 text-left font-semibold text-indigo-600">Employees</th>
                    <th className="bg-indigo-50/50 px-4 py-2.5 text-left font-semibold text-indigo-600">Funding</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { co: "Stripe", url: "stripe.com", desc: "Financial infrastructure platform for...", ind: "Fintech", emp: "~8,000", fund: "$8.7B" },
                    { co: "Vercel", url: "vercel.com", desc: "Cloud platform for frontend developers...", ind: "DevTools", emp: "~500", fund: "$563M" },
                    { co: "Linear", url: "linear.app", desc: "Modern project management tool for...", ind: "SaaS / Productivity", emp: "~80", fund: "$52M" },
                    { co: "Notion", url: "notion.so", desc: "All-in-one workspace for notes, docs...", ind: "SaaS / Productivity", emp: "~800", fund: "$343M" },
                  ].map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{r.co}</td>
                      <td className="px-4 py-2.5 text-gray-500">{r.url}</td>
                      <td className="border-l-2 border-indigo-200 bg-indigo-50/30 px-4 py-2.5 text-indigo-900">{r.desc}</td>
                      <td className="bg-indigo-50/30 px-4 py-2.5 text-indigo-900">{r.ind}</td>
                      <td className="bg-indigo-50/30 px-4 py-2.5 text-indigo-900">{r.emp}</td>
                      <td className="bg-indigo-50/30 px-4 py-2.5 text-indigo-900">{r.fund}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2">
              <span className="text-xs text-gray-400">4 of 500 rows enriched</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI enriched columns
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-gray-100 bg-gray-50/50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Four steps. That&apos;s it.</h2>
              <p className="mx-auto mt-3 max-w-lg text-gray-500">No complex setup. No learning curve. Upload, configure, enrich, download.</p>
            </div>
          </RevealSection>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <RevealSection key={step.num} className={`delay-${(i + 1) * 100}`}>
                <div className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">{step.icon}</div>
                  <span className="text-xs font-bold text-indigo-400">{step.num}</span>
                  <h3 className="mt-1 text-base font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Data flow */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RevealSection>
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-8 text-center sm:p-12">
              <h2 className="text-2xl font-bold text-gray-900">How Your Data Flows</h2>
              <p className="mt-2 text-sm text-gray-500">We literally cannot see your data. Here&apos;s why:</p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-0">
                <div className="animate-float rounded-xl border border-indigo-200 bg-white px-6 py-4 shadow-sm">
                  <div className="text-2xl">{"\u{1F4BB}"}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">Your Browser</div>
                  <div className="text-xs text-gray-400">File parsing + state</div>
                </div>
                <div className="flex flex-col items-center px-4 sm:flex-row">
                  <div className="h-8 w-px bg-gradient-to-b from-indigo-300 to-indigo-400 sm:h-px sm:w-16 sm:bg-gradient-to-r" />
                  <span className="my-1 text-xs text-indigo-400 sm:mx-2">encrypted</span>
                  <div className="h-8 w-px bg-gradient-to-b from-indigo-400 to-indigo-300 sm:h-px sm:w-16 sm:bg-gradient-to-r" />
                </div>
                <div className="animate-float delay-200 rounded-xl border border-purple-200 bg-white px-6 py-4 shadow-sm">
                  <div className="text-2xl">{"\u{1F916}"}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">AI Provider</div>
                  <div className="text-xs text-gray-400">Claude or Gemini API</div>
                </div>
                <div className="flex flex-col items-center px-4 sm:flex-row">
                  <div className="h-8 w-px bg-gradient-to-b from-purple-300 to-purple-400 sm:h-px sm:w-16 sm:bg-gradient-to-r" />
                  <span className="my-1 text-xs text-purple-400 sm:mx-2">results</span>
                  <div className="h-8 w-px bg-gradient-to-b from-purple-400 to-purple-300 sm:h-px sm:w-16 sm:bg-gradient-to-r" />
                </div>
                <div className="animate-float delay-400 rounded-xl border border-emerald-200 bg-white px-6 py-4 shadow-sm">
                  <div className="text-2xl">{"\u{1F4BB}"}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">Your Browser</div>
                  <div className="text-xs text-gray-400">Enriched download</div>
                </div>
              </div>
              <p className="mt-8 text-xs text-gray-400">Our server is a thin proxy for CORS only. It does not log, store, or inspect any data.</p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-gray-100 bg-gray-50/50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <RevealSection>
            <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Everything you need, nothing you don&apos;t</h2>
          </RevealSection>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <RevealSection key={f.title} className={`delay-${(i % 3 + 1) * 100}`}>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">{f.icon}</div>
                  <h3 className="mt-4 text-base font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing comparison */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <RevealSection>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Clay vs FreeClay</h2>
              <p className="mt-3 text-gray-500">Same enrichment power. Radically different cost.</p>
            </div>
          </RevealSection>
          <RevealSection className="delay-200">
            <div className="mt-12 overflow-hidden rounded-2xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3.5 text-left font-medium text-gray-500" />
                    <th className="px-6 py-3.5 text-left font-medium text-gray-500">Clay</th>
                    <th className="bg-indigo-50 px-6 py-3.5 text-left font-semibold text-indigo-700">FreeClay</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISONS.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-700">{row.feature}</td>
                      <td className="px-6 py-3 text-gray-500">{row.clay}</td>
                      <td className="bg-indigo-50/50 px-6 py-3 font-medium text-indigo-700">{row.free}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gradient-to-br from-indigo-600 to-purple-700 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <RevealSection>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to enrich your data?</h2>
            <p className="mt-4 text-lg text-indigo-200">No sign-up. No credit card. Just paste your API key and go.</p>
            <Link href="/tool" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 shadow-lg transition hover:bg-indigo-50">
              Open FreeClay
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs text-gray-400 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white">F</div>
            <span>FreeClay — 100% open source. No accounts. No tracking. No data storage.</span>
          </div>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 transition hover:text-indigo-600">View Source on GitHub</a>
        </div>
      </footer>
    </div>
  );
}
