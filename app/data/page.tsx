import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Practices",
  description:
    "How OpenClay handles your data: files parsed in-browser, API keys in memory only, no database, no cookies. A transparent look at our privacy-first architecture.",
  alternates: { canonical: "https://openclay.io/data" },
};

export default function DataPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon.svg" alt="OpenClay" className="h-8 w-8 rounded-lg" />
            <span className="text-base font-bold tracking-tight">OpenClay</span>
          </Link>
          <Link href="/tool" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">Open App</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold">Data Practices</h1>
        <p className="mt-2 text-sm text-zinc-500">A transparent look at how your data flows through OpenClay.</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-zinc-600">
          <section>
            <h2 className="text-lg font-semibold text-zinc-900">How data flows</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">1. You upload a file</h3>
                <p className="mt-1 text-sm">
                  Your CSV or Excel file is parsed <strong>entirely in your browser</strong> using JavaScript libraries
                  (PapaParse and SheetJS). The file is never uploaded to any server. It stays in browser memory.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">2. You enter your API key</h3>
                <p className="mt-1 text-sm">
                  Your key is held in React <code className="rounded bg-zinc-100 px-1 text-xs">useState()</code> — browser memory only.
                  It is never saved to localStorage, cookies, IndexedDB, or any persistent storage. Close the tab and it&apos;s gone.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">3. Enrichment runs</h3>
                <p className="mt-1 text-sm">
                  For each row, your browser sends a request through our API route (a thin CORS proxy) to either
                  Anthropic or Google. Our server forwards the request without reading or logging the body. The AI
                  provider processes the request and returns results directly.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                <h3 className="text-sm font-semibold text-zinc-900">4. You download results</h3>
                <p className="mt-1 text-sm">
                  Results are assembled in your browser and exported as a CSV or Excel file. The enriched data
                  is generated client-side and never stored on our servers.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">What we store</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="px-5 py-3 text-left font-medium text-zinc-700">Data Type</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-700">Stored?</th>
                    <th className="px-5 py-3 text-left font-medium text-zinc-700">Where it lives</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600">
                  {[
                    ["Your files", "No", "Browser memory only"],
                    ["API key", "No", "React useState() only"],
                    ["Enrichment results", "No", "Browser memory only"],
                    ["Personal info", "No", "Never collected"],
                    ["Usage analytics", "Vercel Analytics", "Anonymous page views only — no personal data"],
                    ["Cookies", "No", "Vercel Analytics is cookie-free"],
                    ["IP address", "Vercel logs", "Standard hosting logs only"],
                  ].map(([type, stored, where], i) => (
                    <tr key={i} className="border-b border-zinc-50 last:border-0">
                      <td className="px-5 py-2.5 font-medium text-zinc-900">{type}</td>
                      <td className="px-5 py-2.5">
                        {stored === "No" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                            Not stored
                          </span>
                        ) : (
                          <span className="text-amber-600">{stored}</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-zinc-500">{where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Third-party data sharing</h2>
            <p className="mt-2">
              The only third party that receives your data is the AI provider you choose to connect:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li><strong className="text-zinc-900">Anthropic</strong> — receives row data as part of Claude API prompts</li>
              <li><strong className="text-zinc-900">Google</strong> — receives row data as part of Gemini API prompts</li>
            </ul>
            <p className="mt-3">
              Both providers have their own data retention and usage policies. By default, data sent via API is
              typically not used for model training. Consult your provider&apos;s terms for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-900">Verify it yourself</h2>
            <p className="mt-2">
              OpenClay is fully open source. Every claim on this page can be verified by reading the source code.
              We believe transparency is the strongest form of trust.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-100 px-6 py-6 text-center text-xs text-zinc-400">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-6">
          <Link href="/privacy" className="hover:text-zinc-900">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-900">Terms</Link>
          <Link href="/data" className="text-zinc-900 font-medium">Data Practices</Link>
        </div>
      </footer>
    </div>
  );
}
