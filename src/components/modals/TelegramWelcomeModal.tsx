"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { X, Sparkles, ShieldCheck, Zap, Gift, ExternalLink } from "lucide-react";

interface TelegramWelcomeModalProps {
  telegramUrl?: string;
}

export function TelegramWelcomeModal({
  telegramUrl = "https://t.me/+xpN22t7nSkk4ZWJl",
}: TelegramWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const isWelcomeParam =
    searchParams.get("welcome") === "telegram" ||
    searchParams.get("welcome") === "1" ||
    searchParams.get("registered") === "true";

  useEffect(() => {
    try {
      const alreadyDismissed = localStorage.getItem("tvm_telegram_welcome_dismissed") === "true";
      const isPendingFlag = localStorage.getItem("tvm_pending_telegram_welcome") === "true";

      // Show if user arrived from registration or pending flag, and hasn't seen it yet
      if ((isWelcomeParam || isPendingFlag) && !alreadyDismissed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error("Telegram modal storage error:", e);
    }
  }, [isWelcomeParam]);

  const cleanUrl = () => {
    try {
      if (typeof window !== "undefined" && window.location.search) {
        const url = new URL(window.location.href);
        url.searchParams.delete("welcome");
        url.searchParams.delete("registered");
        const cleanPath = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "");
        window.history.replaceState({}, "", cleanPath);
      }
    } catch (e) {
      console.error("Failed to clean url query params:", e);
    }
  };

  const markAsSeenAndClose = () => {
    try {
      localStorage.setItem("tvm_telegram_welcome_dismissed", "true");
      localStorage.removeItem("tvm_pending_telegram_welcome");
    } catch (e) {}
    setIsOpen(false);
    cleanUrl();
  };

  const handleJoinTelegram = () => {
    markAsSeenAndClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md sm:max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl shadow-2xl border border-blue-500/30 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top vibrant cyan-to-blue gradient accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

        {/* Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/15 blur-3xl rounded-full pointer-events-none" />

        <div className="p-6 sm:p-8 relative z-10">
          {/* Header Row: Badge & Close Button */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-500/40">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Welcome to The Valid Market</span>
            </span>

            <button
              type="button"
              onClick={markAsSeenAndClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Telegram Logo / Header Icon */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#00b4d8] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7 fill-white translate-x-[-1px] translate-y-[-1px]" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.48-.01-1.39-.27-2.07-.49-.84-.28-1.51-.42-1.45-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.66 1.76-.01 2.19-.11z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                Join Our Telegram Channel
              </h2>
              <p className="text-xs text-cyan-300/90 font-medium mt-0.5">
                Official VIP Community &amp; Direct Mentorship
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-5">
            Your account has been created successfully! Join our official Telegram channel now for real-time announcements, daily VIP free drops, verified software updates, and 24/7 direct mentor support.
          </p>

          {/* Perks / Benefits List */}
          <div className="space-y-2.5 mb-6 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <Gift className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Daily VIP Drops &amp; BINs:</strong> Exclusive daily releases only published on our Telegram channel.
              </span>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Instant Software Updates:</strong> Get notified first when tools, proxies, and course modules are updated.
              </span>
            </div>

            <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">24/7 Direct Mentor Support:</strong> Fast one-on-one VIP assistance from our senior team.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleJoinTelegram}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-[#0088cc] via-[#009bd6] to-[#00b4d8] hover:from-[#0077b5] hover:to-[#0096c7] text-white shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.48-.01-1.39-.27-2.07-.49-.84-.28-1.51-.42-1.45-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.66 1.76-.01 2.19-.11z" />
              </svg>
              <span>Join Telegram Channel</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              type="button"
              onClick={markAsSeenAndClose}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs sm:text-sm active:scale-[0.98] transition-all text-center"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

