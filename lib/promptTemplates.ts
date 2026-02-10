import type { CategoryPreset, EnrichmentCategory, EnrichmentField } from "./types";

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: "companies",
    icon: "\u{1F3E2}",
    name: "Companies & Startups",
    description: "Enrich company data with descriptions, funding, employee count, and more",
    contextLabel: "company or organization",
    fields: [
      { key: "company_description", label: "Company Description", description: "Brief description of what the company does" },
      { key: "industry", label: "Industry", description: "Primary industry or sector" },
      { key: "employee_count", label: "Employee Count", description: "Approximate number of employees" },
      { key: "hq_location", label: "HQ Location", description: "Headquarters city and country" },
      { key: "founded_year", label: "Founded Year", description: "Year the company was founded" },
      { key: "funding_stage", label: "Funding Stage", description: "Latest funding round (e.g., Series A, B, C)" },
      { key: "total_funding", label: "Total Funding", description: "Total funding raised in USD" },
      { key: "key_products", label: "Key Products", description: "Main products or services" },
      { key: "revenue_estimate", label: "Revenue Estimate", description: "Estimated annual revenue range" },
      { key: "tech_stack", label: "Tech Stack", description: "Known technologies used" },
      { key: "recent_news", label: "Recent News", description: "Most recent notable news" },
      { key: "competitors", label: "Competitors", description: "Main competitors" },
    ],
  },
  {
    id: "universities",
    icon: "\u{1F393}",
    name: "Universities & Education",
    description: "Enrich university data with rankings, student count, programs, and more",
    contextLabel: "university or educational institution",
    fields: [
      { key: "university_description", label: "University Description", description: "Brief description of the institution" },
      { key: "country", label: "Country", description: "Country where the university is located" },
      { key: "world_ranking", label: "World Ranking", description: "Approximate world ranking (QS/THE)" },
      { key: "student_count", label: "Student Count", description: "Total number of students" },
      { key: "acceptance_rate", label: "Acceptance Rate", description: "Acceptance rate percentage" },
      { key: "notable_programs", label: "Notable Programs", description: "Best-known academic programs" },
      { key: "tuition_international", label: "Tuition (International)", description: "Annual tuition for international students in USD" },
      { key: "campus_size", label: "Campus Size", description: "Campus size in acres or description" },
      { key: "research_output", label: "Research Output", description: "Notable research areas or output" },
      { key: "notable_alumni", label: "Notable Alumni", description: "Famous alumni" },
    ],
  },
  {
    id: "people",
    icon: "\u{1F464}",
    name: "People & Contacts",
    description: "Enrich person data with roles, companies, education, and more",
    contextLabel: "person or professional",
    fields: [
      { key: "current_role", label: "Current Role/Title", description: "Current job title" },
      { key: "current_company", label: "Current Company", description: "Current employer" },
      { key: "linkedin_summary", label: "LinkedIn Summary", description: "Brief professional summary" },
      { key: "location", label: "Location", description: "City and country" },
      { key: "previous_companies", label: "Previous Companies", description: "Notable previous employers" },
      { key: "education", label: "Education", description: "Educational background" },
      { key: "notable_achievements", label: "Notable Achievements", description: "Key accomplishments" },
      { key: "areas_of_expertise", label: "Areas of Expertise", description: "Professional specializations" },
    ],
  },
  {
    id: "countries",
    icon: "\u{1F30D}",
    name: "Countries & Regions",
    description: "Enrich country data with population, GDP, government type, and more",
    contextLabel: "country or region",
    fields: [
      { key: "population", label: "Population", description: "Current population" },
      { key: "gdp", label: "GDP", description: "Gross Domestic Product in USD" },
      { key: "capital", label: "Capital", description: "Capital city" },
      { key: "government_type", label: "Government Type", description: "Type of government" },
      { key: "official_language", label: "Official Language", description: "Official language(s)" },
      { key: "major_industries", label: "Major Industries", description: "Key economic sectors" },
      { key: "hdi_ranking", label: "HDI Ranking", description: "Human Development Index ranking" },
      { key: "climate", label: "Climate", description: "General climate description" },
      { key: "currency", label: "Currency", description: "Official currency" },
      { key: "key_trading_partners", label: "Key Trading Partners", description: "Major trading partner countries" },
    ],
  },
  {
    id: "products",
    icon: "\u{1F4CA}",
    name: "Products & Services",
    description: "Enrich product data with descriptions, pricing, ratings, and more",
    contextLabel: "product or service",
    fields: [
      { key: "product_description", label: "Product Description", description: "Brief description of the product/service" },
      { key: "category", label: "Category", description: "Product category" },
      { key: "price_range", label: "Price Range", description: "Typical price range" },
      { key: "target_audience", label: "Target Audience", description: "Primary target users" },
      { key: "key_features", label: "Key Features", description: "Main features or capabilities" },
      { key: "competitors", label: "Competitors", description: "Main competing products" },
      { key: "user_rating", label: "User Rating", description: "Average user rating" },
      { key: "platform_availability", label: "Platform/Availability", description: "Available platforms or regions" },
      { key: "launch_year", label: "Launch Year", description: "Year launched or founded" },
    ],
  },
  {
    id: "research",
    icon: "\u{1F52C}",
    name: "Research & Academic",
    description: "Enrich research data with summaries, citations, methodology, and more",
    contextLabel: "research topic or academic paper",
    fields: [
      { key: "summary", label: "Summary", description: "Brief summary of the paper/topic" },
      { key: "key_findings", label: "Key Findings", description: "Main findings or conclusions" },
      { key: "methodology", label: "Methodology", description: "Research methodology used" },
      { key: "citation_count", label: "Citation Count", description: "Number of citations" },
      { key: "journal_source", label: "Journal/Source", description: "Publication journal or source" },
      { key: "authors", label: "Authors", description: "Authors of the work" },
      { key: "year_published", label: "Year Published", description: "Publication year" },
      { key: "related_work", label: "Related Work", description: "Related research or papers" },
      { key: "impact_factor", label: "Impact Factor", description: "Journal impact factor" },
    ],
  },
  {
    id: "custom",
    icon: "\u{1F4E6}",
    name: "Custom (Freeform)",
    description: "Define your own enrichment fields for any type of data",
    contextLabel: "entity",
    fields: [],
  },
];

