import { Metadata } from "next";
import HackerHero from "@/components/home/HackerHero";

import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  let settings = null;
  try {
    settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  } catch (e) {
    console.error("Failed to fetch siteSettings for homepage metadata", e);
  }

  const siteName = settings?.siteName?.trim() || "The Valid Market";
  const siteDescription =
    settings?.siteDescription?.trim() ||
    "The Valid Market: Hacking Course + Proxies + CC + Money making Software, All About Carding";

  return {
    title: `${siteName} - Hacking Course + Tools + CC`,
    description: siteDescription,
    openGraph: {
      title: `${siteName} - Hacking Course + Tools + CC`,
      description: siteDescription,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} - Hacking Course + Tools + CC`,
      description: siteDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      bingbot: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
      msnbot: "index, follow",
    },
  };
}

export default async function AuthLandingPage() {
  return (
    <main className="bg-black min-h-screen">
      <HackerHero />
    </main>
  );
}
