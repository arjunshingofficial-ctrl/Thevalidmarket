import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import HackerHero from "@/components/home/HackerHero";

export const metadata: Metadata = {
  title: "The Valid Market | Premium Digital Products, Tools & Software Marketplace",
  description: "Explore The Valid Market: The premier digital marketplace for premium tools, verified software licenses, expert courses, proxies, and digital assets with instant delivery.",
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
};

export default async function AuthLandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/store");
  }

  return (
    <main className="bg-black min-h-screen">
      <HackerHero />
    </main>
  );
}
