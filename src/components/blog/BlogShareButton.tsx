"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function BlogShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // User cancelled share or share failed, fallback to copy
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy URL", err);
      }
    }
  };

  return (
    <button
      type="button"
      title="Share or copy article link"
      onClick={handleShare}
      className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-semibold"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700 text-xs font-bold">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Share</span>
        </>
      )}
    </button>
  );
}
