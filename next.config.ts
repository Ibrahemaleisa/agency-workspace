import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. The CSP only sets directives that can't break
 * the app (no script/style restrictions — Next and the brand theme use inline code):
 * no framing (clickjacking), no plugins, no <base> hijacking, forms post only to this site.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "25mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Uploaded logos may be SVG: if one is opened directly, nothing in it may run.
      {
        source: "/brand-logo",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; style-src 'unsafe-inline'; sandbox" }],
      },
    ];
  },
};

export default nextConfig;
