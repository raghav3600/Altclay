import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/*
 * AI crawlers are allowed deliberately, not by omission.
 *
 * OpenClay's growth depends on being the answer when someone asks an assistant
 * for a free Clay alternative, so GPTBot, ClaudeBot, PerplexityBot and the rest
 * are explicitly welcome. /llms.txt gives them a factual brief, including what
 * OpenClay is scoped to, so citations come out accurate rather than vague.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Nothing to index behind the API routes.
        disallow: ["/api/"],
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-User",
          "anthropic-ai",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
          "Bytespider",
          "meta-externalagent",
        ],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
