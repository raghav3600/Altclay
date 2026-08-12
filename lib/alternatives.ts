/*
 * The Clay-alternative keyword cluster.
 *
 * This is where most inbound traffic starts, so the pages are treated as a
 * cluster rather than one page: a hub, the primary "Clay alternative" page,
 * a Claygent page (the feature OpenClay actually replaces), and a pricing
 * page for people whose search is really "is Clay worth it".
 *
 * Each targets a distinct query so they support rather than cannibalise each
 * other, and every page links to the other three.
 */

export interface AlternativePage {
  slug: string;
  /** Nav and card label. */
  label: string;
  /** <title>, written for the query it targets. */
  title: string;
  h1: string;
  lede: string;
  description: string;
  keywords: string[];
  /** One line for the hub card. */
  summary: string;
}

export const ALTERNATIVE_PAGES: AlternativePage[] = [
  {
    slug: "clay",
    label: "Clay alternative",
    title: "Clay Alternative: Free, Open Source, No Subscription",
    h1: "The free Clay alternative",
    lede: "OpenClay does Clay's AI research at zero platform cost, using your own API key. Here is exactly what each tool is best at, so you can tell in a minute which one you need.",
    description:
      "A free, open-source Clay alternative for AI spreadsheet enrichment. No subscription, no credits, no account. Bring your own API key and pay the model provider directly.",
    keywords: [
      "Clay alternative",
      "free Clay alternative",
      "Clay.com alternative",
      "open source Clay alternative",
      "alternative to Clay",
      "Clay alternatives",
      "best Clay alternative",
      "Clay competitor",
      "data enrichment without Clay",
      "cheaper than Clay",
    ],
    summary: "The full side-by-side: cost, features, and what each tool is best at.",
  },
  {
    slug: "claygent",
    label: "Claygent alternative",
    title: "Claygent Alternative: The Same AI Research, Without Credits",
    h1: "A free Claygent alternative",
    lede: "Claygent is the part of Clay that reads the web and answers a question per row. That is exactly what OpenClay does, except you supply the model key and there are no credits to burn.",
    description:
      "A free, open-source Claygent alternative. Run the same per-row AI web research with your own API key, with no credit system and no subscription.",
    keywords: [
      "Claygent alternative",
      "Claygent replacement",
      "Clay AI agent alternative",
      "Claygent credits",
      "Claygent pricing",
      "AI research agent spreadsheet",
      "Claygent too expensive",
    ],
    summary: "For anyone whose Clay usage is really just Claygent.",
  },
  {
    slug: "clay-pricing",
    label: "Clay pricing compared",
    title: "Clay Pricing vs OpenClay: What Enrichment Actually Costs",
    h1: "What enrichment costs, with and without a subscription",
    lede: "Clay bills a monthly platform fee plus credits. OpenClay bills nothing and you pay the model provider directly. Here is the arithmetic on a real workload.",
    description:
      "Compare Clay's subscription and credit pricing against paying an AI provider directly. Real per-1,000-row costs, with no platform fee on the OpenClay side.",
    keywords: [
      "Clay pricing",
      "Clay cost",
      "is Clay worth it",
      "Clay credits explained",
      "Clay too expensive",
      "Clay pricing alternative",
      "data enrichment pricing",
      "cost per enriched row",
    ],
    summary: "The arithmetic on a real workload, subscription versus pay-per-use.",
  },
];

export function getAlternative(slug: string): AlternativePage | undefined {
  return ALTERNATIVE_PAGES.find((a) => a.slug === slug);
}
