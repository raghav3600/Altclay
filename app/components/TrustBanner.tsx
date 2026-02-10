"use client";

export default function TrustBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      <span className="mr-2 font-medium">&#x1F512;</span>
      {message}
    </div>
  );
}
