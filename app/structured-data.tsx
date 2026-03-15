export function WebsiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OpenClay",
    url: "https://openclay.io",
    description:
      "Free, open-source AI-powered data enrichment tool. Enrich any spreadsheet with company data, contacts, and custom research using Claude or Gemini.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://openclay.io/tool",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OpenClay",
    url: "https://openclay.io",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free, open-source alternative to Clay for AI-powered spreadsheet data enrichment. Supports Claude and Gemini models with live web search. Bring your own API key — no subscription needed.",
    featureList: [
      "AI-powered spreadsheet data enrichment",
      "Live web search for each row",
      "Supports Claude (Anthropic) and Gemini (Google) models",
      "Bring your own API key (BYOK)",
      "CSV and Excel file support",
      "Transparent cost estimation before running",
      "100% free — no platform fee",
      "No account or sign-up required",
      "Privacy-first — no data stored on servers",
      "Fully open source on GitHub",
    ],
    screenshot: "https://openclay.io/icon.svg",
    softwareHelp: {
      "@type": "WebPage",
      url: "https://openclay.io/data",
    },
    isAccessibleForFree: true,
    license: "https://github.com/raghav3600/Altclay",
    author: {
      "@type": "Person",
      name: "Raghav",
      url: "https://www.linkedin.com/in/-raghav/",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function FAQJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is OpenClay?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OpenClay is a free, open-source alternative to Clay.com for AI-powered spreadsheet data enrichment. It uses AI models (Claude or Gemini) combined with live web search to research and enrich each row of your spreadsheet — finding company data, contacts, news, and any custom information you describe.",
        },
      },
      {
        "@type": "Question",
        name: "Is OpenClay really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, OpenClay charges no platform fee — ever. The only cost is the AI provider's token usage (Anthropic or Google), which you pay directly at their published rates. For example, enriching 500 rows typically costs $2–$10 in API usage depending on the model chosen.",
        },
      },
      {
        "@type": "Question",
        name: "How is OpenClay different from Clay?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Clay connects to 150+ data providers (Apollo, ZoomInfo, etc.) for structured lookups and costs $149–$800/month. OpenClay uses AI + live web search to research each row — similar to Clay's Claygent feature. OpenClay is great for public information, news, company overviews, and custom research. It's not ideal for verified contact emails or data requiring proprietary database access.",
        },
      },
      {
        "@type": "Question",
        name: "Is my data safe with OpenClay?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. OpenClay is privacy-first by design. Your files are parsed entirely in your browser — never uploaded to any server. Your API key is stored in browser memory only (React useState) and is never persisted. There is no database, no cookies, and no localStorage. The entire codebase is open source so you can verify these claims.",
        },
      },
      {
        "@type": "Question",
        name: "What AI models does OpenClay support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OpenClay supports Anthropic Claude (Haiku 4.5, Sonnet 4.5, Opus 4.5) and Google Gemini (2.0 Flash, 2.5 Flash, 2.5 Pro). All models include live web search capability for up-to-date research results.",
        },
      },
      {
        "@type": "Question",
        name: "What file formats does OpenClay support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "OpenClay supports CSV (.csv), Excel (.xlsx), and legacy Excel (.xls) files up to 10MB. Files are parsed entirely in your browser using PapaParse and SheetJS — nothing is uploaded to any server.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
