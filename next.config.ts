import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 2592000, // 30 days caching for optimized images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "dvtmzispblbufuzoimkk.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@tiptap/react"],
    serverActions: {
      allowedOrigins: [
        "thevalidmarket.com",
        "www.thevalidmarket.com",
        "*.thevalidmarket.com",
        "*.vercel.app",
        "localhost:3000",
      ],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
