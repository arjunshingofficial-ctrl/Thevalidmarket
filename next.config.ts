import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dvtmzispblbufuzoimkk.supabase.co",
        pathname: "/storage/v1/object/public/asia-d-market/**",
      },
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. (Fixes Vercel build crashes caused by WP scripts)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
