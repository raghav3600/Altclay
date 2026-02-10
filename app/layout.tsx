import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeClay — Free, Open-Source Clay Alternative",
  description:
    "Enrich any spreadsheet with AI. Bring your own API key. Pay only for what you use. No accounts, no data storage, no tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t border-gray-100 px-4 py-6 text-center text-xs text-gray-400">
            <p>
              FreeClay is 100% open source. No accounts. No tracking. No data
              storage. Your API key and data exist only in your browser session.
            </p>
            <p className="mt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 underline"
              >
                View Source Code on GitHub
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
