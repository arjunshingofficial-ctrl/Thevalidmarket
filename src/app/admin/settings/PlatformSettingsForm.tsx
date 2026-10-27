"use client";

import { useState, useTransition } from "react";
import { Save, CheckCircle2, AlertCircle, Loader2, Send, MessageCircle, Eye, EyeOff } from "lucide-react";
import { updateGeneralSettings, updateSupportChannels } from "./actions";

interface PlatformSettingsFormProps {
  initialData: {
    storeName: string;
    supportEmail: string;
    primaryCurrency: string;
    defaultOrderStatus: string;
    telegramUrl: string;
    telegramActive?: boolean;
    whatsappUrl?: string;
    whatsappActive?: boolean;
  };
}

export default function PlatformSettingsForm({ initialData }: PlatformSettingsFormProps) {
  // General Identity & Currency states
  const [storeName, setStoreName] = useState(initialData.storeName || "The Valid Market");
  const [supportEmail, setSupportEmail] = useState(initialData.supportEmail || "support@thevalidmarket.com");
  const [primaryCurrency, setPrimaryCurrency] = useState(initialData.primaryCurrency || "USD");
  const [defaultOrderStatus, setDefaultOrderStatus] = useState(initialData.defaultOrderStatus || "COMPLETED");

  // Support & Direct Channels states
  const [telegramUrl, setTelegramUrl] = useState(initialData.telegramUrl || "");
  const [telegramActive, setTelegramActive] = useState(initialData.telegramActive ?? true);
  const [whatsappUrl, setWhatsappUrl] = useState(initialData.whatsappUrl || "");
  const [whatsappActive, setWhatsappActive] = useState(initialData.whatsappActive ?? true);

  // Transitions & Notices
  const [isGeneralPending, startGeneralTransition] = useTransition();
  const [isSupportPending, startSupportTransition] = useTransition();

  const [generalNotice, setGeneralNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [supportNotice, setSupportNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  // Handle Support Channels Submit
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportNotice(null);

    const formData = new FormData();
    formData.set("telegramUrl", telegramUrl);
    formData.set("telegramActive", telegramActive ? "true" : "false");
    formData.set("whatsappUrl", whatsappUrl);
    formData.set("whatsappActive", whatsappActive ? "true" : "false");

    startSupportTransition(async () => {
      const result = await updateSupportChannels(formData);
      if (result.success) {
        setSupportNotice({
          type: "success",
          message: result.message || "Support channels saved successfully!",
        });
        setTimeout(() => setSupportNotice(null), 5000);
      } else {
        setSupportNotice({
          type: "error",
          message: result.message || "Failed to update support channels.",
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

      {/* Support Channels (Telegram & WhatsApp) Form */}
      <form 
        onSubmit={handleSupportSubmit} 
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 transition-all"
      >
        {supportNotice && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm transition-all animate-in fade-in slide-in-from-top-1 ${
              supportNotice.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {supportNotice.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span className="leading-relaxed">{supportNotice.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSupportNotice(null)}
              className="text-slate-400 hover:text-slate-700 ml-3 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>Support Channels &amp; Direct Messaging</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure official Telegram and WhatsApp support links and control their visual visibility across the Contact page and storefront.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* ── Telegram Support Channel ── */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center font-bold">
                    <Send className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Telegram Support &amp; VIP Group</h3>
                    <p className="text-[11px] text-slate-500">Official Group, Channel or Support Desk</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={telegramActive}
                    onChange={(e) => setTelegramActive(e.target.checked)}
                    className="sr-only peer"
                    disabled={isSupportPending}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0088cc]"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telegram Group / Support Link or Username
                </label>
                <input 
                  type="text" 
                  name="telegramUrl"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  placeholder="https://t.me/+xpN22t7nSkk4ZWJl or @username"
                  disabled={isSupportPending}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0088cc] focus:border-[#0088cc] outline-none transition-colors disabled:opacity-60 disabled:bg-slate-50 bg-white" 
                />
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  ⚡ When updated here, every page, footer, floating button, and login/register support link across the website updates immediately.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px]">Public Visibility:</span>
                {telegramActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Eye className="w-3 h-3 text-emerald-600" /> Visual &amp; Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    <EyeOff className="w-3 h-3 text-slate-400" /> Hidden / Not Visual
                  </span>
                )}
              </div>
            </div>

            {/* ── WhatsApp Support Channel ── */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center font-bold">
                    <MessageCircle className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">WhatsApp Support</h3>
                    <p className="text-[11px] text-slate-500">Live Support Chat Number or Link</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={whatsappActive}
                    onChange={(e) => setWhatsappActive(e.target.checked)}
                    className="sr-only peer"
                    disabled={isSupportPending}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Link or Phone Number
                </label>
                <input 
                  type="text" 
                  name="whatsappUrl"
                  value={whatsappUrl}
                  onChange={(e) => setWhatsappUrl(e.target.value)}
                  placeholder="https://wa.me/1234567890 or +1234567890"
                  disabled={isSupportPending}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] outline-none transition-colors disabled:opacity-60 disabled:bg-slate-50 bg-white" 
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px]">Public Visibility:</span>
                {whatsappActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Eye className="w-3 h-3 text-emerald-600" /> Visual &amp; Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                    <EyeOff className="w-3 h-3 text-slate-400" /> Hidden / Not Visual
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button 
            type="submit" 
            disabled={isSupportPending}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSupportPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Saving Channels...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Support Channels</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
