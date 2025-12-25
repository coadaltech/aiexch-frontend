/** @type {import('next').NextConfig} */
const nextConfig = {
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
