import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ContentPage, H2, H3, P, UL, LI, Pre, Code, CTA } from "@/app/components/ContentPage";

export const metadata: Metadata = pageMetadata({
  title: "Use Azure, OpenRouter, Groq or a local model",
  description:
    "Point OpenClay at any OpenAI-compatible endpoint: Azure OpenAI, OpenRouter, Groq, Together, Fireworks, vLLM, Ollama or LM Studio. Base URL, model ID, done.",
  path: "/docs/custom-endpoint",
  keywords: [
    "Azure OpenAI enrichment",
    "OpenRouter spreadsheet enrichment",
    "Groq data enrichment",
    "Ollama spreadsheet",
    "local LLM enrichment",
    "OpenAI compatible endpoint",
    "self hosted LLM enrichment",
  ],
});

const GATEWAYS: [string, string, string][] = [
  ["Azure OpenAI", "https://YOUR-RESOURCE.openai.azure.com/openai/v1", "Your deployment name is the model ID"],
  ["OpenRouter", "https://openrouter.ai/api/v1", "One key, hundreds of models"],
  ["Groq", "https://api.groq.com/openai/v1", "Very fast inference on open models"],
  ["Together", "https://api.together.xyz/v1", "Open-weight models at low cost"],
  ["Fireworks", "https://api.fireworks.ai/inference/v1", "Open models, fast"],
  ["DeepInfra", "https://api.deepinfra.com/v1/openai", "Cheap open-weight hosting"],
  ["Ollama", "http://localhost:11434/v1", "Local models, self-host only"],
  ["LM Studio", "http://localhost:1234/v1", "Local models, self-host only"],
  ["vLLM", "http://your-server:8000/v1", "Your own GPU server"],
];

export default function CustomEndpointPage() {
  return (
    <ContentPage
      title="Use any OpenAI-compatible endpoint"
      lede="Pick the Custom provider, paste a base URL and a model ID, and OpenClay talks to it exactly like a built-in provider. One adapter covers Azure, the aggregators, and anything you run yourself."
      crumbs={[
        { name: "Home", path: "/" },
        { name: "Docs", path: "/docs/custom-endpoint" },
        { name: "Custom endpoint", path: "/docs/custom-endpoint" },
      ]}
    >
      <H2>Why one adapter covers so much</H2>
      <P>
        Practically every inference provider implements OpenAI&apos;s{" "}
        <Code>/v1/chat/completions</Code> shape, because that is what most client libraries expect.
        So rather than writing an integration per vendor, OpenClay speaks that one dialect and lets
        you name the host.
      </P>

      <div className="thin-scroll mt-5 overflow-x-auto rounded border border-line">
        <table className="min-w-full border-collapse text-[12px]">
          <thead className="bg-surface-2">
            <tr>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Provider</th>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Base URL</th>
              <th className="border-b border-line px-3 py-2 text-left font-medium text-ink-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {GATEWAYS.map(([name, url, note]) => (
              <tr key={name} className="border-b border-line last:border-0">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">{name}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-ink-2">{url}</td>
                <td className="px-3 py-2 text-ink-2">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Setting it up</H2>
      <UL>
        <LI>
          In step 3, choose <strong className="font-semibold text-ink">Custom</strong>.
        </LI>
        <LI>
          Paste the base URL. Ending it at <Code>/v1</Code> is enough — OpenClay appends{" "}
          <Code>/chat/completions</Code>. Pasting the full path works too.
        </LI>
        <LI>Enter the model ID exactly as your provider names it.</LI>
        <LI>
          Optionally enter the token prices so cost estimates work. Leave them at zero and OpenClay
          reports token counts without inventing a price.
        </LI>
        <LI>Add your key in step 4, or leave it blank for a local gateway that needs none.</LI>
      </UL>

      <H3>Azure OpenAI</H3>
      <P>
        Azure names things differently: your <em>deployment name</em> is the model ID, and the key
        goes in an <Code>api-key</Code> header rather than <Code>Authorization</Code>. OpenClay sends
        both headers, so either convention works without configuration.
      </P>
      <Pre>{`Base URL:  https://my-resource.openai.azure.com/openai/v1
Model ID:  my-gpt5-deployment`}</Pre>
      <P>
        Azure throttles on tokens-per-minute rather than requests, which is exactly what the run
        panel&apos;s peak-TPM figure is for. Size your quota against the peak, not the average — the
        average hides the bursts that actually trigger a 429.
      </P>

      <H2>Web search</H2>
      <P>
        Most OpenAI-compatible gateways do not implement a server-side search tool, so the custom
        provider does not send one. Your prompts still run, but answers come from the model&apos;s
        training data rather than the live web — which for research-style enrichment is a real
        limitation, not a detail. Use a built-in provider when freshness matters.
      </P>

      <H2>Local models and the private-address rule</H2>
      <P>
        The hosted instance at openclay.io refuses base URLs on loopback, private or link-local
        addresses. That is not an arbitrary restriction: the proxy runs on our server, so{" "}
        <Code>localhost</Code> would mean <em>our</em> localhost, and a URL like{" "}
        <Code>http://169.254.169.254/</Code> would let a visitor read cloud metadata through us.
      </P>
      <P>
        On your own machine the same reasoning inverts — localhost means your Ollama — so
        self-hosted installs can opt in:
      </P>
      <Pre>{`# .env.local
OPENCLAY_ALLOW_PRIVATE_ENDPOINTS=true`}</Pre>
      <P>
        Only set this on an instance you control and that is not exposed to the public internet.
      </P>

      <H2>Troubleshooting</H2>
      <UL>
        <LI>
          <strong className="font-semibold text-ink">404 on validate:</strong> the model ID is wrong,
          or the base URL already included <Code>/chat/completions</Code> twice.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">401:</strong> wrong key, or Azure expecting the
          deployment rather than the base model name.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">Empty responses:</strong> some gateways ignore{" "}
          <Code>response_format: json_object</Code>. Add &ldquo;Return ONLY valid JSON&rdquo; to your
          prompt in the advanced template editor.
        </LI>
        <LI>
          <strong className="font-semibold text-ink">Refused private address:</strong> expected on the
          hosted instance — self-host and set the environment variable above.
        </LI>
      </UL>

      <CTA label="Set up a custom endpoint" />
    </ContentPage>
  );
}
