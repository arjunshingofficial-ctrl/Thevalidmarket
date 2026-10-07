import { FileSearch, CheckCircle2, RefreshCw, Save } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminRobots() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /cart/
Disallow: /dashboard/

Sitemap: https://asiadmarket.com/sitemap.xml`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Robots.txt & Crawl Control</h1>
          <p className="text-slate-500 mt-1">Configure search engine crawler rules and index permissions</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Robots.txt
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-emerald-600" /> Active Robots.txt Configuration
          </label>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Valid Syntax
          </span>
        </div>
        <textarea
          rows={10}
          defaultValue={robotsTxt}
          className="w-full font-mono text-sm bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <p className="text-xs text-slate-500">
          This file is dynamically served at <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">/robots.txt</code>.
        </p>
      </div>
    </div>
  );
}
