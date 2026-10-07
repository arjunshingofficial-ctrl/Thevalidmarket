import { Settings, Save, Globe, Shield, CreditCard, Mail, Bell } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateTelegramUrl } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  let telegramUrl = "";
  if (settings?.footerConfig) {
    try { telegramUrl = JSON.parse(settings.footerConfig).telegramUrl || ""; } catch(e) {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-1">General store preferences, SEO identity, branding, and global rules</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">General Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
              <input type="text" defaultValue="Asia D Market" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
              <input type="email" defaultValue="support@asiadmarket.com" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Currency & Default Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Store Currency</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                <option value="USD">USD ($) - US Dollar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Order Status for Mobile Banking</label>
              <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                <option value="COMPLETED">COMPLETED (Instant Instant License Delivery)</option>
                <option value="PROCESSING">PROCESSING (Manual Verification)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <form action={updateTelegramUrl} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Social Links & Community</h2>
          <p className="text-xs text-slate-500 mt-1">Manage external community links like your Telegram group.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram Group Link</label>
              <input 
                type="url" 
                name="telegramUrl"
                defaultValue={telegramUrl}
                placeholder="https://t.me/yourgroup"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0088cc]" 
              />
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button type="submit" className="px-4 py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" /> Save Community Link
          </button>
        </div>
      </form>
    </div>
  );
}
