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
        {children}
      </body>
    </html>
  );
}
