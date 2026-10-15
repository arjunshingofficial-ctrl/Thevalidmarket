"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomepageCMSForm({ settings }: { settings: any }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const meta = settings?.hero ? JSON.parse(settings.hero) : {};

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const payload = {
      headline: formData.get("headline"),
      subheadline: formData.get("subheadline")
    };

    try {
      const res = await fetch("/api/admin/settings/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Homepage CMS</h1>
          <p className="text-slate-500 mt-1">Design and arrange the store homepage blocks.</p>
        </div>
        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 shadow-sm">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Layout"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Hero Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
                <input name="headline" type="text" className="w-full rounded-md border p-2" defaultValue={meta.headline || "Digital Products. Software. Courses. Tools. Services."} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sub-headline</label>
                <textarea name="subheadline" className="w-full rounded-md border p-2 h-20" defaultValue={meta.subheadline || "The Valid Market is a modern digital marketplace where customers can discover, purchase, and manage legally distributed digital products."} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Featured Blocks</h2>
            <p className="text-sm text-slate-500 mb-4">Select categories or products to feature on the homepage.</p>
            <div className="border border-dashed rounded-lg p-8 text-center text-slate-400">
              Future enhancement: Interactive drag-and-drop builder
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl border p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Active Blocks</h2>
            <ul className="space-y-2 text-sm font-medium text-slate-700">
              <li className="flex items-center justify-between bg-white p-3 rounded border shadow-sm cursor-move">
                Hero Banner
                <input type="checkbox" defaultChecked className="rounded text-primary" />
              </li>
              <li className="flex items-center justify-between bg-white p-3 rounded border shadow-sm cursor-move">
                Featured Categories
                <input type="checkbox" defaultChecked className="rounded text-primary" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}
