import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { WebsiteJsonLd, SoftwareApplicationJsonLd } from "./structured-data";
import "./globals.css";

const siteUrl = "https://openclay.io";

export const metadata: Metadata = {
  title: {
    default: "OpenClay — Free, Open-Source AI Data Enrichment Tool",
    template: "%s | OpenClay",
  },
  description:
    "Free, open-source alternative to Clay.com for AI-powered spreadsheet data enrichment. Use GPT, Claude, Gemini, or Grok with your own API key. Enrich company data, find contacts, research leads — no subscription, no account needed.",
  keywords: [
    "data enrichment",
    "spreadsheet enrichment",
    "AI data enrichment",
    "free Clay alternative",
    "open source Clay",
    "Clay.com alternative",
    "lead enrichment",
    "company data enrichment",
    "AI spreadsheet tool",
    "BYOK AI tool",
    "free data enrichment tool",
    "bulk data enrichment",
    "AI web research",
    "Claude API tool",
    "Gemini API tool",
    "GPT API tool",
    "OpenAI data enrichment",
    "CSV enrichment",
    "Excel enrichment",
    "open source data tool",
    "free lead enrichment",
    "AI-powered research",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "OpenClay",
    title: "OpenClay — Free, Open-Source AI Data Enrichment",
    description:
      "Enrich any spreadsheet with AI + web search. Free alternative to Clay. Use your own API key — no subscription, no account, no data stored.",
    images: [
      {
        url: `${siteUrl}/icon.svg`,
        width: 512,
        height: 512,
        alt: "OpenClay — Free AI Data Enrichment",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "OpenClay — Free, Open-Source AI Data Enrichment",
    description:
      "Enrich any spreadsheet with AI + web search. Free alternative to Clay. Bring your own API key — zero cost, zero data stored.",
    images: [`${siteUrl}/icon.svg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  authors: [{ name: "Raghav", url: "https://www.linkedin.com/in/-raghav/" }],
  creator: "Raghav",
  category: "Technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <WebsiteJsonLd />
        <SoftwareApplicationJsonLd />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
