import Link from "next/link";
import { breadcrumbJsonLd, jsonLdScript, type Crumb } from "@/lib/seo";
import { GitHubIcon } from "./icons";

/*
 * Shared shell for every non-app page.
 *
 * The policy pages each carried their own nav and footer markup, which is why
 * they were still on the old white/zinc palette after the redesign. One shell
 * means they can't drift again.
 */

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-6 w-6" />
          <span className="text-sm font-bold tracking-tight">OpenClay</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/models"
            className="hidden font-mono text-[11px] text-ink-2 transition-colors hover:text-accent sm:block"
          >
            Models
          </Link>
          <Link
            href="/use-cases"
            className="hidden font-mono text-[11px] text-ink-2 transition-colors hover:text-accent sm:block"
          >
            Use cases
          </Link>
          <Link
            href="/tool"
            className="rounded bg-accent px-3.5 py-1.5 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            Open the app
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  const groups: { title: string; links: [string, string][] }[] = [
    {
      title: "Product",
      links: [
        ["/tool", "Enrich a spreadsheet"],
        ["/models", "Models & pricing"],
        ["/use-cases", "Use cases"],
        ["/self-host", "Self-host"],
        ["/docs/api", "HTTP API"],
      ],
    },
    {
      title: "Compare",
      links: [
        ["/alternatives/clay", "vs Clay"],
        ["/models/openai", "OpenAI pricing"],
        ["/models/gemini", "Gemini pricing"],
        ["/models/anthropic", "Claude pricing"],
        ["/docs/custom-endpoint", "Custom endpoints"],
      ],
    },
    {
      title: "Legal",
      links: [
        ["/about", "About"],
        ["/privacy", "Privacy"],
        ["/terms", "Terms"],
        ["/data", "Data practices"],
      ],
    },
  ];

  return (
    <footer className="border-t border-line px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/icon.svg" alt="" className="h-5 w-5" />
              <span className="text-sm font-bold tracking-tight">OpenClay</span>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-ink-3">
              Free, open-source AI spreadsheet enrichment. Bring your own key.
            </p>
            <a
              href="https://github.com/raghav3600/Altclay"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] text-ink-2 transition-colors hover:text-accent"
            >
              <GitHubIcon className="h-3 w-3" />
              GitHub
            </a>
          </div>
          {groups.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <h2 className="eyebrow">{g.title}</h2>
              <ul className="mt-2 space-y-1.5">
                {g.links.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-mono text-[11px] text-ink-2 transition-colors hover:text-accent"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-8 text-center text-[10px] leading-relaxed text-ink-3">
          Provided as-is without warranty. AI-generated data can be inaccurate — always verify results.
        </p>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd(crumbs)) }}
      />
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-ink-3">
          {crumbs.map((c, i) => (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === crumbs.length - 1 ? (
                <span aria-current="page" className="text-ink-2">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="transition-colors hover:text-accent">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** Long-form page frame: nav, breadcrumbs, title block, prose, footer. */
export function ContentPage({
  title,
  lede,
  crumbs,
  updated,
  children,
  jsonLd,
}: {
  title: string;
  lede?: string;
  crumbs: Crumb[];
  updated?: string;
  children: React.ReactNode;
  jsonLd?: object[];
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      {jsonLd?.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
        />
      ))}
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumbs crumbs={crumbs} />
        <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {lede && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2">{lede}</p>}
        {updated && <p className="mt-3 font-mono text-[10px] text-ink-3">Updated {updated}</p>}
        <div className="mt-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

/* --- prose primitives, so content pages don't hand-roll typography --- */

export function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2
      id={id}
      className="mt-10 scroll-mt-20 border-t border-line pt-8 text-xl font-bold tracking-tight text-ink first:mt-0 first:border-0 first:pt-0"
    >
      {children}
    </h2>
  );
}

export function H3({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h3 id={id} className="mt-6 scroll-mt-20 text-sm font-semibold text-ink">
      {children}
    </h3>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 space-y-1.5 text-[14px] leading-relaxed text-ink-2">{children}</ul>;
}

export function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-line bg-surface-2 px-1 py-px font-mono text-[12px] text-ink">
      {children}
    </code>
  );
}

export function Pre({ children }: { children: string }) {
  return (
    <pre className="thin-scroll mt-3 overflow-x-auto rounded border border-line bg-surface-2 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-ink-2">
      {children}
    </pre>
  );
}

export function CTA({ label = "Start enriching — free" }: { label?: string }) {
  return (
    <div className="mt-10 rounded border border-accent-line bg-accent-soft p-5 text-center">
      <p className="text-sm font-semibold text-ink">No account, no card, no platform fee.</p>
      <p className="mt-1 text-[13px] text-ink-2">
        Bring your own API key and pay the model provider directly.
      </p>
      <Link
        href="/tool"
        className="mt-4 inline-flex items-center gap-2 rounded bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
      >
        {label}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
