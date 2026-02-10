"use client";

interface LandingHeroProps {
  onGetStarted: () => void;
}

export default function LandingHero({ onGetStarted }: LandingHeroProps) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        FreeClay
      </h1>
      <p className="mt-4 max-w-2xl text-xl text-gray-600">
        The free, open-source alternative to Clay.
        <br />
        Enrich any spreadsheet with AI. Bring your own API key. Pay only for
        what you use.
      </p>
      <button
        onClick={onGetStarted}
        className="mt-8 rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Get Started — It&apos;s Free
      </button>
      <p className="mt-6 text-sm text-gray-500">
        No accounts. No data storage. No tracking. 100% open source.
      </p>

      <div className="mt-16 w-full max-w-3xl">
        <h2 className="mb-6 text-lg font-semibold text-gray-700">
          How Your Data Flows
        </h2>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            Your Browser
          </div>
          <span className="text-gray-400">&rarr;</span>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            AI API Provider
          </div>
          <span className="text-gray-400">&rarr;</span>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            Your Browser
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          That&apos;s it. Nothing touches our servers.
        </p>
      </div>
    </div>
  );
}
