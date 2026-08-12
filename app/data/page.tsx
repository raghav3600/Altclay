import { SiteNav, SiteFooter, Breadcrumbs } from "@/app/components/ContentPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Practices",
  description:
    "How OpenClay handles your data: files parsed in-browser, API keys in memory only, no database, no cookies. A transparent look at our privacy-first architecture.",
  alternates: { canonical: "https://openclay.io/data" },
};

export default function DataPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Breadcrumbs crumbs={[{ name: "Home", path: "/" }, { name: "Data practices", path: "/data" }]} />
        <h1 className="text-3xl font-bold">Data Practices</h1>
        <p className="mt-2 text-sm text-ink-2">A transparent look at how your data flows through OpenClay.</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-ink-2">
          <section>
            <h2 className="text-lg font-semibold text-ink">How data flows</h2>
            <div className="mt-4 space-y-4">
              <div className="rounded border border-line bg-surface-2 p-5">
                <h3 className="text-sm font-semibold text-ink">1. You upload a file</h3>
                <p className="mt-1 text-sm">
                  Your CSV or Excel file is parsed <strong>entirely in your browser</strong> using JavaScript libraries
                  (PapaParse and SheetJS). The file is never uploaded to any server. It stays in browser memory.
                </p>
              </div>
              <div className="rounded border border-line bg-surface-2 p-5">
                <h3 className="text-sm font-semibold text-ink">2. You enter your API key</h3>
                <p className="mt-1 text-sm">
                  Your key is held in React <code className="rounded border border-line bg-surface-2 px-1 text-xs">useState()</code> — browser memory only.
                  It is never saved to localStorage, cookies, IndexedDB, or any persistent storage. Close the tab and it&apos;s gone.
                </p>
              </div>
              <div className="rounded border border-line bg-surface-2 p-5">
                <h3 className="text-sm font-semibold text-ink">3. Enrichment runs</h3>
                <p className="mt-1 text-sm">
                  For each row, your browser sends a request through our API route (a thin CORS proxy) to either
                  OpenAI, Google, Anthropic or xAI. Our server forwards the request without reading or logging the body. The AI
                  provider processes the request and returns results directly.
                </p>
              </div>
              <div className="rounded border border-line bg-surface-2 p-5">
                <h3 className="text-sm font-semibold text-ink">4. You download results</h3>
                <p className="mt-1 text-sm">
                  Results are assembled in your browser and exported as a CSV or Excel file. The enriched data
                  is generated client-side and never stored on our servers.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">What we store</h2>
            <div className="mt-4 overflow-hidden rounded border border-line">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th className="px-5 py-3 text-left font-medium text-ink">Data Type</th>
                    <th className="px-5 py-3 text-left font-medium text-ink">Stored?</th>
                    <th className="px-5 py-3 text-left font-medium text-ink">Where it lives</th>
                  </tr>
                </thead>
                <tbody className="text-ink-2">
                  {[
                    ["Your files", "No", "Browser memory only"],
                    ["API key", "No", "React useState() only"],
                    ["Enrichment results", "No", "Browser memory only"],
                    ["Personal info", "No", "Never collected"],
                    ["Usage analytics", "Vercel Analytics", "Anonymous page views only — no personal data"],
                    ["Cookies", "No", "Vercel Analytics is cookie-free"],
                    ["IP address", "Vercel logs", "Standard hosting logs only"],
                  ].map(([type, stored, where], i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5 font-medium text-ink">{type}</td>
                      <td className="px-5 py-2.5">
                        {stored === "No" ? (
                          <span className="inline-flex items-center gap-1 text-data">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                            Not stored
                          </span>
                        ) : (
                          <span className="text-amber-600">{stored}</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-ink-2">{where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Third-party data sharing</h2>
            <p className="mt-2">
              The only third party that receives your data is the AI provider you choose to connect:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li><strong className="text-ink">Anthropic</strong> — receives row data as part of Claude API prompts</li>
              <li><strong className="text-ink">Google</strong> — receives row data as part of Gemini API prompts</li>
            </ul>
            <p className="mt-3">
              Both providers have their own data retention and usage policies. By default, data sent via API is
              typically not used for model training. Consult your provider&apos;s terms for details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink">Verify it yourself</h2>
            <p className="mt-2">
              OpenClay is fully open source. Every claim on this page can be verified by reading the source code.
              We believe transparency is the strongest form of trust.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
