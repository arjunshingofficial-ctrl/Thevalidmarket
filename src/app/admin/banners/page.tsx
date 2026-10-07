import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminBanners() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Banners</h1>
          <p className="text-slate-500 mt-1">Manage announcement bars, hero banners, and promotions.</p>
        </div>
        <Link href="/admin/banners/new"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Banner
        </Link>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        Banner management is configured via the <Link href="/admin/settings/homepage" className="font-medium underline">Homepage CMS</Link>.
        Custom banners (pop-ups, store promos) will be stored separately — this module is ready for your banner entries.
      </div>

      <div className="bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center py-16 text-center text-slate-400">
        <Megaphone className="h-16 w-16 text-slate-200 mb-4" />
        <p className="text-lg font-medium text-slate-900">No banners yet</p>
        <p className="text-sm mt-1 mb-4">Create your first promotional banner</p>
        <Link href="/admin/banners/new"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
          + Add Banner
        </Link>
      </div>
    </div>
  );
}
