/** @type {import('next').NextConfig} */
const nextConfig = {
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
