import Link from "next/link";
import type { Metadata } from "next";
import { ALL_MODELS, PROVIDER_ORDER, PRICING_LAST_UPDATED } from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { formatUSD } from "@/lib/runStats";
import { pageMetadata, articleJsonLd } from "@/lib/seo";
import { ContentPage, H2, H3, P, UL, LI, CTA } from "@/app/components/ContentPage";

export const metadata: Metadata = pageMetadata({
  title: "A free, open-source Clay alternative",
  description:
    "OpenClay does Clay's AI research layer (Claygent) with your own API key and no platform fee. An honest comparison: what it replaces, what it doesn't, and what 1,000 rows actually costs.",
  path: "/alternatives/clay",
  keywords: [
    "Clay alternative",
    "free Clay alternative",
    "open source Clay",
    "Clay.com alternative",
    "Claygent alternative",
    "cheaper than Clay",
    "Clay pricing alternative",
    "data enrichment without Clay",
  ],
  type: "article",
});

export default function ClayAlternativePage() {
  const cheapest = [...ALL_MODELS].sort(
    (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
  )[0];

  const comparison: [string, string, string][] = [
    ["Platform fee", "$149 – $800 per month", "$0"],
    ["AI research per row", "Consumes Clay credits", "Billed by the model provider directly"],
    ["1,000 researched rows", "Draws down your credit quota", `From ${formatUSD(costPerThousandRows(cheapest.id))} in API usage`],
    ["Model choice", "Whatever Claygent runs", `${ALL_MODELS.length} models across ${PROVIDER_ORDER.length} providers`],
    ["Verified emails & phones", "Yes — 150+ data providers", "No"],
    ["Waterfall enrichment", "Yes", "No"],
    ["CRM sync", "Yes", "No — export CSV or XLSX"],
    ["Where your data lives", "Their servers", "Your browser"],
    ["Rate-limit handling", "Managed for you", "Backoff, retry and tunable concurrency"],
    ["Source code", "Proprietary", "Open source"],
    ["Account required", "Yes, plus a card", "No"],
  ];

  return (
    <ContentPage
      title="A free, open-source alternative to Clay"
      lede="OpenClay replaces one specific part of Clay — the AI research layer — and does not pretend to replace the rest. Here is the honest split, so you can tell quickly whether it fits."
      updated={PRICING_LAST_UPDATED}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Alternatives", path: "/alternatives/clay" },
        { name: "Clay", path: "/alternatives/clay" },
      ]}
      jsonLd={[
        articleJsonLd({
          title: "A free, open-source Clay alternative",
          description:
            "An honest comparison of OpenClay and Clay: what the AI research layer replaces, what it doesn't, and real costs.",
          path: "/alternatives/clay",
          updated: "2026-08-11",
        }),
      ]}
    >
      <H2>The short version</H2>
      <P>
        Clay is two products in one. It is a <strong className="font-semibold text-ink">data
        aggregator</strong> — 150+ providers like Apollo, ZoomInfo and Clearbit, queried in a
        waterfall until one returns a verified email. And it is an{" "}
        <strong className="font-semibold text-ink">AI research agent</strong> — Claygent, which reads
        the open web and answers a question per row.
      </P>
      <P>
        OpenClay is the second thing only. If you are paying Clay mainly because Claygent researches
        your rows, you are paying a subscription for something your own API key can do for a fraction
        of a cent per row. If you are paying Clay for verified contact data, OpenClay cannot replace
        it and you should keep Clay.
      </P>

      <H2>Side by side</H2>
      <div className="thin-scroll mt-4 overflow-x-auto rounded border border-line">
        <table className="min-w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-surface-2">
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2" />
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-3">Clay</th>
              <th className="border-b border-l border-accent-line bg-accent-soft px-3 py-2 text-left font-semibold text-accent">
                OpenClay
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(([feature, clay, ours]) => (
              <tr key={feature} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-medium text-ink">{feature}</td>
                <td className="px-3 py-2 text-ink-3">{clay}</td>
                <td className="border-l border-accent-line bg-accent-soft/40 px-3 py-2 text-ink">
                  {ours}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[10px] text-ink-3">
        Clay pricing from their public pricing page and subject to change.
      </p>

      <H2>When OpenClay is the better tool</H2>
      <UL>
        <LI>You mostly used Claygent, and the credit burn is what pushed you to look elsewhere.</LI>
        <LI>Your research questions are custom and don&apos;t fit a data provider&apos;s schema.</LI>
        <LI>You already get raw lists out of Apollo or lemlist and only need the enrichment layer.</LI>
        <LI>Your data can&apos;t go to a third-party server for policy reasons.</LI>
        <LI>You want to see, and change, exactly what prompt runs against each row.</LI>
      </UL>

      <H2>When it isn&apos;t</H2>
      <UL>
        <LI>You need verified email addresses or phone numbers. That needs a real data provider.</LI>
        <LI>You need waterfall enrichment across multiple sources with fallbacks.</LI>
        <LI>You need CRM sync, scheduled runs or a shared team workspace.</LI>
        <LI>You want a support contract and an SLA. This is an open-source project.</LI>
      </UL>

      <H2>What it actually costs</H2>
      <P>
        There is no platform fee, ever. You pay the model provider at their published rates. A
        1,000-row job with four researched columns starts at about{" "}
        <strong className="font-semibold text-ink">
          {formatUSD(costPerThousandRows(cheapest.id))}
        </strong>{" "}
        on {cheapest.name}, including web-search fees.
      </P>
      <P>
        The tool quotes an exact figure after a five-row test, before you commit to the batch — and
        reports token usage, peak tokens-per-minute and a blank-cell count while it runs. Full
        breakdown on the{" "}
        <Link href="/models" className="text-accent underline decoration-accent-line underline-offset-2">
          model pricing page
        </Link>
        .
      </P>

      <H3>Moving a workflow across</H3>
      <UL>
        <LI>Export your table from Clay as CSV.</LI>
        <LI>Load it into OpenClay and pick the columns that identify each row.</LI>
        <LI>Re-describe your Claygent prompt in plain English, or paste it into the template editor.</LI>
        <LI>Test five rows, compare against what Clay returned, then run the batch.</LI>
        <LI>Download and push back into your sequencer or CRM.</LI>
      </UL>

      <CTA label="Try it on a Clay export" />
    </ContentPage>
  );
}
