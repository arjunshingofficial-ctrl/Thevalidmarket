"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import { updateGeneralSettings, updateTelegramUrl } from "./actions";

interface PlatformSettingsFormProps {
  initialData: {
    storeName: string;
    supportEmail: string;
    primaryCurrency: string;
    defaultOrderStatus: string;
    telegramUrl: string;
  };
}

export default function PlatformSettingsForm({ initialData }: PlatformSettingsFormProps) {
  // General Identity & Currency states
  const [storeName, setStoreName] = useState(initialData.storeName || "The Valid Market");
  const [supportEmail, setSupportEmail] = useState(initialData.supportEmail || "support@thevalidmarket.com");
  const [primaryCurrency, setPrimaryCurrency] = useState(initialData.primaryCurrency || "USD");
  const [defaultOrderStatus, setDefaultOrderStatus] = useState(initialData.defaultOrderStatus || "COMPLETED");

  // Community / Telegram states
  const [telegramUrl, setTelegramUrl] = useState(initialData.telegramUrl || "");

  // Transitions & Notices
  const [isGeneralPending, startGeneralTransition] = useTransition();
  const [isTelegramPending, startTelegramTransition] = useTransition();

  const [generalNotice, setGeneralNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [telegramNotice, setTelegramNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Handle General Settings Submit
  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralNotice(null);

    const formData = new FormData();
    formData.set("storeName", storeName);
    formData.set("supportEmail", supportEmail);
    formData.set("primaryCurrency", primaryCurrency);
    formData.set("defaultOrderStatus", defaultOrderStatus);

    startGeneralTransition(async () => {
      const result = await updateGeneralSettings(formData);
      if (result.success) {
        setGeneralNotice({
          type: "success",
          message: result.message || "Platform settings saved successfully!",
        });
        setTimeout(() => setGeneralNotice(null), 5000);
      } else {
        setGeneralNotice({
          type: "error",
          message: result.message || "Failed to save platform settings.",
        });
      }
    });
  };

  // Handle Telegram Link Submit
  const handleTelegramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTelegramNotice(null);

    const formData = new FormData();
    formData.set("telegramUrl", telegramUrl);

    startTelegramTransition(async () => {
      const result = await updateTelegramUrl(formData);
      if (result.success) {
        setTelegramNotice({
          type: "success",
          message: result.message || "Community link updated successfully!",
        });
        setTimeout(() => setTelegramNotice(null), 5000);
      } else {
        setTelegramNotice({
          type: "error",
          message: result.message || "Failed to update community link.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* General Settings Form */}
      <form 
        onSubmit={handleGeneralSubmit} 
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 transition-all"
      >
        {generalNotice && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition-all animate-in fade-in slide-in-from-top-1 ${
              generalNotice.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {generalNotice.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="leading-relaxed">{generalNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setGeneralNotice(null)}
              className="text-slate-400 hover:text-slate-700 ml-3 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-slate-900">General Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name</label>
              <input 
                type="text" 
                name="storeName" 
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="The Valid Market"
                disabled={isGeneralPending}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:opacity-60 disabled:bg-slate-50" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
              <input 
                type="email" 
                name="supportEmail" 
                value={supportEmail} 
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@thevalidmarket.com"
                disabled={isGeneralPending}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:opacity-60 disabled:bg-slate-50" 
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Currency & Default Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Store Currency</label>
              <select 
                name="primaryCurrency" 
                value={primaryCurrency}
                onChange={(e) => setPrimaryCurrency(e.target.value)}
                disabled={isGeneralPending}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:opacity-60 disabled:bg-slate-50"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Order Status for Mobile Banking</label>
              <select 
                name="defaultOrderStatus" 
                value={defaultOrderStatus}
                onChange={(e) => setDefaultOrderStatus(e.target.value)}
                disabled={isGeneralPending}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors disabled:opacity-60 disabled:bg-slate-50"
              >
                <option value="COMPLETED">COMPLETED (Instant Instant License Delivery)</option>
                <option value="PROCESSING">PROCESSING (Manual Verification)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button 
            type="submit" 
            disabled={isGeneralPending}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            {isGeneralPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Social Links & Community Form */}
      <form 
        onSubmit={handleTelegramSubmit} 
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 transition-all"
      >
        {telegramNotice && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition-all animate-in fade-in slide-in-from-top-1 ${
              telegramNotice.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {telegramNotice.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="leading-relaxed">{telegramNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setTelegramNotice(null)}
              className="text-slate-400 hover:text-slate-700 ml-3 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-slate-900">Social Links & Community</h2>
          <p className="text-xs text-slate-500 mt-1">Manage external community links like your Telegram group.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram Group Link</label>
              <input 
                type="url" 
                name="telegramUrl"
                value={telegramUrl}
                onChange={(e) => setTelegramUrl(e.target.value)}
                placeholder="https://t.me/yourgroup"
                disabled={isTelegramPending}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] focus:border-[#0088cc] outline-none transition-colors disabled:opacity-60 disabled:bg-slate-50" 
              />
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button 
            type="submit" 
            disabled={isTelegramPending}
            className="px-5 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] disabled:bg-[#0088cc]/60 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            {isTelegramPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving Link...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Save Community Link</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
