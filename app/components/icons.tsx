import type { Provider } from "@/lib/types";

/* ------------------------------------------------------------------ *
 *  Provider marks
 *
 *  Simplified glyphs used to identify which provider a model belongs to.
 *  They inherit currentColor so they work on either theme. These are
 *  identification marks only, each provider's own brand assets should be
 *  used if OpenClay ever needs to represent them officially.
 * ------------------------------------------------------------------ */

function AnthropicMark({ className = "" }: { className?: string }) {
  // Radiating strokes, after the Claude sunburst.
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <path d="M12 3.2v5" />
        <path d="M12 15.8v5" />
        <path d="M3.2 12h5" />
        <path d="M15.8 12h5" />
        <path d="M5.8 5.8l3.5 3.5" />
        <path d="M14.7 14.7l3.5 3.5" />
        <path d="M18.2 5.8l-3.5 3.5" />
        <path d="M9.3 14.7l-3.5 3.5" />
      </g>
    </svg>
  );
}

function GeminiMark({ className = "" }: { className?: string }) {
  // Four-pointed star with concave sides.
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2c.35 4.2 1.9 6.9 4.5 8.2 1.2.6 2.7 1 4.5 1.3v1c-4.2.35-6.9 1.9-8.2 4.5-.6 1.2-1 2.7-1.3 4.5h-1c-.35-4.2-1.9-6.9-4.5-8.2-1.2-.6-2.7-1-4.5-1.3v-1c4.2-.35 6.9-1.9 8.2-4.5.6-1.2 1-2.7 1.3-4.5h1z" />
    </svg>
  );
}

function XaiMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
        <path d="M4.5 4.5l15 15" />
        <path d="M19.5 4.5l-15 15" />
      </g>
    </svg>
  );
}

function OpenAiMark({ className = "" }: { className?: string }) {
  // Six-fold interlocking knot, after the OpenAI mark.
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.4 7.1 9.2v5.6L12 17.6l4.9-2.8V9.2L12 6.4Z" />
        <path d="M12 6.4V3.2M16.9 9.2l2.8-1.6M16.9 14.8l2.8 1.6M12 17.6v3.2M7.1 14.8l-2.8 1.6M7.1 9.2 4.3 7.6" />
      </g>
    </svg>
  );
}

export function ProviderLogo({
  provider,
  className = "h-4 w-4",
}: {
  provider: Provider;
  className?: string;
}) {
  if (provider === "anthropic") return <AnthropicMark className={className} />;
  if (provider === "gemini") return <GeminiMark className={className} />;
  if (provider === "openai") return <OpenAiMark className={className} />;
  return <XaiMark className={className} />;
}

/* ------------------------------------------------------------------ *
 *  UI icons, 1.75px strokes to sit alongside hairline rules
 * ------------------------------------------------------------------ */

type IconProps = { className?: string };

function Icon({ className = "h-4 w-4", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icon>
);

export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 018 0v3.5" />
  </Icon>
);

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
    <path d="M4 16v2.5A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5V16" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v12m0 0l-4.5-4.5M12 16l4.5-4.5" />
    <path d="M4 18.5v.5A1 1 0 005 20h14a1 1 0 001-1v-.5" />
  </Icon>
);

export const RefreshIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 11a8 8 0 10-2.5 5.8" />
    <path d="M20 4.5V11h-6" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7" />
    <path d="M6.5 7l.8 12A1.5 1.5 0 008.8 20.5h6.4a1.5 1.5 0 001.5-1.5L17.5 7" />
  </Icon>
);

export const GlobeIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5z" />
  </Icon>
);

export const InfoIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <path d="M12 7.75v.5" />
  </Icon>
);

export const AlertIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4.5l8.5 15h-17l8.5-15z" />
    <path d="M12 10v4" />
    <path d="M12 17v.5" />
  </Icon>
);

export const PauseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 5.5v13M14.5 5.5v13" />
  </Icon>
);

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7.5 5.2l11 6.8-11 6.8V5.2z" />
  </Icon>
);

export const StopIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </Icon>
);

export const LinkedInIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export const GitHubIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 007.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 015.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.42.36.79 1.06.79 2.14v3.17c0 .31.2.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.73 18.27.5 12 .5z" />
  </svg>
);
