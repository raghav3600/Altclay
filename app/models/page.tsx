import Link from "next/link";
import type { Metadata } from "next";
import { ALL_MODELS, MODELS_BY_PROVIDER, PROVIDER_META, CATALOG_PROVIDERS, PRICING_LAST_UPDATED } from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { formatUSD } from "@/lib/runStats";
import { pageMetadata, SITE_URL, jsonLdScript } from "@/lib/seo";
import { ContentPage, H2, P, CTA } from "@/app/components/ContentPage";
import { ProviderLogo } from "@/app/components/icons";

export const metadata: Metadata = pageMetadata({
  title: `AI model pricing compared: ${ALL_MODELS.length} models`,
  description: `Side-by-side API pricing for ${ALL_MODELS.length} models from OpenAI, Google, Anthropic and xAI, including web-search fees and real cost per 1,000 enriched rows. Verified ${PRICING_LAST_UPDATED}.`,
  path: "/models",
  keywords: [
    "AI model pricing comparison",
    "LLM API pricing",
    "cheapest AI model with web search",
    "GPT vs Gemini vs Claude pricing",
    "cost per 1000 rows AI",
    "web search API pricing",
  ],
});

/** A real comparison table is the kind of page that earns links. */
export default function ModelsIndex() {
  const rows = [...ALL_MODELS].sort(
    (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
  );

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AI models supported by OpenClay",
    numberOfItems: rows.length,
    itemListElement: rows.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: m.name,
        brand: { "@type": "Brand", name: PROVIDER_META[m.provider].company },
        url: `${SITE_URL}/models/${m.provider}`,
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          price: m.inputPer1M,
          description: `$${m.inputPer1M} per 1M input tokens, $${m.outputPer1M} per 1M output tokens`,
        },
      },
    })),
  };

  return (
    <ContentPage
      title="AI model pricing, compared honestly"
      lede={`Every model OpenClay supports, ranked by what 1,000 enriched rows actually cost, counting tokens plus web-search fees and any free allowance. Verified ${PRICING_LAST_UPDATED} against each provider's published rates.`}
      updated={PRICING_LAST_UPDATED}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Models", path: "/models" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(itemList) }}
      />

      <H2>Why per-1,000-rows and not per-token</H2>
      <P>
        Token prices alone are misleading for enrichment. A row is a short prompt of a few hundred
        tokens, but every row also triggers a web search, and providers bill that separately. On
        OpenAI the search fee and the ~8k tokens of search content it injects together dwarf the
        prompt. Gemini, meanwhile, includes 5,000 free grounded searches a month, which makes it far
        cheaper than its token price suggests for small runs.
      </P>
      <P>
        The figures below fold all of that in: tokens, search fees and free allowances, for a
        1,000-row job with a typical four-column output.
      </P>

      <div className="thin-scroll mt-5 overflow-x-auto rounded border border-line">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-surface-2">
            <tr>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Model</th>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Provider</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">In / Out per 1M</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">Search</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">Per 1k rows</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="font-medium text-ink">{m.name}</span>
                  <span className="ml-1.5 font-mono text-[10px] text-ink-3">{m.id}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Link
                    href={`/models/${m.provider}`}
                    className="inline-flex items-center gap-1.5 text-ink-2 hover:text-accent"
                  >
                    <ProviderLogo provider={m.provider} className="h-3 w-3" />
                    {PROVIDER_META[m.provider].company}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-ink-2 tnum">
                  ${m.inputPer1M} / ${m.outputPer1M}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-ink-2 tnum">
                  {m.search ? `$${m.search.per1K}/1k` : ""}
                  {m.search?.freeRequests ? (
                    <span className="ml-1 text-data">
                      ({m.search.freeRequests.toLocaleString()} free)
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold text-ink tnum">
                  {formatUSD(costPerThousandRows(m.id))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[10px] text-ink-3">
        Assumes a ~250-token prompt and four output fields per row, with web search enabled. xAI does
        not publish a per-search rate; theirs is our estimate.
      </p>

      <H2>By provider</H2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CATALOG_PROVIDERS.map((p) => {
          const meta = PROVIDER_META[p];
          const models = MODELS_BY_PROVIDER[p];
          const cheapest = [...models].sort(
            (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
          )[0];
          return (
            <Link
              key={p}
              href={`/models/${p}`}
              className="group rounded border border-line bg-surface p-4 transition-colors hover:border-accent"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink group-hover:text-accent">
                <ProviderLogo provider={p} className="h-4 w-4" />
                {meta.company} {meta.name}
              </h3>
              <p className="mt-1.5 font-mono text-[11px] text-ink-2 tnum">
                {models.length} models · from {formatUSD(costPerThousandRows(cheapest.id))}/1k rows
              </p>
            </Link>
          );
        })}
      </div>

      <CTA label="Compare them on your own data" />
    </ContentPage>
  );
}
