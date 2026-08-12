import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { USE_CASES, getUseCase } from "@/lib/content";
import { getModel, PRICING_LAST_UPDATED } from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { formatUSD } from "@/lib/runStats";
import { pageMetadata, articleJsonLd, howToJsonLd } from "@/lib/seo";
import { ContentPage, H2, P, UL, LI, Pre, Code, CTA } from "@/app/components/ContentPage";

export function generateStaticParams() {
  return USE_CASES.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) return {};
  return pageMetadata({
    title: uc.title,
    description: uc.description,
    path: `/use-cases/${uc.slug}`,
    keywords: uc.keywords,
    type: "article",
  });
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const uc = getUseCase(slug);
  if (!uc) notFound();

  const model = getModel(uc.suggestedModel);
  const per1k = model ? costPerThousandRows(model.id) : null;

  return (
    <ContentPage
      title={uc.h1}
      lede={uc.lede}
      updated={PRICING_LAST_UPDATED}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Use cases", path: "/use-cases" },
        { name: uc.title, path: `/use-cases/${uc.slug}` },
      ]}
      jsonLd={[
        articleJsonLd({
          title: uc.title,
          description: uc.description,
          path: `/use-cases/${uc.slug}`,
          updated: "2026-08-11",
        }),
        howToJsonLd({
          name: uc.h1,
          description: uc.description,
          steps: uc.steps,
        }),
      ]}
    >
      <H2>What goes in, what comes out</H2>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <section className="rounded border border-line bg-surface-2/60 p-3">
          <h3 className="eyebrow">Input</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {uc.inputColumns.map((c) => (
              <li
                key={c}
                className="rounded border border-line bg-surface px-2 py-1 font-mono text-[11px] text-ink-2"
              >
                {c}
              </li>
            ))}
          </ul>
        </section>
        <div aria-hidden="true" className="flex items-center justify-center font-mono text-[10px] text-ink-3">
          <span className="sm:hidden">↓</span>
          <span className="hidden sm:inline">→</span>
        </div>
        <section className="rounded border border-data-line bg-data-soft/30 p-3">
          <h3 className="eyebrow">Output</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {uc.outputColumns.map((c) => (
              <li
                key={c}
                className="rounded border border-data-line bg-surface px-2 py-1 font-mono text-[11px] text-data"
              >
                {c}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <H2>The prompt</H2>
      <P>Paste this into the description field, or write your own version of it.</P>
      <Pre>{uc.prompt}</Pre>

      <H2>Why this works</H2>
      <P>{uc.worksBecause}</P>

      <H2>Getting the best results</H2>
      <P>{uc.goodToKnow}</P>

      <H2>What it costs</H2>
      {model && per1k !== null ? (
        <>
          <P>
            On <Code>{model.name}</Code>, a typical row of this shape costs about{" "}
            <strong className="font-semibold text-ink">{formatUSD(per1k / 1000)}</strong>, so roughly{" "}
            <strong className="font-semibold text-ink">{formatUSD(per1k)}</strong> per thousand rows,
            paid directly to {model.provider === "gemini" ? "Google" : model.provider}. OpenClay adds
            nothing.
          </P>
          <P>
            The tool shows an exact figure after a five-row test, before you commit to the batch. See{" "}
            <Link href="/models" className="text-accent underline decoration-accent-line underline-offset-2">
              all models and pricing
            </Link>.
          </P>
        </>
      ) : (
        <P>Costs depend on the model you pick. The tool quotes an exact figure before you run.</P>
      )}

      <H2>Step by step</H2>
      <ol className="mt-3 space-y-2.5">
        {uc.steps.map((s, i) => (
          <li key={s.name} className="flex gap-3">
            <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-accent font-mono text-[10px] font-bold text-on-accent">
              {i + 1}
            </span>
            <span className="text-[14px] leading-relaxed text-ink-2">
              <strong className="font-semibold text-ink">{s.name}.</strong> {s.text}
            </span>
          </li>
        ))}
      </ol>

      <CTA />

      <H2>Other use cases</H2>
      <UL>
        {USE_CASES.filter((u) => u.slug !== uc.slug).map((u) => (
          <LI key={u.slug}>
            <Link
              href={`/use-cases/${u.slug}`}
              className="text-accent underline decoration-accent-line underline-offset-2"
            >
              {u.title}
            </Link>: {u.lede}
          </LI>
        ))}
      </UL>
    </ContentPage>
  );
}
