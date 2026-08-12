import Link from "next/link";
import type { Metadata } from "next";
import { getAlternative } from "@/lib/alternatives";
import { ALL_MODELS, PRICING_LAST_UPDATED } from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { formatUSD } from "@/lib/runStats";
import { pageMetadata, articleJsonLd } from "@/lib/seo";
import { ContentPage, H2, H3, P, UL, LI, Pre, CTA } from "@/app/components/ContentPage";

const PAGE = getAlternative("claygent")!;

export const metadata: Metadata = pageMetadata({
  title: PAGE.title,
  description: PAGE.description,
  path: "/alternatives/claygent",
  keywords: PAGE.keywords,
  type: "article",
});

export default function ClaygentPage() {
  const cheapest = [...ALL_MODELS].sort(
    (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
  )[0];

  return (
    <ContentPage
      title={PAGE.h1}
      lede={PAGE.lede}
      updated={PRICING_LAST_UPDATED}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Alternatives", path: "/alternatives" },
        { name: "Claygent", path: "/alternatives/claygent" },
      ]}
      jsonLd={[
        articleJsonLd({
          title: PAGE.title,
          description: PAGE.description,
          path: "/alternatives/claygent",
          updated: "2026-08-11",
        }),
      ]}
    >
      <H2>Same job, different billing model</H2>
      <P>
        Claygent takes a row, reads the open web, and returns an answer to a question you wrote. So
        does OpenClay. The difference is what sits behind it: Claygent draws down credits inside a
        subscription, and OpenClay sends the request to a model provider on your own API key.
      </P>
      <P>
        That matters most at volume. Credit systems price research per row at a rate the platform
        sets. Paying the model directly prices it at what the tokens actually cost, which for a
        typical research row is a fraction of a cent.
      </P>

      <div className="thin-scroll mt-5 overflow-x-auto rounded border border-line">
        <table className="min-w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-surface-2">
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2" />
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-3">Claygent</th>
              <th className="border-b border-l border-accent-line bg-accent-soft px-3 py-2 text-left font-semibold text-accent">
                OpenClay
              </th>
            </tr>
          </thead>
          <tbody>
            {([
              ["Per-row AI web research", "Yes", "Yes"],
              ["Runs on", "Clay credits", "Your own API key"],
              ["Platform fee", "Clay subscription", "None"],
              ["Model choice", "Set by the platform", `${ALL_MODELS.length} models, or your own endpoint`],
              ["Prompt visibility", "Configured in Clay", "Full template, editable per run"],
              ["Cost per 1,000 rows", "Credit spend", `From ${formatUSD(costPerThousandRows(cheapest.id))}`],
              ["Where the data sits", "Their servers", "Your browser"],
              ["Source code", "Proprietary", "Open source"],
            ] as [string, string, string][]).map(([f, c, o]) => (
              <tr key={f} className="border-b border-line last:border-0">
                <td className="px-3 py-2 font-medium text-ink">{f}</td>
                <td className="px-3 py-2 text-ink-3">{c}</td>
                <td className="border-l border-accent-line bg-accent-soft/40 px-3 py-2 text-ink">{o}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[10px] text-ink-3">
        Clay details from their public documentation and pricing page, subject to change.
      </p>

      <H2>Porting a Claygent prompt</H2>
      <P>
        Claygent prompts translate almost directly. Anywhere you referenced a column, OpenClay uses
        the same braces syntax, and the run substitutes that row&apos;s value before sending.
      </P>
      <Pre>{`Find the current CEO of {Company} and their total funding raised.
Return ONLY valid JSON: {"ceo":"string","funding":"string"}`}</Pre>
      <UL>
        <LI>Export your Clay table as CSV.</LI>
        <LI>Load it into OpenClay and select the columns that identify each row.</LI>
        <LI>
          Paste your prompt into the template editor, or describe the fields in plain English and
          let OpenClay write the prompt.
        </LI>
        <LI>Test five rows, compare against what Claygent returned, then run the batch.</LI>
      </UL>
      <P>
        The template editor validates as you type. If a template has no column placeholders, the run
        is blocked rather than sending every row the same prompt.
      </P>

      <H3>What you gain in the move</H3>
      <UL>
        <LI>Choose the model per job, from the cheapest through to a flagship.</LI>
        <LI>Exact cost quoted after a five-row test, before the batch runs.</LI>
        <LI>Token usage, peak tokens-per-minute and a blank-cell count while it runs.</LI>
        <LI>Retry only the rows that failed, without re-running the ones that worked.</LI>
        <LI>Your spreadsheet never leaves the browser.</LI>
      </UL>

      <H2>Keep Clay for the rest</H2>
      <P>
        Claygent is one feature of a larger platform. If you also rely on Clay&apos;s data-provider
        waterfall for verified emails and phone numbers, or on its CRM sync, keep the subscription
        and use OpenClay for the research columns. Plenty of teams run exactly that split. The{" "}
        <Link
          href="/alternatives/clay"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          full comparison
        </Link>{" "}
        covers where the line sits, and{" "}
        <Link
          href="/alternatives/clay-pricing"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          the pricing page
        </Link>{" "}
        works through the arithmetic.
      </P>

      <CTA label="Run your Claygent prompt here" />
    </ContentPage>
  );
}
