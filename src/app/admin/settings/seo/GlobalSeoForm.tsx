"use client";

import { useState, useTransition, useMemo } from "react";
import { 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Globe, 
  Share2, 
  AtSign, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  ExternalLink 
} from "lucide-react";
import { updateGlobalSEOSettings } from "../actions";

interface GlobalSeoFormProps {
  initialData: {
    siteName: string;
    twitterHandle: string;
    siteDescription: string;
    defaultOgImage: string;
    siteUrl: string;
  };
}

export default function GlobalSeoForm({ initialData }: GlobalSeoFormProps) {
  const [siteName, setSiteName] = useState(initialData.siteName || "The Valid Market");
  const [twitterHandle, setTwitterHandle] = useState(initialData.twitterHandle || "@TheValidMarket");
  const [siteDescription, setSiteDescription] = useState(initialData.siteDescription || "");
  const [defaultOgImage, setDefaultOgImage] = useState(initialData.defaultOgImage || "/og-image.jpg");

  const [isPending, startTransition] = useTransition();
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Dynamic Organization JSON-LD Schema
  const dynamicSchema = useMemo(() => {
    const handleClean = twitterHandle.replace(/^@/, "");
    const schemaObj = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${initialData.siteUrl}/#organization`,
          "name": siteName.trim() || "The Valid Market",
          "url": initialData.siteUrl,
          "description": siteDescription.trim() || undefined,
          "logo": {
            "@type": "ImageObject",
            "url": `${initialData.siteUrl}/logo.png`,
            "caption": `${siteName.trim()} Logo`
          },
          "sameAs": [
            "https://t.me/+xpN22t7nSkk4ZWJl",
            handleClean ? `https://x.com/${handleClean}` : undefined
          ].filter(Boolean)
        }
      ]
    };
    return JSON.stringify(schemaObj, null, 2);
  }, [siteName, twitterHandle, siteDescription, initialData.siteUrl]);

  // Pixel width estimate for meta description
  const descPixelWidth = useMemo(() => {
    let width = 0;
    for (const char of siteDescription) {
      if (/[A-Z]/.test(char)) width += 8.8;
      else if (/[wWmMWQ]/.test(char)) width += 10.5;
      else if (/[ijlI1.,!:'|]/.test(char)) width += 3.8;
      else if (char === " ") width += 4.5;
      else width += 6.5;
    }
    return Math.round(width);
  }, [siteDescription]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStatusNotice(null);

    const formData = new FormData();
    formData.set("siteName", siteName);
    formData.set("twitterHandle", twitterHandle);
    formData.set("siteDescription", siteDescription);
    formData.set("defaultOgImage", defaultOgImage);

    startTransition(async () => {
      const result = await updateGlobalSEOSettings(formData);
      if (result.success) {
        setStatusNotice({
          type: "success",
          message: "✓ Global SEO settings saved and updated! Title tags, meta descriptions, and social graphs are now live across your store.",
        });
        setTimeout(() => setStatusNotice(null), 6000);
      } else {
        setStatusNotice({
          type: "error",
          message: result.message || "Failed to update global SEO settings.",
        });
      }
    });
  };

  const handleCopySchema = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(dynamicSchema);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status Notice Toast / Banner */}
      {statusNotice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            statusNotice.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-red-50 border-red-300 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="leading-relaxed">{statusNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-slate-400 hover:text-slate-700 ml-3 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Settings Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Site Name & Twitter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>Site Name / Brand</span>
                </label>
                <span className={`text-[11px] font-mono ${siteName.length > 50 ? "text-amber-600 font-bold" : "text-slate-400"}`}>
                  {siteName.length}/50 chars
                </span>
              </div>
              <input
                type="text"
                name="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="The Valid Market"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                required
              />
              <p className="text-[11px] text-slate-500">
                Appears in search engine titles (`Title | {siteName || "Brand"}`) and structured schemas.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-sky-500" />
                  <span>Twitter / X Handle</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {twitterHandle}
                </span>
              </div>
              <input
                type="text"
                name="twitterHandle"
                value={twitterHandle}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val && !val.startsWith("@") && !val.startsWith("http")) {
                    val = `@${val}`;
                  }
                  setTwitterHandle(val);
                }}
                placeholder="@TheValidMarket"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
              />
              <p className="text-[11px] text-slate-500">
                Used in `twitter:creator` and `twitter:site` meta tags for Twitter Card link previews.
              </p>
            </div>
          </div>

          {/* Row 2: Site Meta Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-primary" />
                <span>Site Description (Global Meta &amp; Homepage SERP)</span>
              </label>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className={siteDescription.length > 160 || descPixelWidth > 960 ? "text-amber-600 font-bold" : siteDescription.length < 80 ? "text-blue-600" : "text-emerald-600 font-bold"}>
                  {siteDescription.length}/160 chars ({descPixelWidth}/960px)
                </span>
              </div>
            </div>
            <textarea
              name="siteDescription"
              rows={3}
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              placeholder="Premier digital marketplace for software, courses, tools, and digital goods..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all leading-relaxed resize-none"
            />
            {/* Description Pixel Meter */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  descPixelWidth > 960 ? "bg-amber-500" : descPixelWidth < 280 ? "bg-blue-400" : "bg-emerald-500"
                }`} 
                style={{ width: `${Math.min(100, Math.max(5, (descPixelWidth / 960) * 100))}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Summarizes your platform in search engine results and social media shares. Keep under 160 characters.
            </p>
          </div>

          {/* Row 3: Default Open Graph Image URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              <span>Default Open Graph Image (URL or Relative Path)</span>
            </label>
            <input
              type="text"
              name="defaultOgImage"
              value={defaultOgImage}
              onChange={(e) => setDefaultOgImage(e.target.value)}
              placeholder="e.g. /og-image.jpg or https://www.thevalidmarket.com/og-image.jpg"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
            />
            <p className="text-[11px] text-slate-500">
              Preview image shown when pages without specific images are shared on Telegram, WhatsApp, X, and Facebook.
            </p>

            {/* Thumbnail preview */}
            {defaultOgImage && (
              <div className="pt-2 flex items-center gap-3">
                <div className="relative w-32 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-300 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={defaultOgImage}
                    alt="Default OG Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Live Thumbnail Preview</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-sm">{defaultOgImage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Google Search Snippet Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Google SERP Preview (Home &amp; Storefront)
            </span>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                  ADM
                </div>
                <span className="font-medium text-slate-800">{siteName || "The Valid Market"}</span>
                <span className="text-slate-400 font-mono text-[11px]">› {initialData.siteUrl.replace(/^https?:\/\//, "")}</span>
              </div>
              <h4 className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                {siteName || "The Valid Market"} - Hacking Course + Tools + CC
              </h4>
              <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
                {siteDescription || "Explore The Valid Market: The premier digital marketplace for premium tools, verified software licenses, expert courses, proxies, and digital assets with instant delivery."}
              </p>
            </div>
          </div>

          {/* Row 4: Dynamic JSON-LD Organization Schema */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Organization JSON-LD Schema (Live Generated)</span>
              </label>
              <button
                type="button"
                onClick={handleCopySchema}
                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? "Copied!" : "Copy JSON-LD"}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={dynamicSchema}
              className="w-full bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl p-3.5 leading-relaxed focus:outline-none select-all"
            />
            <p className="text-[11px] text-slate-500">
              Automatically injected into every page header so Google Knowledge Graph recognizes your brand.
            </p>
          </div>

          {/* Save Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700">Ctrl + S</kbd>
              <span>or click save</span>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isPending ? "Saving Global SEO..." : "Save SEO Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
