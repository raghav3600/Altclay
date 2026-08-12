/*
 * Structured data for search engines and answer engines.
 *
 * FAQ_ITEMS is the single source of truth: the landing page renders it visibly
 * and FAQJsonLd serialises the same array. They previously duplicated each
 * other and had already drifted apart, the JSON-LD still advertised models
 * that had been replaced in the UI.
 */

import { SITE_URL, REPO_URL, jsonLdScript } from "@/lib/seo";

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "What is OpenClay?",
    a: "OpenClay is a free, open-source alternative to Clay.com for AI-powered spreadsheet data enrichment. It uses AI models (GPT, Gemini, Claude or Grok) combined with live web search to research and enrich each row of your spreadsheet, finding company data, contacts, news, and any custom information you describe.",
  },
  {
    q: "Is OpenClay really free?",
    a: "Yes, OpenClay charges no platform fee, ever. The only cost is the AI provider's token usage (OpenAI, Google, Anthropic or xAI), which you pay directly at their published rates. Enriching 500 rows typically costs $1–$10 in API usage depending on the model chosen.",
  },
  {
    q: "How is OpenClay different from Clay?",
    a: "Clay connects to 150+ data providers (Apollo, ZoomInfo, etc.) for structured lookups and costs $149–$800/month. OpenClay uses AI + live web search to research each row, similar to Clay's Claygent feature. OpenClay is great for public information, news, company overviews, and custom research. It is not ideal for verified contact emails or data requiring proprietary database access.",
  },
  {
    q: "Is my data safe with OpenClay?",
    a: "Yes. OpenClay is privacy-first by design. Your files are parsed entirely in your browser and never uploaded. Your API key lives in browser memory only (React state) and is never persisted. There is no database, no cookies, and no localStorage. The API routes are stateless proxies that log nothing. The entire codebase is open source so you can verify all of this.",
  },
  {
    q: "What AI models does OpenClay support?",
    a: "OpenAI GPT (the GPT-5.6 Luna/Terra/Sol line plus GPT-5 Mini, Nano and earlier flagships), Google Gemini (the 3.x Flash, Flash-Lite and Pro family plus the 2.5 series), Anthropic Claude (Haiku 4.5, Sonnet 5, Opus 5 and previous flagships), and xAI Grok (4.3, 4.5 and the 4.20 variants). Every model listed supports live web search. Pricing is verified against each provider's published rates.",
  },
  {
    q: "What if I hit rate limits?",
    a: "OpenClay retries automatically with exponential backoff and honours the provider's Retry-After header. You can also tune how many rows run in parallel, and the run panel reports peak tokens-per-minute so you can size your provider quota correctly. Rows that still fail can be retried on their own without re-running the whole batch.",
  },
  {
    q: "What file formats does OpenClay support?",
    a: "CSV (.csv), Excel (.xlsx), and legacy Excel (.xls) up to 10MB. Files are parsed in your browser using PapaParse and SheetJS, nothing is uploaded to any server.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. OpenClay requires no account, no sign-up, and no credit card. Open the app, load a spreadsheet, add your AI API key, and start enriching.",
  },
  {
    q: "What kind of data can I enrich?",
    a: "Anything you can describe in plain English. Common uses include company research (CEO, funding, headcount), lead enrichment (job title, LinkedIn, recent news), university data (ranking, tuition, acceptance rate), and product research (pricing, reviews, competitors). OpenClay works for any dataset, not just B2B sales.",
  },
];

function JsonLd({ data }: { data: object }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "OpenClay",
        url: SITE_URL,
        description:
          "Free, open-source AI-powered data enrichment tool. Enrich any spreadsheet with company data, contacts, and custom research using GPT, Gemini, Claude or Grok.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/tool`,
        },
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "OpenClay",
        url: SITE_URL,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Free, open-source alternative to Clay for AI-powered spreadsheet data enrichment. Supports OpenAI GPT, Google Gemini, Anthropic Claude and xAI Grok models with live web search. Bring your own API key, no subscription needed.",
        featureList: [
          "AI-powered spreadsheet data enrichment",
          "Live web search for each row",
          "Supports GPT (OpenAI), Gemini (Google), Claude (Anthropic) and Grok (xAI) models",
          "Bring your own API key (BYOK)",
          "CSV and Excel file support",
          "Transparent cost estimation before running",
          "Token usage and peak tokens-per-minute reporting",
          "Automatic retry with exponential backoff on rate limits",
          "Tunable request concurrency",
          "100% free, no platform fee",
          "No account or sign-up required",
          "Privacy-first, no data stored on servers",
          "Fully open source on GitHub",
        ],
        screenshot: `${SITE_URL}/icon.svg`,
        softwareHelp: {
          "@type": "WebPage",
          url: `${SITE_URL}/data`,
        },
        isAccessibleForFree: true,
        license: REPO_URL,
        author: {
          "@type": "Person",
          name: "Raghav",
          url: "https://www.linkedin.com/in/-raghav/",
        },
      }}
    />
  );
}

export function FAQJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}
