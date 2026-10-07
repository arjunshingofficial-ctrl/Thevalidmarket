import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import HackerHero from "@/components/home/HackerHero";

export const metadata: Metadata = {
  title: "Asia D Market - Secure Terminal",
  description: "Access premium digital products, courses, software and tools.",
  robots: {
    index: false,
    follow: false,
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
