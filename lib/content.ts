/*
 * Content for the indexable use-case pages.
 *
 * These are kept as data rather than hand-written JSX so every page carries the
 * same structure, a real prompt, real column names, the input a reader would
 * actually have, and the caveats. Thin auto-generated pages are a liability;
 * each entry here has to be worth reading on its own.
 */

export interface UseCase {
  slug: string;
  title: string;
  h1: string;
  lede: string;
  description: string;
  keywords: string[];
  /** Columns the reader is expected to already have. */
  inputColumns: string[];
  /** Columns OpenClay adds. */
  outputColumns: string[];
  prompt: string;
  /** Why this one works well with web-search enrichment. */
  worksBecause: string;
  /** Practical guidance for getting the best results. */
  goodToKnow: string;
  suggestedModel: string;
  steps: { name: string; text: string }[];
}

export const USE_CASES: UseCase[] = [
  {
    slug: "company-research",
    title: "Enrich a company list with AI",
    h1: "Enrich a company list with AI",
    lede: "Turn a column of company names into leadership, funding, headcount and positioning, researched from the live web one row at a time.",
    description:
      "Enrich a spreadsheet of companies with CEO name, funding raised, employee count and a description using AI and live web search. Free, open source, bring your own API key.",
    keywords: [
      "enrich company data",
      "company data enrichment",
      "AI company research",
      "bulk company lookup",
      "CEO name finder spreadsheet",
      "funding data enrichment",
    ],
    inputColumns: ["Company", "Domain"],
    outputColumns: ["CEO name", "Total funding", "Employee count", "One-line description"],
    prompt:
      "Find the current CEO, total disclosed funding raised, approximate employee count, and a one-sentence description of what the company does.",
    worksBecause:
      "Company leadership, funding rounds and headcount are widely reported on the open web: press releases, Crunchbase profiles, LinkedIn pages and the company's own site. A model with search reads several of these per row and reconciles them.",
    goodToKnow:
      "Ask for a source year alongside funding figures and you will get more consistent numbers, since public sources disagree on rounds. Headcount read from a careers page tends to be fresher than a directory listing, so name the source you prefer in the prompt.",
    suggestedModel: "gemini-3-flash-preview",
    steps: [
      { name: "Load your list", text: "Upload a CSV or Excel file with a company name or domain column." },
      { name: "Describe what you need", text: "Type the fields you want in plain English, or start from the Company research preset." },
      { name: "Test five rows", text: "Check the results and the exact per-row cost before running the full batch." },
      { name: "Run and download", text: "Run every row, then download the enriched file with the new columns appended." },
    ],
  },
  {
    slug: "lead-enrichment",
    title: "Enrich a lead list without paying for Clay",
    h1: "Enrich a lead list without a subscription",
    lede: "Export raw prospects from Apollo, lemlist or LinkedIn, enrich them with live research, and pipe them back into your sequencer.",
    description:
      "Enrich sales leads with job titles, company context and recent news using AI and web search. The free, open-source alternative to Clay, with no platform fee.",
    keywords: [
      "lead enrichment",
      "free lead enrichment tool",
      "Clay alternative lead enrichment",
      "prospect list enrichment",
      "sales list enrichment AI",
      "lemlist enrichment",
    ],
    inputColumns: ["Full name", "Company", "LinkedIn URL"],
    outputColumns: ["Current title", "Seniority", "Company summary", "Recent trigger event"],
    prompt:
      "Find this person's current job title and seniority level, a one-line summary of their employer, and any notable company news from the last six months that would make a relevant outreach hook.",
    worksBecause:
      "The expensive part of outbound is not the contact record. It is the context that makes a message worth reading. Trigger events, recent launches and funding news are public, and a model with search finds them per-prospect at a fraction of a cent.",
    goodToKnow:
      "This layer adds the context that makes a message land: the trigger event, the positioning, the reason to reach out now. Keep your existing contact source for verified emails and let OpenClay handle everything around them.",
    suggestedModel: "gemini-3.1-flash-lite",
    steps: [
      { name: "Export your prospects", text: "Pull the raw list out of Apollo, lemlist or wherever it lives, as CSV." },
      { name: "Pick the identifying columns", text: "Name plus company is usually enough; a LinkedIn URL improves accuracy." },
      { name: "Describe the research", text: "Ask for the specific angles you'd actually use in a message." },
      { name: "Import back", text: "Download the enriched CSV and load it into your sequencer as custom fields." },
    ],
  },
  {
    slug: "competitor-analysis",
    title: "Build a competitor matrix with AI",
    h1: "Build a competitor matrix from a list of names",
    lede: "Give it a column of competitors and get pricing, positioning, target segment and differentiators back as structured columns.",
    description:
      "Turn a list of competitors into a structured comparison matrix with pricing, positioning and target market, researched from the live web with AI.",
    keywords: [
      "competitor analysis spreadsheet",
      "competitive matrix AI",
      "automated competitor research",
      "pricing research tool",
      "market research enrichment",
    ],
    inputColumns: ["Product", "Website"],
    outputColumns: ["Starting price", "Pricing model", "Target segment", "Key differentiator"],
    prompt:
      "Find the entry-level price and pricing model (per-seat, usage-based, flat), the primary target customer segment, and the single clearest differentiator this product claims over alternatives.",
    worksBecause:
      "Pricing pages, homepages and comparison posts are all public and highly structured. This is the kind of research that is tedious rather than hard, which makes it a good fit for per-row automation.",
    goodToKnow:
      "Enterprise tiers are often quote-only, and the model returns N/A rather than guessing. The blank-cell counter tells you how much of a market prices publicly, which is a useful signal in itself.",
    suggestedModel: "gemini-3.1-pro-preview",
    steps: [
      { name: "List the competitors", text: "One row per product, with a website column if you have it." },
      { name: "Name the comparison axes", text: "Each axis becomes an output column, so be specific." },
      { name: "Test and tune", text: "If cells come back blank, make the column names more concrete and re-test." },
      { name: "Export the matrix", text: "Download and drop straight into your comparison deck or doc." },
    ],
  },
  {
    slug: "university-data",
    title: "Enrich a list of universities",
    h1: "Enrich a list of universities or schools",
    lede: "Rankings, acceptance rates, tuition and programme details for hundreds of institutions, without copying from a dozen tabs.",
    description:
      "Enrich a spreadsheet of universities with rankings, acceptance rates, tuition costs and programme details using AI and live web search.",
    keywords: [
      "university data enrichment",
      "college data spreadsheet",
      "acceptance rate lookup bulk",
      "tuition data enrichment",
      "education data research AI",
    ],
    inputColumns: ["University", "Country"],
    outputColumns: ["World ranking", "Acceptance rate", "Annual tuition", "Notable programmes"],
    prompt:
      "Find the most recent world ranking, undergraduate acceptance rate, annual international tuition in USD, and two or three programmes the institution is best known for.",
    worksBecause:
      "This is a classic case where the data exists publicly but is scattered across ranking sites, admissions pages and prospectuses. It is also a good demonstration that enrichment is not only a B2B sales tool.",
    goodToKnow:
      "Rankings vary by publisher and tuition varies by programme and residency, so name the ranking body and the year in your prompt. Adding a source column alongside each figure makes the results easy to audit later.",
    suggestedModel: "gemini-3-flash-preview",
    steps: [
      { name: "List institutions", text: "One row per university, ideally with a country column to disambiguate." },
      { name: "Ask for specific figures", text: "Name the year or ranking body if you need consistency across rows." },
      { name: "Test five rows", text: "Check that figures look plausible before committing to the whole list." },
      { name: "Download", text: "Export with the new columns appended to your original sheet." },
    ],
  },
  {
    slug: "hiring-signals",
    title: "Track hiring signals across companies",
    h1: "Track hiring signals across a list of companies",
    lede: "Open roles, the functions being hired, and the careers page URL: a decent proxy for where a company is investing.",
    description:
      "Find open job postings, hiring focus and careers page URLs across a list of companies using AI and live web search. Free and open source.",
    keywords: [
      "hiring signals",
      "job posting tracker spreadsheet",
      "company hiring data",
      "recruitment intelligence AI",
      "open roles enrichment",
    ],
    inputColumns: ["Company", "Domain"],
    outputColumns: ["Open roles", "Top hiring function", "Careers page URL", "Hiring signal"],
    prompt:
      "Find the approximate number of currently open job postings, which function they are concentrated in, the careers page URL, and whether hiring appears to be expanding or slowing.",
    worksBecause:
      "Careers pages are public and job boards are indexed. Hiring is one of the more honest signals a company emits about its priorities, far more so than its marketing copy.",
    goodToKnow:
      "Hiring moves daily, so the direction of travel is the signal worth tracking rather than any single count. Re-run monthly and you get a trend line that is genuinely predictive of where a company is investing.",
    suggestedModel: "gemini-3.1-flash-lite",
    steps: [
      { name: "Load target accounts", text: "A company name column is enough; a domain improves precision." },
      { name: "Ask for the signal, not just the count", text: "Direction of hiring is more useful than a raw number." },
      { name: "Test and run", text: "Verify on five rows, then run the batch." },
      { name: "Re-run on a schedule", text: "Hiring data ages quickly, re-enrich monthly for a trend." },
    ],
  },
  {
    slug: "csv-enrichment",
    title: "Enrich any CSV with AI",
    h1: "Enrich any CSV with AI and web search",
    lede: "The generic case. If you can describe the column you want in a sentence, and the answer exists on the public web, this works.",
    description:
      "Add AI-researched columns to any CSV or Excel file. Describe what you need in plain English and OpenClay researches every row with live web search.",
    keywords: [
      "enrich CSV with AI",
      "AI spreadsheet enrichment",
      "add columns to CSV automatically",
      "bulk data enrichment CSV",
      "Excel AI enrichment",
      "spreadsheet automation AI",
    ],
    inputColumns: ["Any identifying column"],
    outputColumns: ["Whatever you describe"],
    prompt:
      "Describe the fields you want in plain English. OpenClay converts your description into a per-row prompt with your columns substituted in, and asks the model to return strict JSON.",
    worksBecause:
      "Nothing about the tool is specific to companies or sales. Every row is an independent prompt with that row's values substituted in, so the same machinery works for products, countries, papers, properties or anything else with a public footprint.",
    goodToKnow:
      "Anything with a public footprint is fair game. The clearer your column names, the better the results: specific questions produce specific answers, and the five-row test shows you the quality before you commit to a batch.",
    suggestedModel: "gemini-3-flash-preview",
    steps: [
      { name: "Upload the file", text: "CSV, XLS or XLSX up to 10 MB, parsed entirely in your browser." },
      { name: "Choose input columns", text: "Pick the columns that identify the thing being researched." },
      { name: "Name your output columns", text: "Each becomes a new column in the downloaded file." },
      { name: "Test, run, download", text: "Five rows first for an exact cost, then the full batch." },
    ],
  },
];

export function getUseCase(slug: string): UseCase | undefined {
  return USE_CASES.find((u) => u.slug === slug);
}
