import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";
import { Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GlobalSEOPage() {
  await requireAdmin("Settings", "Manage");

  let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Global SEO</h1>
          <p className="text-slate-500 mt-1">Manage global meta tags, schema, and robots configurations.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 shadow-sm">
          <Save className="h-4 w-4" /> Save Settings
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <form className="space-y-6 max-w-3xl">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700">Site Name</label>
              <input type="text" className="w-full rounded-md border p-2" defaultValue={settings.siteName || "Asia D Market"} />
            </div>
            <div className="space-y-2 text-sm">
              <label className="font-medium text-slate-700">Twitter Handle</label>
              <input type="text" className="w-full rounded-md border p-2" defaultValue={"@AsiaDMarket"} />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <label className="font-medium text-slate-700">Site Description (Meta)</label>
            <textarea className="w-full rounded-md border p-2 h-24" defaultValue={settings.siteDescription || "Digital Products. Software. Courses. Tools. Services."} />
          </div>

          <div className="space-y-2 text-sm">
            <label className="font-medium text-slate-700">Default Open Graph Image URL</label>
            <input type="url" className="w-full rounded-md border p-2" defaultValue={settings.defaultOgImage || "https://example.com/og-image.jpg"} />
          </div>

          <div className="space-y-2 text-sm">
            <label className="font-medium text-slate-700">Organization JSON-LD Schema</label>
            <textarea className="w-full rounded-md border p-2 font-mono text-xs h-40" defaultValue={'{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Asia D Market",\n  "url": "https://asiadmarket.com"\n}'} />
          </div>

        </form>
      </div>
    </div>
  );
}