export function getPreset(category: EnrichmentCategory): CategoryPreset {
  return CATEGORY_PRESETS.find((p) => p.id === category) || CATEGORY_PRESETS[CATEGORY_PRESETS.length - 1];
}

export function buildPrompt(
  inputColumns: string[],
  rowData: Record<string, string>,
  selectedFields: EnrichmentField[],
  contextLabel: string,
  customPrompt?: string
): string {
  if (customPrompt) {
    let prompt = customPrompt;
    for (const col of inputColumns) {
      prompt = prompt.replace(new RegExp(`\\{${col}\\}`, "g"), rowData[col] || "");
    }
    return prompt;
  }

  const inputDataLines = inputColumns
    .map((col) => `"${col}": "${rowData[col] || ""}"`)
    .join("\n  ");

  const outputFieldLines = selectedFields
    .map((f) => `  "${f.key}": "${f.description}"`)
    .join(",\n");

  return `You are a data enrichment assistant. You have access to web search to find current, accurate information.

Given the following data:
  ${inputDataLines}

Research this ${contextLabel} and return ONLY a valid JSON object with these exact fields:
{
${outputFieldLines}
}

Rules:
- Use web search to find accurate, up-to-date information
- Be concise and factual in every field
- If data is genuinely unavailable after searching, use "N/A"
- Return ONLY valid JSON, no markdown, no explanation, no extra text
- Do not guess or fabricate data — only report what you can verify`;
}
