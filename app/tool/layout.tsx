import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ALL_MODELS, CATALOG_PROVIDERS } from "@/lib/pricing";

/*
 * The tool page is a client component, so it cannot export metadata itself.
 * Without this layout it inherited the root title and competed with the
 * homepage for the same string in search results.
 */
export const metadata: Metadata = pageMetadata({
  title: "Enrich a spreadsheet with AI — free, no account",
  description: `Upload a CSV or Excel file, describe what you need in plain English, and OpenClay researches every row with AI and live web search. ${ALL_MODELS.length} models across ${CATALOG_PROVIDERS.length} providers. Bring your own API key — no platform fee.`,
  path: "/tool",
  keywords: [
    "enrich spreadsheet AI",
    "CSV enrichment tool",
    "AI data enrichment free",
    "bulk company research",
    "spreadsheet AI columns",
    "BYOK enrichment",
  ],
});

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
