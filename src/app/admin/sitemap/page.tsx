import { FileCode, RefreshCw, CheckCircle2, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminSitemap() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dynamic XML Sitemap Manager</h1>
          <p className="text-slate-500 mt-1">Automated XML sitemap generation for Google & Bing Search Console</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Regenerate XML Sitemap
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-slate-900">Sitemap URL</h2>
              <a href="/sitemap.xml" target="_blank" className="text-xs text-emerald-600 hover:underline">
                https://www.thevalidmarket.com/sitemap.xml
              </a>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Generated
          </span>
        </div>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-slate-500">Total Indexed URLs</span>
            <p className="text-xl font-bold text-slate-900 mt-1">42 Pages</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-slate-500">Products Included</span>
            <p className="text-xl font-bold text-slate-900 mt-1">28 Products</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-slate-500">Blog Posts Included</span>
            <p className="text-xl font-bold text-slate-900 mt-1">8 Articles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
