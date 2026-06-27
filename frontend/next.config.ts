import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
    experimental: {
        createMessagesDeclaration: ["./messages/id.json", "./messages/en.json"],
    },
});

// Use wildcards for ports to allow Playwright parallel workers to connect freely.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

// Build the CSP string
let ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self' data:;
  connect-src 'self' ${apiUrl} http://localhost:* http://127.0.0.1:* http://192.168.0.4:*;
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
`;

// Only force HTTPS upgrades in actual production environments (not during local E2E tests).
if (
    process.env.VERCEL_ENV === "production" ||
    process.env.FORCE_HTTPS === "true"
) {
    ContentSecurityPolicy += " upgrade-insecure-requests;";
}

const securityHeaders = [
    {
        key: "Content-Security-Policy",
        value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
    },
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
    },
];

export default withNextIntl({
    reactCompiler: true,
    transpilePackages: ["@psb/shared"],
    experimental: {
        optimizePackageImports: ["@psb/shared", "@chakra-ui/react"],
        workerThreads: false,
        cpus: 1,
    },
    headers() {
        return [{ source: "/(.*)", headers: securityHeaders }];
    },
} satisfies NextConfig);
