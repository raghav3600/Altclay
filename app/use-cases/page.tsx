import Link from "next/link";
import type { Metadata } from "next";
import { USE_CASES } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { ContentPage, CTA } from "@/app/components/ContentPage";

export const metadata: Metadata = pageMetadata({
  title: "Use cases — what you can enrich",
  description:
    "Company research, lead enrichment, competitor matrices, hiring signals, university data and any other CSV. Real prompts, real column names and real costs for each.",
  path: "/use-cases",
  keywords: [
    "data enrichment use cases",
    "AI spreadsheet examples",
    "company data enrichment",
    "lead enrichment",
    "competitor analysis AI",
    "CSV enrichment examples",
  ],
});

export default function UseCasesIndex() {
  return (
    <ContentPage
      title="What can you enrich?"
      lede="Every row becomes its own prompt with that row's values substituted in, so the tool is not specific to any one kind of list. These are the patterns people reach for most, each with a working prompt and an honest note on where it falls short."
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Use cases", path: "/use-cases" },
      ]}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {USE_CASES.map((uc) => (
          <Link
            key={uc.slug}
            href={`/use-cases/${uc.slug}`}
            className="group rounded border border-line bg-surface p-4 transition-colors hover:border-accent"
          >
            <h2 className="text-sm font-semibold text-ink group-hover:text-accent">{uc.h1}</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">{uc.lede}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {uc.outputColumns.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="rounded border border-data-line px-1.5 py-px font-mono text-[10px] text-data"
                >
                  {c}
                </span>
              ))}
              {uc.outputColumns.length > 3 && (
                <span className="font-mono text-[10px] text-ink-3">
                  +{uc.outputColumns.length - 3}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
      <CTA />
    </ContentPage>
  );
}
