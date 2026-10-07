import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  let telegramUrl = "https://t.me/asiadmarket"; // Fallback URL so the button always shows
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
