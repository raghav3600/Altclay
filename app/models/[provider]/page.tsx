import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Provider } from "@/lib/types";
import {
  MODELS_BY_PROVIDER,
  PROVIDER_META,
  CATALOG_PROVIDERS,
  PRICING_LAST_UPDATED,
} from "@/lib/pricing";
import { costPerThousandRows } from "@/lib/costEstimator";
import { formatUSD } from "@/lib/runStats";
import { pageMetadata } from "@/lib/seo";
import { ContentPage, H2, H3, P, UL, LI, Code, CTA } from "@/app/components/ContentPage";
import { ProviderLogo } from "@/app/components/icons";

// Only catalogued providers get a pricing page; the custom endpoint has none.
function isProvider(v: string): v is Provider {
  return (CATALOG_PROVIDERS as string[]).includes(v);
}

export function generateStaticParams() {
  return CATALOG_PROVIDERS.map((p) => ({ provider: p }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>;
}): Promise<Metadata> {
  const { provider } = await params;
  if (!isProvider(provider)) return {};
  const meta = PROVIDER_META[provider];
  const models = MODELS_BY_PROVIDER[provider];
  return pageMetadata({
    title: `${meta.company} ${meta.name} API pricing for data enrichment`,
    description: `${models.length} ${meta.company} models compared for spreadsheet enrichment: token prices, web-search fees and real cost per 1,000 rows. Verified ${PRICING_LAST_UPDATED}.`,
    path: `/models/${provider}`,
    keywords: [
      `${meta.company} API pricing`,
      `${meta.name} pricing`,
      `${meta.name} data enrichment`,
      `${meta.company} web search API cost`,
      `cheapest ${meta.name} model`,
    ],
  });
}

/** Provider-specific quirks worth knowing before a large run. */
const PROVIDER_NOTES: Partial<Record<Provider, { searchNote: string; quirk: string }>> = {
  openai: {
    searchNote:
      "OpenAI bills web search at $10 per 1,000 calls plus the search content itself as input tokens, roughly 8k per search. On a short enrichment prompt that overhead is the dominant cost, not the prompt.",
    quirk:
      "The GPT-5 family reasons by default. OpenClay sends an explicit low reasoning effort so a one-line lookup isn't billed for deliberation it doesn't need. Minimal effort is deliberately not used, because web search rejects it.",
  },
  gemini: {
    searchNote:
      "Gemini 3.x includes 5,000 free grounded searches per month, then $14 per 1,000. The 2.5 series gets 1,500 free per day but costs $35 per 1,000 after that, which usually makes a 3.x model cheaper overall despite a higher token price.",
    quirk:
      "Paste a Google Cloud service-account JSON instead of an API key to run through Vertex AI. Gemini 3.x on Vertex is only served from the global endpoint, which OpenClay handles automatically.",
  },
  anthropic: {
    searchNote:
      "Anthropic bills web search at $10 per 1,000 searches with no free allowance, and adds roughly 346 tokens of tool-definition overhead to every request that declares the tool.",
    quirk:
      "Opus 5 and Sonnet 5 think by default. OpenClay sends adaptive thinking at low effort rather than disabling it outright, with thinking off, these models occasionally emit a tool call as plain text, which means the web search silently never runs.",
  },
  grok: {
    searchNote:
      "xAI does not publish a per-search rate for the server-side web search tool. OpenClay estimates $5 per 1,000 and labels it as an estimate everywhere it appears, rather than presenting a guess as a quoted price.",
    quirk:
      "Grok has the cheapest output tokens of any flagship-class model here, which matters when your output columns are verbose.",
  },
};

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const { provider } = await params;
  if (!isProvider(provider)) notFound();

  const meta = PROVIDER_META[provider];
  const notes = PROVIDER_NOTES[provider]!;
  const models = [...MODELS_BY_PROVIDER[provider]].sort(
    (a, b) => costPerThousandRows(a.id) - costPerThousandRows(b.id)
  );
  const cheapest = models[0];
  const best = models.find((m) => m.quality === "best") ?? models[models.length - 1];

  return (
    <ContentPage
      title={`${meta.company} ${meta.name} pricing for enrichment`}
      lede={`All ${models.length} ${meta.company} models OpenClay supports, ranked by what 1,000 enriched rows actually cost once search fees are included.`}
      updated={PRICING_LAST_UPDATED}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Models", path: "/models" },
        { name: meta.company, path: `/models/${provider}` },
      ]}
    >
      <p className="mb-5 flex items-center gap-2 font-mono text-[11px] text-ink-2">
        <ProviderLogo provider={provider} className="h-4 w-4" />
        {meta.company} · {models.length} models · keys start with {meta.keyPrefix}
      </p>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-line bg-surface-2 p-3">
          <div className="eyebrow">Cheapest per row</div>
          <div className="mt-1 text-sm font-semibold text-ink">{cheapest.name}</div>
          <div className="font-mono text-[11px] text-ink-2 tnum">
            {formatUSD(costPerThousandRows(cheapest.id))} per 1,000 rows
          </div>
        </div>
        <div className="rounded border border-line bg-surface-2 p-3">
          <div className="eyebrow">Most capable</div>
          <div className="mt-1 text-sm font-semibold text-ink">{best.name}</div>
          <div className="font-mono text-[11px] text-ink-2 tnum">
            {formatUSD(costPerThousandRows(best.id))} per 1,000 rows
          </div>
        </div>
      </div>

      <H2>How {meta.company} bills web search</H2>
      <P>{notes.searchNote}</P>

      <H2>Worth knowing</H2>
      <P>{notes.quirk}</P>

      <H2>Every {meta.name} model</H2>
      <div className="thin-scroll mt-4 overflow-x-auto rounded border border-line">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-surface-2">
            <tr>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Model</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">Input</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">Output</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">Context</th>
              <th className="border-b border-line px-3 py-2 text-right font-medium text-ink-2">Per 1k rows</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">
                  <div className="font-medium text-ink">{m.name}</div>
                  <div className="font-mono text-[10px] text-ink-3">{m.id}</div>
                  <div className="mt-0.5 text-[11px] text-ink-2">{m.bestFor}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-ink-2 tnum">
                  ${m.inputPer1M}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-ink-2 tnum">
                  ${m.outputPer1M}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-ink-2 tnum">
                  {(m.contextWindow / 1000).toFixed(0)}k
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono font-semibold text-ink tnum">
                  {formatUSD(costPerThousandRows(m.id))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Using your {meta.company} key</H2>
      <UL>
        <LI>
          Get a key from{" "}
          <a
            href={meta.keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent-line underline-offset-2"
          >
            {meta.docsLabel}
          </a>. Keys start with <Code>{meta.keyPrefix}</Code>.
        </LI>
        <LI>
          Paste it into OpenClay. It stays in browser memory for the tab, never written to disk, a
          database, a log or a cookie.
        </LI>
        <LI>
          Test five rows for an exact per-row cost before running the batch.
        </LI>
        <LI>
          If you hit rate limits, lower the parallel-requests slider. Failed rows retry automatically
          with exponential backoff.
        </LI>
      </UL>

      <H3>Compare against other providers</H3>
      <UL>
        {CATALOG_PROVIDERS.filter((p) => p !== provider).map((p) => (
          <LI key={p}>
            <Link
              href={`/models/${p}`}
              className="text-accent underline decoration-accent-line underline-offset-2"
            >
              {PROVIDER_META[p].company} {PROVIDER_META[p].name} pricing
            </Link>
          </LI>
        ))}
      </UL>

      <CTA label={`Try ${meta.name} on your data`} />
    </ContentPage>
  );
}
