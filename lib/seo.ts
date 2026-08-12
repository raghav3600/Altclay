import type { Metadata } from "next";

export const SITE_URL = "https://openclay.io";
export const REPO_URL = "https://github.com/raghav3600/Altclay";
export const SITE_NAME = "OpenClay";

/**
 * One place that knows how a page describes itself.
 *
 * Every route previously inherited the root title, so /tool, /privacy and
 * /terms all competed for the same string in search results. Canonicals were
 * hand-written per page and drifted.
 */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  type = "website",
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: `${SITE_URL}/icon.svg`, width: 512, height: 512, alt: title }],
    },
    twitter: { card: "summary", title, description },
  };
}

/**
 * Serialise JSON-LD for injection into a <script> tag.
 *
 * JSON.stringify happily emits a literal "</script>" if any string contains
 * one, which closes the tag early and drops the rest of the payload into the
 * document as markup. Escaping "<" makes that unrepresentable while staying
 * valid JSON.
 */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export interface Crumb {
  name: string;
  path: string;
}

/**
 * BreadcrumbList tells search engines how a page sits in the hierarchy, which
 * is what produces the path display under a result instead of a bare URL.
 */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

export function articleJsonLd({
  title,
  description,
  path,
  updated,
}: {
  title: string;
  description: string;
  path: string;
  updated: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}${path}`,
    dateModified: updated,
    author: { "@type": "Person", name: "Raghav", url: "https://www.linkedin.com/in/-raghav/" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    isAccessibleForFree: true,
  };
}

export function howToJsonLd({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    totalTime: "PT5M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}
