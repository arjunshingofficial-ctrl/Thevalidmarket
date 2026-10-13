"use client";

import React, { useState, useMemo } from "react";
import { 
  CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Star, 
  Plus, X, Globe, Smartphone, Monitor, ChevronDown, ChevronRight, 
  Share2, Layers, Search, ArrowRight, ExternalLink, Image as ImageIcon, 
  Link as LinkIcon, Hash, Copy, Check, Info, FileText, Edit3 
} from "lucide-react";
import { 
  analyzeSeo, 
  SeoInputData, 
  SeoAnalysisResult, 
  SeoCheckItem, 
  KeyphraseMatch 
} from "@/lib/seo/analyzer";

interface RealTimeSeoAnalyzerProps {
  data: SeoInputData;
  onUpdateField: (field: string, value: any) => void;
  onJumpToTab?: (tabId: string) => void;
}

export default function RealTimeSeoAnalyzer({
  data,
  onUpdateField,
  onJumpToTab,
}: RealTimeSeoAnalyzerProps) {
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "keyphrases" | "serp" | "social" | "headings">("overview");
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "passed">("all");
  const [newSecondaryKey, setNewSecondaryKey] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Real-time calculation with memoization
  const analysis: SeoAnalysisResult = useMemo(() => {
    return analyzeSeo(data);
  }, [data]);

  // Score styling
  const scoreColors = {
    Best: {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "stroke-emerald-500",
      badge: "bg-emerald-500 text-white",
      label: "Best (Optimized)",
    },
    Good: {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "stroke-amber-500",
      badge: "bg-amber-500 text-white",
      label: "Good (Minor Fixes)",
    },
    OK: {
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      ring: "stroke-red-500",
      badge: "bg-red-500 text-white",
      label: "Needs Work (0-59)",
    },
  }[analysis.statusLevel];

  // Keyphrase actions
  const handleAddSecondaryKey = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    const clean = newSecondaryKey.trim().toLowerCase();
    if (!clean) return;
    const current = (data.secondaryKeyphrases || (data as any).secondaryKeywords || []) as string[];
    if (current.includes(clean)) {
      setNewSecondaryKey("");
      return;
    }
    if (current.length >= 4) {
      alert("You can configure up to 4 secondary keyphrases (plus 1 primary).");
      return;
    }
    const updated = [...current, clean];
    onUpdateField("secondaryKeywords", updated);
    onUpdateField("secondaryKeyphrases", updated);
    setNewSecondaryKey("");
  };

  const handleRemoveSecondaryKey = (keyToRemove: string) => {
    const current = (data.secondaryKeyphrases || (data as any).secondaryKeywords || []) as string[];
    const updated = current.filter((k: string) => k !== keyToRemove);
    onUpdateField("secondaryKeywords", updated);
    onUpdateField("secondaryKeyphrases", updated);
  };

  const handleCopySuggestion = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const [fixedNotice, setFixedNotice] = useState<string | null>(null);

  // Auto-fixable warnings
  const autoFixableWarnings = useMemo(() => {
    return analysis.recommendations.filter(
      r => !r.passed && (r.severity === "important" || r.severity === "recommended" || r.severity === "optional") && r.fixAction?.value !== undefined
    );
  }, [analysis]);

  const handleFixAllWarnings = () => {
    const toFix = autoFixableWarnings;
    if (toFix.length === 0) return;
    
    let nextContent = data.content || "";
    const fieldUpdates: Record<string, any> = {};

    toFix.forEach(item => {
      if (!item.fixAction || item.fixAction.value === undefined) return;
      if (item.fixAction.field === "content") {
        if (item.id === "links_internal") {
          const internalSnippet = `<p>Explore more verified software, proxies, and accounts in the <a href="/store">Asia D Market Store</a> or review our latest <a href="/blog">technical guides</a>.</p>`;
          if (!nextContent.includes("/store")) {
            nextContent = nextContent ? `${nextContent}\n\n${internalSnippet}` : internalSnippet;
          }
        } else if (item.id === "headings_single_h1") {
          nextContent = nextContent.replace(/<h1(\b[^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");
        } else if (item.id === "headings_h2_presence") {
          const h2Snippet = `<h2>Key Highlights & Specifications</h2>\n<p>Explore detailed features, setup requirements, and verified benefits below.</p>\n<h2>Frequently Asked Questions</h2>\n<p>Find quick answers regarding licensing, downloads, and technical support.</p>`;
          if (!nextContent.includes("<h2>")) {
            nextContent = nextContent ? `${nextContent}\n\n${h2Snippet}` : h2Snippet;
          }
        } else if (item.id === "content_word_count") {
          const faqSnippet = `<h2>Detailed Guide & Specifications</h2>\n<p>This resource is meticulously researched to provide verified information, secure setup instructions, and practical use cases for our community.</p>\n<h2>Frequently Asked Questions</h2>\n<p><strong>How do I access this item?</strong> Instant access and download links are delivered directly to your customer dashboard upon confirmation.</p>\n<p><strong>Is technical support included?</strong> Yes, Asia D Market provides 24/7 technical customer support for all active licenses and services.</p>`;
          if (!nextContent.includes("Frequently Asked Questions")) {
            nextContent = nextContent ? `${nextContent}\n\n${faqSnippet}` : faqSnippet;
          }
        } else {
          nextContent = item.fixAction.value;
        }
        fieldUpdates["content"] = nextContent;
      } else {
        fieldUpdates[item.fixAction.field] = item.fixAction.value;
      }
    });

    Object.entries(fieldUpdates).forEach(([field, val]) => {
      onUpdateField(field, val);
    });

    setFixedNotice(`⚡ Fixed ${toFix.length} warning${toFix.length > 1 ? "s" : ""} in one click!`);
    setTimeout(() => setFixedNotice(null), 4000);
  };

  const handleFixSingle = (rec: SeoCheckItem) => {
    if (!rec.fixAction) return;
    if (rec.fixAction.value !== undefined) {
      onUpdateField(rec.fixAction.field, rec.fixAction.value);
      setFixedNotice(`✓ Fixed: "${rec.fixAction.label}"`);
    } else if (rec.fixAction.tabId && onJumpToTab) {
      onJumpToTab(rec.fixAction.tabId);
    }
    setTimeout(() => setFixedNotice(null), 3000);
  };

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    if (filterSeverity === "passed") return analysis.checks.filter(c => c.passed);
    if (filterSeverity === "critical") return analysis.recommendations.filter(c => c.severity === "critical");
    if (filterSeverity === "warning") return analysis.recommendations.filter(c => c.severity === "important" || c.severity === "recommended");
    return analysis.recommendations;
  }, [analysis, filterSeverity]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-800">
      
      {/* ── Top Header / Score Gauge ────────────────────────────────────────── */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Radial score circle */}
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-white/10"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${scoreColors.ring} transition-all duration-700 ease-out`}
                strokeDasharray={`${analysis.score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white leading-none tracking-tight">{analysis.score}</span>
              <span className="text-[10px] text-slate-300 font-bold uppercase mt-0.5">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${scoreColors.badge}`}>
                {scoreColors.label}
              </span>
              <span className="text-xs text-slate-400">
                {data.contentType === "blog" ? "Blog Article" : "Product Page"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Real-Time On-Page SEO</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Live algorithmic analysis against Google Search &amp; Seobility audit criteria.
            </p>
          </div>
        </div>

        {/* Quick Audit Counters & One-Click Fix */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{analysis.passedCount} Passed</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{analysis.warningCount} Warnings</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-bold">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{analysis.errorCount} Critical</span>
          </div>

          {autoFixableWarnings.length > 0 && (
            <button
              type="button"
              onClick={handleFixAllWarnings}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
              title="Resolve all warnings with one click"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Fix All Warnings ({autoFixableWarnings.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 overflow-x-auto gap-2">
        {[
          { id: "overview", label: "Overview & Recommendations", icon: Layers, count: analysis.recommendations.length },
          { id: "keyphrases", label: "5 Focus Keyphrases", icon: Star, count: analysis.keyphrasesData.length },
          { id: "serp", label: "Google SERP Snippet", icon: Globe },
          { id: "social", label: "Social Card (OG & X)", icon: Share2 },
          { id: "headings", label: "Headings & Structure", icon: Hash, count: analysis.h2Count + analysis.h3Count },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive 
                  ? "border-primary text-primary bg-white shadow-xs" 
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW & ACTIONABLE RECOMMENDATIONS ───────────────────── */}
      {activeSubTab === "overview" && (
        <div className="p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block font-semibold mb-1">Title Width</span>
              <span className={`text-base font-extrabold ${analysis.titlePixelWidth > 580 ? "text-amber-600" : "text-slate-900"}`}>
                {analysis.titlePixelWidth}px
              </span>
              <span className="text-[11px] text-slate-400 block">max 580px ({analysis.titleLength} chars)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block font-semibold mb-1">Snippet Width</span>
              <span className={`text-base font-extrabold ${analysis.descPixelWidth > 960 ? "text-amber-600" : "text-slate-900"}`}>
                {analysis.descPixelWidth}px
              </span>
              <span className="text-[11px] text-slate-400 block">max 960px ({analysis.descLength} chars)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block font-semibold mb-1">Word Count</span>
              <span className="text-base font-extrabold text-slate-900">
                {analysis.wordCount} words
              </span>
              <span className="text-[11px] text-slate-400 block">~{analysis.readingTimeMinutes} min reading time</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-slate-400 block font-semibold mb-1">Images Missing Alt</span>
              <span className={`text-base font-extrabold ${analysis.imagesMissingAlt > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {analysis.imagesMissingAlt} of {analysis.totalImages}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {analysis.imagesMissingAlt === 0 ? "All images labeled" : "Alt tags required"}
              </span>
            </div>
          </div>

          {/* Actionable Recommendations Header with Severity Filters */}
          <div className="space-y-3">
            {fixedNotice && (
              <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  {fixedNotice}
                </span>
                <button type="button" onClick={() => setFixedNotice(null)} className="text-white/80 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Actionable Optimization Checklist ({filteredRecs.length})</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Click &quot;Fix&quot; on any item to resolve warnings and critical issues in one click.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {autoFixableWarnings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleFixAllWarnings}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    title="Fix all auto-fixable warnings in one click"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>⚡ Fix All Warnings ({autoFixableWarnings.length})</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 text-xs">
                  {[
                    { id: "all", label: "All Fixes" },
                    { id: "critical", label: `Critical (${analysis.errorCount})` },
                    { id: "warning", label: `Warnings (${analysis.warningCount})` },
                    { id: "passed", label: `Passed (${analysis.passedCount})` },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setFilterSeverity(filter.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        filterSeverity === filter.id 
                          ? "bg-slate-900 text-white" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List of items */}
            {filteredRecs.length === 0 ? (
              <div className="text-center py-8 bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-800 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600" />
                <p className="font-bold text-sm">All checks in this category passed!</p>
                <p className="text-xs text-emerald-600">Your content meets top editorial on-page SEO standards.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecs.map(rec => {
                  const severityBadge = {
                    critical: "bg-red-100 text-red-800 border-red-200",
                    important: "bg-amber-100 text-amber-800 border-amber-200",
                    recommended: "bg-blue-100 text-blue-800 border-blue-200",
                    optional: "bg-slate-100 text-slate-700 border-slate-200",
                    passed: "bg-emerald-100 text-emerald-800 border-emerald-200",
                  }[rec.severity];

                  return (
                    <div 
                      key={rec.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        rec.passed 
                          ? "bg-emerald-50/30 border-emerald-100" 
                          : rec.severity === "critical" 
                            ? "bg-red-50/40 border-red-200 shadow-xs" 
                            : "bg-white border-slate-200/90 shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${severityBadge}`}>
                              {rec.severity}
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">{rec.title}</span>
                          </div>
                          {rec.issue && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {rec.issue}
                            </p>
                          )}
                          {rec.impact && (
                            <p className="text-[11px] text-slate-500 italic">
                              <span className="font-semibold text-slate-600">Why it matters:</span> {rec.impact}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        {rec.fixAction && !rec.passed && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {rec.fixAction.value !== undefined ? (
                              <button
                                type="button"
                                onClick={() => handleFixSingle(rec)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 ${
                                  rec.severity === "critical"
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : rec.severity === "important"
                                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                                      : "bg-primary hover:bg-primary/90 text-white"
                                }`}
                                title="Click to apply this fix in one click"
                              >
                                <Sparkles className="w-3.5 h-3.5 fill-white/40" />
                                <span>Fix: {rec.fixAction.label}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if (rec.fixAction!.tabId && onJumpToTab) {
                                    onJumpToTab(rec.fixAction!.tabId);
                                  }
                                }}
                                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                              >
                                <span>{rec.fixAction.label}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Internal Linking Helper */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-primary" /> Verified Internal Link Recommendations
              </span>
              <span className="text-[11px] text-slate-400">Copy URL to link inside editor</span>
            </div>
            <p className="text-xs text-slate-500">
              Boost your article authority by linking to relevant marketplace categories and tools:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { name: "Digital Products Store", url: "/store" },
                { name: "Verified Courses", url: "/courses" },
                { name: "Live Support & VIP Chat", url: "/chat" },
                { name: "Asia D Market Blog Index", url: "/blog" },
                { name: "Software Licenses", url: "/category/software" },
                { name: "Proxy & VPN Tools", url: "/category/proxy" },
              ].map(link => (
                <div 
                  key={link.url}
                  className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="truncate pr-2">
                    <p className="font-bold text-slate-800 truncate">{link.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono truncate block">{link.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopySuggestion(link.url, link.url)}
                    className="p-1 rounded text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedLink === link.url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FIVE FOCUS KEYPHRASES HUB ───────────────────────────────── */}
      {activeSubTab === "keyphrases" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>5 Focus Keyphrases Hub</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Designate 1 Primary Focus Keyphrase (highest ranking weight) and up to 4 Secondary Keyphrases. All 5 are saved persistently in the database and monitored across your content.
            </p>
          </div>

          {/* Primary Keyphrase Input */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>1. Primary Focus Keyphrase (Required)</span>
              </label>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Primary Weight
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.primaryKeyphrase || (data as any).focusKeyword || ""}
                onChange={(e) => {
                  onUpdateField("focusKeyword", e.target.value);
                  onUpdateField("primaryKeyphrase", e.target.value);
                }}
                placeholder="e.g. socks5 proxy for android"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-medium"
              />
              <button
                type="button"
                onClick={() => {
                  const baseName = data.name || (data as any).title || "product";
                  const candidate = baseName.toLowerCase().split(" ").slice(0, 3).join(" ");
                  onUpdateField("focusKeyword", candidate);
                  onUpdateField("primaryKeyphrase", candidate);
                }}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto Suggest</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              This is the main phrase searchers use on Google. It should appear in your Title, Meta Description, URL, and Introduction.
            </p>
          </div>

          {/* Secondary Keyphrases Inputs */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Additional Keyphrases (Up to 4)
              </label>
              <span className="text-xs text-slate-400 font-bold">
                {(data.secondaryKeyphrases || (data as any).secondaryKeywords || []).length} / 4 configured
              </span>
            </div>

            {/* Input to add */}
            {(data.secondaryKeyphrases || (data as any).secondaryKeywords || []).length < 4 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSecondaryKey}
                  onChange={(e) => setNewSecondaryKey(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddSecondaryKey(e);
                    }
                  }}
                  placeholder="Add long-tail variation (e.g. residential proxy android setup) and press Add"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddSecondaryKey(e);
                  }}
                  disabled={!newSecondaryKey.trim()}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Keyphrase</span>
                </button>
              </div>
            )}

            {/* Configured secondary tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {(data.secondaryKeyphrases || (data as any).secondaryKeywords || []).map((secKey: string, idx: number) => (
                <span
                  key={secKey}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 shadow-xs"
                >
                  <span className="text-slate-400 font-mono text-[10px]">#{idx + 2}</span>
                  <span>{secKey}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSecondaryKey(secKey)}
                    className="hover:text-red-600 transition-colors ml-1 text-slate-400"
                    title="Remove keyphrase"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {(data.secondaryKeyphrases || (data as any).secondaryKeywords || []).length === 0 && (
                <p className="text-xs text-slate-400 italic">No additional keyphrases added yet. Add long-tail queries to capture more search traffic.</p>
              )}
            </div>
          </div>

          {/* Keyphrase Matrix Table */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Real-Time Placement &amp; Density Matrix
            </h5>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200">
                    <th className="py-2.5 px-3">Keyphrase</th>
                    <th className="py-2.5 px-2 text-center">Title</th>
                    <th className="py-2.5 px-2 text-center">Meta Desc</th>
                    <th className="py-2.5 px-2 text-center">URL Slug</th>
                    <th className="py-2.5 px-2 text-center">Intro</th>
                    <th className="py-2.5 px-2 text-center">Headings</th>
                    <th className="py-2.5 px-2 text-center">Image Alt</th>
                    <th className="py-2.5 px-3 text-right">Count (Density)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {analysis.keyphrasesData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Please define a primary keyphrase above to see the placement matrix.
                      </td>
                    </tr>
                  ) : (
                    analysis.keyphrasesData.map(km => (
                      <tr key={km.keyphrase} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          {km.isPrimary && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                          <span className="truncate max-w-[180px]">{km.keyphrase}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {km.inTitle ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">―</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {km.inMetaDesc ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">―</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {km.inSlug ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">―</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {km.inIntro ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">―</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {km.inHeadings ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">―</span>}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {km.inImageAlt ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-slate-300">―</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={
                            km.status === "stuffed" 
                              ? "text-red-600 font-black" 
                              : km.status === "good" 
                                ? "text-emerald-600" 
                                : "text-slate-400"
                          }>
                            {km.count}x ({km.density}%)
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: GOOGLE SERP SNIPPET PREVIEW ─────────────────────────────── */}
      {activeSubTab === "serp" && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span>Google Search Result Appearance</span>
              </h4>
              <p className="text-xs text-slate-500">
                Pixel-accurate preview of how your page appears on Google Search.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setDevicePreview("desktop")}
                className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  devicePreview === "desktop" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDevicePreview("mobile")}
                className={`p-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  devicePreview === "mobile" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          {/* The Snippet Card */}
          <div className={`mx-auto bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-all ${
            devicePreview === "mobile" ? "max-w-sm" : "max-w-2xl"
          }`}>
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-[10px]">
                A
              </div>
              <div className="truncate">
                <span className="font-semibold text-slate-800">Asia D Market</span>
                <span className="text-slate-400 mx-1.5">›</span>
                <span className="text-slate-500">
                  {data.contentType === "blog" ? "blog" : "product"} › {data.slug || "url-slug"}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-medium text-blue-800 hover:underline leading-snug cursor-pointer line-clamp-2 pt-0.5">
              {(data.seoTitle || data.name || "Untitled Page Title") + " | Asia D Market"}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed pt-1 line-clamp-2">
              {data.metaDescription || data.excerpt || "Discover verified software, proxy solutions, and online courses on Asia D Market with instant delivery and 24/7 technical support."}
            </p>
          </div>

          {/* Interactive SERP Fields Editor */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <span>Edit Google Snippet (Live Sync)</span>
              </h5>
              <span className="text-[11px] font-semibold text-slate-500">
                Directly customize your Google search presence
              </span>
            </div>

            {/* SEO Title Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>SEO Title Tag</span>
                  <span className="text-[10px] text-slate-400 font-normal">(&lt;title&gt;)</span>
                </label>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={analysis.titleLength > 60 || analysis.titlePixelWidth > 580 ? "text-amber-600 font-black" : analysis.titleLength < 35 ? "text-blue-600 font-bold" : "text-emerald-600 font-bold"}>
                    {analysis.titleLength}/60 chars ({analysis.titlePixelWidth}/580px)
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={data.seoTitle || ""}
                  onChange={(e) => onUpdateField("seoTitle", e.target.value)}
                  placeholder={data.name || "Enter descriptive SEO title..."}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/50 focus:outline-none"
                />
                {analysis.suggestedTitle && (
                  <button
                    type="button"
                    onClick={() => onUpdateField("seoTitle", analysis.suggestedTitle)}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-xs"
                    title="Apply algorithmic suggested title"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Use Suggestion</span>
                  </button>
                )}
              </div>

              {/* Title Pixel Meter */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    analysis.titlePixelWidth > 580 ? "bg-amber-500" : analysis.titlePixelWidth < 280 ? "bg-blue-400" : "bg-emerald-500"
                  }`} 
                  style={{ width: `${Math.min(100, Math.max(5, (analysis.titlePixelWidth / 580) * 100))}%` }} 
                />
              </div>
            </div>

            {/* Meta Description Textarea */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Meta Description</span>
                  <span className="text-[10px] text-slate-400 font-normal">(&lt;meta name=&quot;description&quot;&gt;)</span>
                </label>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className={analysis.descLength > 160 || analysis.descPixelWidth > 960 ? "text-amber-600 font-black" : analysis.descLength < 80 ? "text-blue-600 font-bold" : "text-emerald-600 font-bold"}>
                    {analysis.descLength}/160 chars ({analysis.descPixelWidth}/960px)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={data.metaDescription || ""}
                  onChange={(e) => onUpdateField("metaDescription", e.target.value)}
                  placeholder="Summarize the page content compellingly to maximize click-through rate from Google..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none leading-relaxed"
                />
                {analysis.suggestedMetaDescription && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => onUpdateField("metaDescription", analysis.suggestedMetaDescription)}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Apply algorithmic suggested description"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Use Suggested Description</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Description Pixel Meter */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    analysis.descPixelWidth > 960 ? "bg-amber-500" : analysis.descLength < 80 ? "bg-blue-400" : "bg-emerald-500"
                  }`} 
                  style={{ width: `${Math.min(100, Math.max(5, (analysis.descPixelWidth / 960) * 100))}%` }} 
                />
              </div>
            </div>

            {/* URL Slug Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">URL Slug</label>
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-slate-400 font-mono select-none">
                  https://asiadmarket.com/{data.contentType === "blog" ? "blog" : "product"}/
                </span>
                <input
                  type="text"
                  value={data.slug || ""}
                  onChange={(e) => onUpdateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
                  placeholder="url-slug"
                  className="flex-1 font-mono text-slate-900 font-semibold focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Quick 1-Click Fix Helpers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Suggested SEO Title</span>
                <span className="font-mono text-slate-400">{analysis.suggestedTitle?.length || 0} chars</span>
              </div>
              <p className="text-xs text-slate-700 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                {analysis.suggestedTitle || "No suggestion needed"}
              </p>
              {analysis.suggestedTitle && analysis.suggestedTitle !== (data.seoTitle || data.name) && (
                <button
                  type="button"
                  onClick={() => onUpdateField("seoTitle", analysis.suggestedTitle)}
                  className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Suggested Title</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Suggested Meta Description</span>
                <span className="font-mono text-slate-400">{analysis.suggestedMetaDescription?.length || 0} chars</span>
              </div>
              <p className="text-xs text-slate-700 font-medium bg-white p-2.5 rounded-lg border border-slate-200 line-clamp-3">
                {analysis.suggestedMetaDescription || "No suggestion needed"}
              </p>
              {analysis.suggestedMetaDescription && analysis.suggestedMetaDescription !== (data.metaDescription || data.excerpt) && (
                <button
                  type="button"
                  onClick={() => onUpdateField("metaDescription", analysis.suggestedMetaDescription)}
                  className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply Suggested Description</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SOCIAL CARD SHARING PREVIEW ─────────────────────────────── */}
      {activeSubTab === "social" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <span>Social Media Sharing Card (OpenGraph &amp; Twitter / X)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Control the rich image and headline displayed when your link is posted to Telegram, Twitter/X, Discord, or Facebook.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Social Link Preview
              </span>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                  {(data.ogImage || data.featuredImage) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={data.ogImage || data.featuredImage} 
                      alt="Social Preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">No Social Image Set</p>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">asiadmarket.com</span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {data.ogTitle || data.seoTitle || data.name || "Headline Title"}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {data.ogDescription || data.metaDescription || data.excerpt || "Explore verified solutions and tutorials on Asia D Market."}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Social Fields */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Social Metadata Fields
              </span>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">OG Title</label>
                <input
                  type="text"
                  value={data.ogTitle || ""}
                  onChange={(e) => onUpdateField("ogTitle", e.target.value)}
                  placeholder={data.seoTitle || data.name || "Social share title..."}
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">OG Description</label>
                <textarea
                  rows={2}
                  value={data.ogDescription || ""}
                  onChange={(e) => onUpdateField("ogDescription", e.target.value)}
                  placeholder={data.metaDescription || data.excerpt || "Social share description snippet..."}
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">OG Image URL</label>
                <input
                  type="text"
                  value={data.ogImage || ""}
                  onChange={(e) => onUpdateField("ogImage", e.target.value)}
                  placeholder={data.featuredImage || "https://..."}
                  className="w-full border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (data.featuredImage) {
                      onUpdateField("ogImage", data.featuredImage);
                    }
                  }}
                  className="mt-1 text-[11px] text-primary hover:underline font-bold"
                >
                  Sync from Featured Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: HEADINGS & CONTENT STRUCTURE ────────────────────────────── */}
      {activeSubTab === "headings" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <span>Headings &amp; Document Outline</span>
            </h4>
            <p className="text-xs text-slate-500">
              Inspect the heading hierarchy parsed directly from your content body.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className={`p-4 rounded-xl border ${analysis.h1CountInContent > 0 ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
              <span className="font-extrabold block text-sm">Rendered H1s</span>
              <span className="text-2xl font-black">{analysis.h1CountInContent === 0 ? "1 (Page Title)" : `${analysis.h1CountInContent + 1} (Multiple H1 Error)`}</span>
              <p className="text-[11px] mt-1">
                {analysis.h1CountInContent === 0 ? "Perfect single H1 hierarchy." : "Remove <h1> from content body so only the page title is H1."}
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
              <span className="font-extrabold block text-sm">H2 Subsections</span>
              <span className="text-2xl font-black text-slate-900">{analysis.h2Count}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Major topical sections. Recommended: at least 2.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
              <span className="font-extrabold block text-sm">H3 Deep Dives</span>
              <span className="text-2xl font-black text-slate-900">{analysis.h3Count}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Sub-points nested under H2 headings.
              </p>
            </div>
          </div>

          {/* Heading Tree */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Document Outline Tree
            </span>
            {analysis.headingsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No headings found in content body. Use H2 headings in the editor to structure your points.
              </p>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                {/* Visual root H1 */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px]">H1</span>
                  <span className="truncate">{data.name || "Main Page Title"}</span>
                  <span className="text-[10px] text-indigo-600 font-normal ml-auto">Page Header</span>
                </div>

                {analysis.headingsList.map((h, i) => {
                  const isDuplicate = analysis.duplicateHeadings.includes(h.text.toLowerCase());
                  const isH1Error = h.level === 1;

                  return (
                    <div 
                      key={i} 
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        isH1Error 
                          ? "bg-red-50 border-red-200 text-red-900" 
                          : isDuplicate 
                            ? "bg-amber-50 border-amber-200 text-amber-900" 
                            : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                      style={{ marginLeft: `${(h.level - 1) * 16}px` }}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        h.level === 1 ? "bg-red-600 text-white" : h.level === 2 ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                      }`}>
                        H{h.level}
                      </span>
                      <span className="truncate flex-1">{h.text || <em className="text-slate-400">Empty heading</em>}</span>
                      {isH1Error && <span className="text-[10px] font-bold text-red-600">Demote to H2</span>}
                      {isDuplicate && <span className="text-[10px] font-bold text-amber-600">Duplicate</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
