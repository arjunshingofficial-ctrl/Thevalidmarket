"use client";

import { useEffect, useState } from "react";
import { Send, MessageCircle, X, ChevronUp, Sparkles, ShieldCheck } from "lucide-react";

export function FloatingSupportButton({ initialTelegramUrl }: { initialTelegramUrl?: string }) {
  const [telegramUrl, setTelegramUrl] = useState(initialTelegramUrl || "https://t.me/+xpN22t7nSkk4ZWJl");
  const [telegramActive, setTelegramActive] = useState(true);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    fetch("/api/support/channels")
      .then((res) => res.json())
      .then((data) => {
        if (data.telegramUrl) setTelegramUrl(data.telegramUrl);
        if (data.telegramActive !== undefined) setTelegramActive(data.telegramActive);
        if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
        if (data.whatsappActive !== undefined) setWhatsappActive(data.whatsappActive);
      })
      .catch(() => {});
  }, []);

  // Hide tooltip after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!telegramActive && !whatsappActive) return null;

  const formattedWhatsAppUrl = (() => {
    if (!whatsappUrl) return "";
    const trimmed = whatsappUrl.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    const digits = trimmed.replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  })();

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 print:hidden select-none">
      {/* ─ Tooltip Bubble (Auto-fading or on hover) ─ */}
      {showTooltip && !isOpen && (
        <div className="animate-bounce bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border border-slate-700/80 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Need Help? Telegram Support</span>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-slate-400 hover:text-white ml-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ─ Multi-channel expanded menu (if WhatsApp also active or opened) ─ */}
      {isOpen && (
        <div className="bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 w-64 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-900">24/7 Official Support</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {telegramActive && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/15 text-[#0088cc] border border-[#0088cc]/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Send className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">Telegram Group &amp; Support</p>
                <p className="text-[10px] text-slate-500 truncate">Instant reply &bull; Active channel</p>
              </div>
            </a>
          )}

          {whatsappActive && formattedWhatsAppUrl && (
            <a
              href={formattedWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 leading-tight">WhatsApp Support</p>
                <p className="text-[10px] text-slate-500 truncate">Direct billing &amp; inquiries</p>
              </div>
            </a>
          )}
        </div>
      )}

      {/* ─ Main Floating Button ─ */}
      <div className="flex items-center gap-2">
        {whatsappActive ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#0088cc] to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center border-2 border-white focus:outline-none focus:ring-4 focus:ring-primary/20 relative"
            title="Open Live Support Channels"
          >
            <Send className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white"></span>
          </button>
        ) : (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077b3] text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all border-2 border-white focus:outline-none focus:ring-4 focus:ring-[#0088cc]/30 relative"
            title="Chat with Telegram Support"
          >
            <span className="relative flex items-center justify-center">
              <Send className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white animate-pulse"></span>
            </span>
            <span className="text-xs font-extrabold tracking-wide hidden sm:inline">
              Telegram Support
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
