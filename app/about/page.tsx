import Link from "next/link";
import type { Metadata } from "next";
import { ALL_MODELS, CATALOG_PROVIDERS } from "@/lib/pricing";
import { pageMetadata, SITE_URL, REPO_URL, jsonLdScript } from "@/lib/seo";
import { ContentPage, H2, P, UL, LI, CTA } from "@/app/components/ContentPage";
import { LinkedInIcon, GitHubIcon } from "@/app/components/icons";

/* ------------------------------------------------------------------ *
 *  EDIT ME — everything personal lives in this one object.
 *
 *  Only verifiable facts are filled in. Anything that would be an
 *  invention about a real person is left blank on purpose: add your own
 *  wording and it appears on the page automatically. Blank fields are
 *  skipped rather than rendered empty.
 * ------------------------------------------------------------------ */
const AUTHOR = {
  name: "Raghav",
  /** Shown under the name. */
  tagline: "Builder of OpenClay",
  email: "info@deeptech.build",
  linkedin: "https://www.linkedin.com/in/-raghav/",
  github: "https://github.com/raghav3600",

  /** One or two paragraphs in your own voice. Leave blank to hide. */
  bio: "",

  /** Add entries as ["Role", "Where", "When"] — leave empty to hide the section. */
  work: [] as [string, string, string][],

  /** Other things you've built. ["Name", "URL", "One line"]. */
  projects: [] as [string, string, string][],

  /** Anything you'd like people to contact you about. */
  openTo: [
    "Feature requests and bug reports for OpenClay",
    "Feedback from anyone using it in production",
  ],
} as const;

export const metadata: Metadata = pageMetadata({
  title: `About ${AUTHOR.name} — the maker of OpenClay`,
  description: `${AUTHOR.name} built OpenClay, a free and open-source alternative to Clay for AI spreadsheet enrichment. Why it exists, how it is funded, and how to get in touch.`,
  path: "/about",
  keywords: [
    `${AUTHOR.name} OpenClay`,
    "OpenClay founder",
    "who made OpenClay",
    "open source data enrichment maker",
    "OpenClay about",
  ],
  type: "article",
});

export default function AboutPage() {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR.name,
    url: `${SITE_URL}/about`,
    email: `mailto:${AUTHOR.email}`,
    sameAs: [AUTHOR.linkedin, AUTHOR.github].filter(Boolean),
    jobTitle: AUTHOR.tagline,
    worksFor: { "@type": "Organization", name: "OpenClay", url: SITE_URL },
  };

  return (
    <ContentPage
      title={`About ${AUTHOR.name}`}
      lede={AUTHOR.tagline}
      crumbs={[
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd) }}
      />

      <div className="mb-8 flex flex-wrap gap-2">
        <a
          href={AUTHOR.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          <LinkedInIcon className="h-3.5 w-3.5" />
          LinkedIn
        </a>
        <a
          href={AUTHOR.github}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          <GitHubIcon className="h-3.5 w-3.5" />
          GitHub
        </a>
        <a
          href={`mailto:${AUTHOR.email}`}
          className="inline-flex items-center gap-2 rounded border border-line-strong bg-surface px-3.5 py-2 font-mono text-xs text-ink transition-colors hover:border-accent hover:text-accent"
        >
          {AUTHOR.email}
        </a>
      </div>

      {AUTHOR.bio && (
        <>
          <H2>Hello</H2>
          <P>{AUTHOR.bio}</P>
        </>
      )}

      <H2>Why OpenClay exists</H2>
      <P>
        Data enrichment is, at its core, a simple job: take a row, look something up, write the
        answer back. The tooling around it is priced as though it were much more than that — $149 to
        $800 a month before you enrich a single record.
      </P>
      <P>
        Meanwhile the models that do the actual work are available to anyone with an API key, at a
        fraction of a cent per row. OpenClay is the thin layer between those two facts: it turns your
        spreadsheet into per-row prompts, runs them against a model you choose, and writes the
        answers back into new columns. You pay the model provider directly. There is no platform fee,
        and there never will be.
      </P>

      <H2>How it&apos;s funded</H2>
      <P>
        It isn&apos;t, and that&apos;s deliberate. There is no company, no billing, no accounts and
        no database. You bring your own API key, so running OpenClay costs me nothing regardless of
        how many people use it — which is exactly why the free tier can be honest rather than a
        funnel.
      </P>
      <UL>
        <LI>No platform fee, no credits, no seats.</LI>
        <LI>No account, so there is no user table to monetise or leak.</LI>
        <LI>
          Your files are parsed in your browser and your API key never leaves it except to reach the
          provider you chose.
        </LI>
        <LI>
          The whole thing is{" "}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent-line underline-offset-2"
          >
            open source
          </a>
          , so none of the above has to be taken on trust.
        </LI>
      </UL>

      <H2>What it is today</H2>
      <UL>
        <LI>
          {ALL_MODELS.length} models across {CATALOG_PROVIDERS.length} providers, plus any
          OpenAI-compatible endpoint you point it at.
        </LI>
        <LI>Live web search per row, with the cost quoted before you commit.</LI>
        <LI>Token, rate-limit and data-quality reporting during a run.</LI>
        <LI>Everything client-side except a stateless proxy that logs nothing.</LI>
      </UL>
      <P>
        Several of those exist because users wrote in and asked. The reset control, the token and
        peak-throughput stats, the blank-cell counter and exponential backoff all came from one
        person&apos;s feedback about running large batches through Azure. If something is missing or
        wrong, that is the fastest way to change it.
      </P>

      {AUTHOR.work.length > 0 && (
        <>
          <H2>Elsewhere</H2>
          <UL>
            {AUTHOR.work.map(([role, where, when]) => (
              <LI key={`${role}-${where}`}>
                <strong className="font-semibold text-ink">{role}</strong>, {where}{" "}
                <span className="font-mono text-[11px] text-ink-3">{when}</span>
              </LI>
            ))}
          </UL>
        </>
      )}

      {AUTHOR.projects.length > 0 && (
        <>
          <H2>Other things I&apos;ve built</H2>
          <UL>
            {AUTHOR.projects.map(([name, url, line]) => (
              <LI key={name}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline decoration-accent-line underline-offset-2"
                >
                  {name}
                </a>{" "}
                — {line}
              </LI>
            ))}
          </UL>
        </>
      )}

      <H2>Get in touch</H2>
      <P>Happy to hear about:</P>
      <UL>
        {AUTHOR.openTo.map((item) => (
          <LI key={item}>{item}</LI>
        ))}
      </UL>
      <P>
        The fastest route is{" "}
        <a
          href={AUTHOR.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          LinkedIn
        </a>
        , or open an issue on{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          GitHub
        </a>
        . If you want to run your own copy, the{" "}
        <Link
          href="/self-host"
          className="text-accent underline decoration-accent-line underline-offset-2"
        >
          self-hosting guide
        </Link>{" "}
        is three commands long.
      </P>

      <CTA />
    </ContentPage>
  );
}
