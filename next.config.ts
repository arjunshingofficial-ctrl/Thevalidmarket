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
};

export default nextConfig;
