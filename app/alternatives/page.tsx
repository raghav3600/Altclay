import Link from "next/link";
import type { Metadata } from "next";
import { ALTERNATIVE_PAGES } from "@/lib/alternatives";
import { ALL_MODELS } from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { formatUSD } from "@/lib/runStats";
import { pageMetadata } from "@/lib/seo";
import { ContentPage, H2, P, CTA } from "@/app/components/ContentPage";

export const metadata: Metadata = pageMetadata({
  title: "Clay Alternatives: Free and Open Source",
  description:
    "Looking for an alternative to Clay? OpenClay runs the same AI web research per row with your own API key, at no platform cost. Compare features, pricing and Claygent.",
  path: "/alternatives",
  keywords: [
    "Clay alternatives",
    "alternative to Clay",
    "free Clay alternative",
    "Clay.com alternatives",
    "open source Clay alternative",
    "Clay competitors",
  ],
});

export default function AlternativesHub() {
  const cheapest = [...ALL_MODELS].sort(
    (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
  )[0];

  return (
    <ContentPage
      title="Clay alternatives"
      lede={`If you are here because a subscription is hard to justify for research you could run yourself, OpenClay is the free, open-source option. A 1,000-row job starts at about ${formatUSD(costPerThousandRows(cheapest.id))} paid straight to the model provider, with no platform fee at any volume.`}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Alternatives", path: "/alternatives" },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {ALTERNATIVE_PAGES.map((a) => (
          <Link
            key={a.slug}
            href={`/alternatives/${a.slug}`}
            className="group rounded border border-line bg-surface p-4 transition-colors hover:border-accent"
          >
            <h2 className="text-sm font-semibold text-ink group-hover:text-accent">{a.label}</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">{a.summary}</p>
          </Link>
        ))}
      </div>

      <H2>Which page do you want?</H2>
      <P>
        <Link
          href="/alternatives/clay"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          Clay alternative
        </Link>{" "}
        is the full comparison: what each tool covers, where they overlap, and what a real workload
        costs on each. Start here if you are still deciding.
      </P>
      <P>
        <Link
          href="/alternatives/claygent"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          Claygent alternative
        </Link>{" "}
        is for the common case where the only Clay feature you genuinely use is the AI research
        agent. That is the exact thing OpenClay replaces, one-for-one.
      </P>
      <P>
        <Link
          href="/alternatives/clay-pricing"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          Clay pricing compared
        </Link>{" "}
        works the arithmetic if your question is really whether the subscription pays for itself at
        your volume.
      </P>

      <CTA label="Try it on a Clay export" />
    </ContentPage>
  );
}
