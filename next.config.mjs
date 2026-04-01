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
