import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";
import GlobalSeoForm from "./GlobalSeoForm";

export const dynamic = "force-dynamic";

export default async function GlobalSEOPage() {
  await requireAdmin("Settings", "Manage");

  let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
  }

  let twitterHandle = "@AsiaDMarket";
  if (settings.footerConfig) {
    try {
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.twitterHandle) twitterHandle = parsed.twitterHandle;
    } catch {}
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://asiadmarket.com";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Global SEO</h1>
          <p className="text-slate-500 mt-1">Manage global meta tags, schema, and robots configurations.</p>
        </div>
      </div>

      <GlobalSeoForm
        initialData={{
          siteName: settings.siteName || "Asia D Market",
          twitterHandle,
          siteDescription: settings.siteDescription || "",
          defaultOgImage: settings.defaultOgImage || "/og-image.jpg",
          siteUrl,
        }}
      />
    </div>
  );
}

