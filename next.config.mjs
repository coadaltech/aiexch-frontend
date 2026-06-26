/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevents clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevents MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Forces HTTPS
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Stops referrer leaking across origins
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restricts browser features
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content-Security-Policy — the backstop against in-page XSS (the one
          // residual risk DPoP doesn't cover: a script running on our own origin
          // can USE the key in real time, though it still can't steal it).
          //
          // Shipped in REPORT-ONLY mode: it NEVER blocks anything, it only logs
          // violations to the browser console (and to `report-uri` if you add a
          // collector). Watch the console across the app — login, casino game
          // launches (Ace/QTech iframes), image CDNs — note every blocked source,
          // add the missing hosts below, THEN switch the key to
          // "Content-Security-Policy" to enforce.
          //
          // NOTE: `script-src` still allows 'unsafe-inline'/'unsafe-eval' because
          // Next.js injects inline bootstrap scripts. To get real XSS protection
          // from script-src you must move to a nonce-based policy (middleware that
          // injects a per-request nonce) — a follow-up beyond this scaffold.
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'self'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              // API calls (api.<whitelabel>) + websockets. Tighten to your exact
              // API hosts once the report log confirms them.
              "connect-src 'self' https: wss:",
              // Casino game providers launch in iframes over https.
              "frame-src 'self' https:",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: "/admin/:path*", destination: "/owner/:path*" },
      { source: "/super/:path*", destination: "/owner/:path*" },
      { source: "/master/:path*", destination: "/owner/:path*" },
      { source: "/agent/:path*", destination: "/owner/:path*" },
      { source: "/admin", destination: "/owner" },
      { source: "/super", destination: "/owner" },
      { source: "/master", destination: "/owner" },
      { source: "/agent", destination: "/owner" },
    ];
  },
  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aiexch.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "aiexch-store.s3.amazonaws.com",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
