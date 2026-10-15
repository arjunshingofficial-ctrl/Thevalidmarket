import { prisma } from "@/lib/prisma";
import PlatformSettingsForm from "./PlatformSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  
  let telegramUrl = "";
  let supportEmail = "support@thevalidmarket.com";
  if (settings?.footerConfig) {
    try { 
      const parsedFooter = JSON.parse(settings.footerConfig);
      if (parsedFooter.telegramUrl) telegramUrl = parsedFooter.telegramUrl;
      if (parsedFooter.supportEmail) supportEmail = parsedFooter.supportEmail;
    } catch(e) {}
  }

  let fxConfig: any = {};
  if (settings?.fxConfig) {
    try { fxConfig = JSON.parse(settings.fxConfig); } catch(e) {}
  }

  const storeName = settings?.siteName || "The Valid Market";
  const primaryCurrency = fxConfig?.primaryCurrency || "USD";
  const defaultOrderStatus = fxConfig?.defaultOrderStatus || "COMPLETED";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-1">General store preferences, SEO identity, branding, and global rules</p>
        </div>
      </div>

      <PlatformSettingsForm
        initialData={{
          storeName,
          supportEmail,
          primaryCurrency,
          defaultOrderStatus,
          telegramUrl,
        }}
      />
    </div>
  );
}
