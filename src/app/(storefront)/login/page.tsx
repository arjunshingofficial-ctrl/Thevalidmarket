import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | The Valid Market",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function LoginPage() {
  const t0 = performance.now();
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  const t1 = performance.now();
  console.log(`[Perf] /login settings query took ${(t1 - t0).toFixed(2)}ms`);

  let telegramUrl = "https://t.me/thevalidmarket"; // Fallback URL so the button always shows
  if (settings?.footerConfig) {
    try { 
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.telegramUrl) telegramUrl = parsed.telegramUrl;
    } catch(e) {}
  }

  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">Loading...</div>}>
      <LoginForm telegramUrl={telegramUrl} />
    </Suspense>
  );
}
