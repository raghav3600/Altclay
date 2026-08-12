import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle with only the modules actually
  // imported, which is what keeps the Docker image small. Harmless on Vercel.
  output: "standalone",

  // Nothing here is user-generated HTML, but these cost nothing and close off
  // the usual clickjacking / MIME-sniffing / referrer-leak classes.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // The proxy handles API keys. Nothing about it should ever be cached.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
