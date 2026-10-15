import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  let telegramUrl = "https://t.me/thevalidmarket"; // Fallback URL
  if (settings?.footerConfig) {
    try { 
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.telegramUrl) telegramUrl = parsed.telegramUrl;
    } catch(e) {}
  }

  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-16rem)] flex items-center justify-center">Loading...</div>}>
      <RegisterForm telegramUrl={telegramUrl} />
    </Suspense>
  );
}
