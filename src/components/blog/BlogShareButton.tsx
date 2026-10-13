"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Share2, Check, Copy, Send, 
  MessageSquare, ChevronDown 
} from "lucide-react";

export default function BlogShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const handleCopy = async () => {
    const url = getUrl();
    if (!url) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("input");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  const shareNative = async () => {
    if (typeof window === "undefined") return;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to dropdown
      }
    }
    setOpen(prev => !prev);
  };

  const shareTelegram = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(title);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const shareTwitter = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const shareWhatsApp = () => {
    const url = encodeURIComponent(getUrl());
    const text = encodeURIComponent(`${title}\n${getUrl()}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy article link"
          className="px-3 py-2 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Copy Link</span>
            </>
          )}
        </button>

        <span className="w-px h-4 bg-slate-200" />

        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          title="Share to social networks"
          className="p-2 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden sm:inline">Share</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Share Article
          </div>
          
          <button
            type="button"
            onClick={shareTelegram}
            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700 flex items-center gap-2.5 transition-colors"
          >
            <Send className="w-4 h-4 text-sky-500" />
            <span>Telegram</span>
          </button>

          <button
            type="button"
            onClick={shareTwitter}
            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-slate-900 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>X (Twitter)</span>
          </button>

          <button
            type="button"
            onClick={shareWhatsApp}
            className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
            >
              <Copy className="w-4 h-4 text-slate-400" />
              <span>{copied ? "Link Copied!" : "Copy Full URL"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
