import type { MetadataRoute } from "next";
import { PROVIDER_ORDER } from "@/lib/pricing";
import { USE_CASES } from "@/lib/content";
import { ALTERNATIVE_PAGES } from "@/lib/alternatives";
import { SITE_URL } from "@/lib/seo";

/*
 * Derived from the same data the pages render from, so a new model provider or
 * use case appears in the sitemap automatically instead of being forgotten.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["", 1, "weekly"],
    ["/tool", 0.9, "weekly"],
    ["/alternatives", 0.85, "monthly"],
    ["/models", 0.8, "weekly"],
    ["/use-cases", 0.7, "monthly"],
    ["/self-host", 0.6, "monthly"],
    ["/docs/api", 0.6, "monthly"],
    ["/docs/custom-endpoint", 0.6, "monthly"],
    ["/about", 0.5, "monthly"],
    ["/privacy", 0.3, "yearly"],
    ["/terms", 0.3, "yearly"],
    ["/data", 0.4, "yearly"],
  ];

  return [
    ...staticRoutes.map(([path, priority, changeFrequency]) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...PROVIDER_ORDER.map((p) => ({
      url: `${SITE_URL}/models/${p}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...ALTERNATIVE_PAGES.map((a) => ({
      url: `${SITE_URL}/alternatives/${a.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      // The highest-intent cluster on the site.
      priority: a.slug === "clay" ? 0.95 : 0.8,
    })),
    ...USE_CASES.map((u) => ({
      url: `${SITE_URL}/use-cases/${u.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
