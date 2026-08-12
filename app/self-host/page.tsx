import type { Metadata } from "next";
import { pageMetadata, howToJsonLd, REPO_URL } from "@/lib/seo";
import { ContentPage, H2, H3, P, UL, LI, Pre, Code, CTA } from "@/app/components/ContentPage";

export const metadata: Metadata = pageMetadata({
  title: "Self-host OpenClay — clone, run and deploy in minutes",
  description:
    "Run OpenClay locally or deploy your own instance to Vercel. No database, no environment variables, no accounts. Clone the repo, npm install, npm run dev.",
  path: "/self-host",
  keywords: [
    "self-host data enrichment",
    "open source enrichment tool",
    "deploy OpenClay",
    "run Clay alternative locally",
    "self hosted AI enrichment",
    "Next.js enrichment tool",
  ],
});

const STEPS = [
  { name: "Clone the repository", text: "git clone the repo and change into the directory." },
  { name: "Install dependencies", text: "Run npm install. There are no native modules to build." },
  { name: "Start the dev server", text: "Run npm run dev and open localhost:3000." },
  { name: "Add your API key in the UI", text: "Keys are entered in the browser, not in environment variables." },
];

export default function SelfHostPage() {
  return (
    <ContentPage
      title="Self-host OpenClay"
      lede="There is no database, no environment file and no account system, so running your own copy is genuinely a three-command job. This page covers local development, deploying to Vercel, and what to change if you fork it."
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Self-host", path: "/self-host" },
      ]}
      jsonLd={[
        howToJsonLd({
          name: "Self-host OpenClay",
          description: "Clone, install and run your own OpenClay instance locally or on Vercel.",
          steps: STEPS,
        }),
      ]}
    >
      <H2>Run it locally</H2>
      <Pre>{`git clone ${REPO_URL}.git
cd Altclay
npm install
npm run dev`}</Pre>
      <P>
        Open <Code>http://localhost:3000</Code>. That is the whole setup — no <Code>.env</Code> to
        fill in, because API keys are entered in the browser at run time and never read from the
        environment.
      </P>

      <H3>Requirements</H3>
      <UL>
        <LI>Node.js 20 or newer.</LI>
        <LI>An API key from OpenAI, Google, Anthropic or xAI — whichever you want to enrich with.</LI>
        <LI>Nothing else. No Postgres, no Redis, no queue, no object storage.</LI>
      </UL>

      <H2>Deploy your own instance</H2>
      <P>
        The project is a stock Next.js App Router app and deploys to Vercel&apos;s free tier without
        configuration. Fork the repo, import it in Vercel, and deploy — there are no environment
        variables to set.
      </P>
      <Pre>{`# or from the CLI
npm i -g vercel
vercel`}</Pre>
      <P>
        It will run just as happily on Netlify, Cloudflare Pages, Render, Fly or a plain Node server
        via <Code>npm run build && npm start</Code>. The only server-side work is two stateless API
        routes that forward a request to the model provider.
      </P>

      <H2>How it is put together</H2>
      <UL>
        <LI>
          <Code>app/tool/page.tsx</Code> — the enrichment UI and run loop.
        </LI>
        <LI>
          <Code>lib/pricing.ts</Code> — the model catalog. Add a model here and the picker, cost
          estimator, comparison pages and SEO copy all pick it up.
        </LI>
        <LI>
          <Code>lib/enrichClient.ts</Code> — the retry loop, with jittered exponential backoff.
        </LI>
        <LI>
          <Code>lib/promptTemplates.ts</Code> — builds the per-row prompt and validates custom
          templates.
        </LI>
        <LI>
          <Code>app/api/enrich/route.ts</Code> — the proxy. It logs nothing and stores nothing.
        </LI>
      </UL>

      <H3>Why a proxy exists at all</H3>
      <P>
        Browsers block direct cross-origin calls to these provider APIs, so the request has to pass
        through a same-origin endpoint. That route forwards the key and returns the response — it
        does not read, log or persist the body. If you are self-hosting, the key never leaves
        infrastructure you control.
      </P>

      <H2>Common changes when forking</H2>
      <UL>
        <LI>
          <strong className="font-semibold text-ink">Add a model:</strong> append a{" "}
          <Code>ModelConfig</Code> to the right array in <Code>lib/pricing.ts</Code>. Set its{" "}
          <Code>tier</Code> to control whether it shows before &ldquo;show all&rdquo;.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">Add a provider:</strong> extend the{" "}
          <Code>Provider</Code> union in <Code>lib/types.ts</Code>, add an entry to{" "}
          <Code>PROVIDER_META</Code>, and add a branch in both API routes.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">Change the theme:</strong> every colour is a CSS
          variable at the top of <Code>app/globals.css</Code>, defined once for light and once for
          dark.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">Raise the file limit:</strong>{" "}
          <Code>MAX_FILE_BYTES</Code> in <Code>app/tool/page.tsx</Code>. Parsing is client-side, so
          the ceiling is the browser&apos;s memory, not a server limit.
        </LI>
      </UL>

      <H2>Privacy properties you inherit</H2>
      <UL>
        <LI>No database, so there is nothing to breach.</LI>
        <LI>No cookies and no analytics beyond anonymous page views, which you can remove.</LI>
        <LI>API keys live in React state and are never persisted.</LI>
        <LI>
          Session recovery stores your in-progress work in <Code>localStorage</Code> on your own
          device so a reload doesn&apos;t lose a run. The key is never part of it.
        </LI>
      </UL>

      <CTA label="Or just use the hosted version" />
    </ContentPage>
  );
}
