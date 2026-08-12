import Link from "next/link";
import type { Metadata } from "next";
import { getAlternative } from "@/lib/alternatives";
import { ALL_MODELS, getModel, PRICING_LAST_UPDATED } from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { formatUSD } from "@/lib/runStats";
import { pageMetadata, articleJsonLd } from "@/lib/seo";
import { ContentPage, H2, H3, P, UL, LI, CTA } from "@/app/components/ContentPage";

const PAGE = getAlternative("clay-pricing")!;

export const metadata: Metadata = pageMetadata({
  title: PAGE.title,
  description: PAGE.description,
  path: "/alternatives/clay-pricing",
  keywords: PAGE.keywords,
  type: "article",
});

/** Volumes people actually run, so the arithmetic is checkable. */
const VOLUMES = [1_000, 5_000, 25_000];

export default function ClayPricingPage() {
  const cheapest = [...ALL_MODELS].sort(
    (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
  )[0];
  const mid = getModel("gemini-3-flash-preview") ?? cheapest;
  const strong = getModel("claude-sonnet-5") ?? cheapest;

  const rows = VOLUMES.map((v) => ({
    volume: v,
    cheap: (costPerThousandRows(cheapest.id) / 1000) * v,
    mid: (costPerThousandRows(mid.id) / 1000) * v,
    strong: (costPerThousandRows(strong.id) / 1000) * v,
  }));

  return (
    <ContentPage
      title={PAGE.h1}
      lede={PAGE.lede}
      updated={PRICING_LAST_UPDATED}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Alternatives", path: "/alternatives" },
        { name: "Clay pricing", path: "/alternatives/clay-pricing" },
      ]}
      jsonLd={[
        articleJsonLd({
          title: PAGE.title,
          description: PAGE.description,
          path: "/alternatives/clay-pricing",
          updated: "2026-08-11",
        }),
      ]}
    >
      <H2>Two different billing models</H2>
      <P>
        Clay charges a monthly platform fee, published from around $149 up to roughly $800 depending
        on tier, and research consumes credits from an allowance inside that plan. The cost of a row
        is therefore set by the platform, and running more rows eventually means moving up a tier.
      </P>
      <P>
        OpenClay charges nothing. You supply an API key and the model provider bills you at their
        published rate. The cost of a row is whatever the tokens and the web search actually cost,
        which does not change with volume and has no floor to clear before the first row.
      </P>
      <p className="mt-3 font-mono text-[10px] text-ink-3">
        Clay figures are from their public pricing page and are subject to change. Check their
        current plans before making a decision.
      </p>

      <H2>What OpenClay costs at real volumes</H2>
      <P>
        Every figure below is generated from the live model catalog, and includes tokens, web-search
        fees and any free search allowance, for a four-column research job.
      </P>

      <div className="thin-scroll mt-4 overflow-x-auto rounded border border-line">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-surface-2">
            <tr>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Rows</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">
                {cheapest.name}
              </th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">
                {mid.name}
              </th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">
                {strong.name}
              </th>
              <th className="border-b border-l border-accent-line bg-accent-soft px-3 py-2 text-right font-semibold text-accent">
                Platform fee
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.volume} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-medium text-ink tnum">{r.volume.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-ink-2 tnum">{formatUSD(r.cheap)}</td>
                <td className="px-3 py-2 text-right font-mono text-ink-2 tnum">{formatUSD(r.mid)}</td>
                <td className="px-3 py-2 text-right font-mono text-ink-2 tnum">{formatUSD(r.strong)}</td>
                <td className="border-l border-accent-line bg-accent-soft/40 px-3 py-2 text-right font-mono font-semibold text-data tnum">
                  $0.00
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H3>Reading the table</H3>
      <UL>
        <LI>
          The cheapest column is a genuinely capable model, not a toy. Most research rows do not need
          a flagship, and the five-row test tells you before you commit.
        </LI>
        <LI>
          Gemini includes a monthly allowance of free grounded searches, which is why its totals stay
          low at moderate volume.
        </LI>
        <LI>
          Nothing here is a subscription. Enrich a hundred rows one month and nothing the next, and
          you pay for a hundred rows.
        </LI>
      </UL>

      <H2>When a subscription still makes sense</H2>
      <P>
        If you are using the parts of Clay that OpenClay does not cover, the platform fee is buying
        you something real: licensed contact data, waterfall fallbacks across providers, CRM sync and
        a support contract. Those have genuine costs behind them.
      </P>
      <P>
        The question worth asking is which half of the product your usage actually sits in. If most
        of your Clay activity is research columns rather than contact lookups, that is the half you
        can run yourself at cost. See{" "}
        <Link
          href="/alternatives/claygent"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          the Claygent comparison
        </Link>{" "}
        for the direct swap, or{" "}
        <Link
          href="/alternatives/clay"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          the full feature comparison
        </Link>{" "}
        to see where the line falls.
      </P>

      <H3>How to check your own numbers</H3>
      <UL>
        <LI>Export a representative sample of your table as CSV.</LI>
        <LI>Load it into OpenClay and describe the columns you currently generate in Clay.</LI>
        <LI>Run the five-row test. It reports an exact cost per row for your actual prompt.</LI>
        <LI>Multiply by your monthly volume and compare against what you pay today.</LI>
      </UL>
      <P>
        The estimate is measured from real token usage on your own data rather than a generic
        average, so the figure you get is the figure you will be billed. Full rates for every model
        are on the{" "}
        <Link
          href="/models"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          pricing page
        </Link>
        .
      </P>

      <CTA label="Price your own workload" />
    </ContentPage>
  );
}
