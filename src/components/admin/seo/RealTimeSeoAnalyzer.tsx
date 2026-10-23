"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  CheckCircle2, AlertTriangle, AlertCircle, Sparkles, Star, 
  Plus, X, Globe, Smartphone, Monitor, ChevronDown, ChevronRight, 
  Share2, Layers, Search, ArrowRight, ExternalLink, Image as ImageIcon, 
  Link as LinkIcon, Hash, Copy, Check, Info, FileText, Edit3, 
  ShieldCheck, ShieldAlert, Cpu, BookOpen, Clock, Activity, ArrowUpRight,
  ListTree, AlertOctagon, HelpCircle, RefreshCw
} from "lucide-react";
import { 
  analyzeSeo, 
  SeoInputData, 
  SeoAnalysisResult, 
  SeoCheckItem, 
  KeyphraseMatch,
  CheckStatusType,
  cleanDynamicInternalLinks,
  deduplicateHeadingTexts,
  rebalanceExcessiveHeadings,
  buildCleanSeoTitle,
  buildCleanMetaDescription
} from "@/lib/seo/analyzer";
import { getBaseUrl } from "@/lib/siteUrl";

interface RealTimeSeoAnalyzerProps {
  data: SeoInputData;
  onUpdateField: (field: string, value: any) => void;
  onJumpToTab?: (tabId: string) => void;
  postId?: string;
}

export default function RealTimeSeoAnalyzer({
  data,
  onUpdateField,
  onJumpToTab,
  postId,
}: RealTimeSeoAnalyzerProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "keyphrases" | "serp" | "slug_canonical" | "headings" | "links_media" | "technical_schema" | "social"
  >("overview");

  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "passed">("all");
  const [newSecondaryKey, setNewSecondaryKey] = useState("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [fixedNotice, setFixedNotice] = useState<string | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Live duplicate and internal link data from DB
  const [dbAudit, setDbAudit] = useState<{
    slugConflict: { type: string; title: string; url: string } | null;
    titleConflict: { id: string; title: string; slug: string } | null;
    descConflict: { id: string; title: string; slug: string } | null;
    establishedSlugNeedsRedirect: boolean;
    oldSlug: string | null;
    siteLinks: {
      articles: { title: string; url: string }[];
      products: { title: string; url: string; type: string }[];
      categories: { title: string; url: string }[];
    };
  } | null>(null);
  const [loadingDbAudit, setLoadingDbAudit] = useState(false);

  // Debounced DB Conflict & Site Links Check
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

    checkTimerRef.current = setTimeout(async () => {
      try {
        setLoadingDbAudit(true);
        const params = new URLSearchParams();
        if (data.slug) params.set("slug", data.slug);
        if (data.seoTitle || data.name) params.set("seoTitle", data.seoTitle || data.name || "");
        if (data.metaDescription) params.set("metaDescription", data.metaDescription);
        if (postId) params.set("postId", postId);

        const res = await fetch(`/api/admin/blog/seo-check?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setDbAudit(json);
        }
      } catch (err) {
        console.error("Failed to run DB SEO check:", err);
      } finally {
        setLoadingDbAudit(false);
      }
    }, 600);

    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, [data.slug, data.seoTitle, data.name, data.metaDescription, postId]);

  // Real-time calculation with memoization
  const analysis: SeoAnalysisResult = useMemo(() => {
    return analyzeSeo(data);
  }, [data]);

  // Merge live DB conflict checks into analysis recommendations
  const allChecksWithDb = useMemo(() => {
    const list = [...analysis.checks];

    if (dbAudit?.slugConflict) {
      list.unshift({
        id: "slug_db_conflict",
        category: "slug",
        severity: "critical",
        statusType: "verified",
        passed: false,
        title: `Duplicate URL Slug Conflict: "/${data.slug}"`,
        issue: `Slug is already used by published ${dbAudit.slugConflict.type}: "${dbAudit.slugConflict.title}".`,
        impact: "Multiple pages cannot share the exact same URL slug on Google. Crawlers will encounter index collisions.",
        whyItMatters: "According to Google Search Central, every canonical URL must identify a single unique resource.",
        suggestedAction: "Choose a distinct URL slug to ensure page uniqueness.",
      });
    }

    if (dbAudit?.titleConflict) {
      list.unshift({
        id: "title_db_conflict",
        category: "title",
        severity: "important",
        statusType: "verified",
        passed: false,
        title: `Duplicate Title with Existing Article: "${dbAudit.titleConflict.title}"`,
        issue: `Another published article already uses an identical SEO title (${dbAudit.titleConflict.slug}).`,
        impact: "Causes keyword cannibalization where your own pages compete against each other in Google Search.",
        whyItMatters: "Google recommends distinct, informative titles across every page on your domain.",
        suggestedAction: "Differentiate this article's unique angle in the title.",
      });
    }

    if (dbAudit?.descConflict) {
      list.unshift({
        id: "desc_db_conflict",
        category: "description",
        severity: "recommended",
        statusType: "verified",
        passed: false,
        title: "Duplicate Meta Description with Published Post",
        issue: `This exact description is shared with article "${dbAudit.descConflict.title}".`,
        impact: "Identical snippets look like low-effort automated content to search crawlers.",
        whyItMatters: "Google explicitly advises writing unique descriptions that summarize each page's unique value.",
        suggestedAction: "Craft a distinct summary highlighting what makes this article unique.",
      });
    }

    return list;
  }, [analysis.checks, dbAudit, data.slug]);

  // Critical issues list
  const criticalIssues = useMemo(() => {
    return allChecksWithDb.filter(c => !c.passed && c.severity === "critical");
  }, [allChecksWithDb]);

  // Score styling
  const scoreColors = {
    Best: {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "stroke-emerald-500",
      badge: "bg-emerald-500 text-white",
      label: "Best (85–100)",
      description: "Well-structured, comprehensive, and ready for search publication.",
    },
    Good: {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "stroke-amber-500",
      badge: "bg-amber-500 text-white",
      label: "Good (60–84)",
      description: "Minor technical or on-page refinements recommended.",
    },
    OK: {
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      ring: "stroke-red-500",
      badge: "bg-red-500 text-white",
      label: "OK (0–59)",
      description: "Needs attention on key technical elements before publishing.",
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
      alert("You can configure up to 4 secondary keyphrases (plus 1 primary focus keyphrase).");
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

  const handleCopyText = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleApplySingle = (rec: SeoCheckItem) => {
    if (!rec.fixAction) return;
    if (rec.fixAction.value !== undefined) {
      onUpdateField(rec.fixAction.field, rec.fixAction.value);
      setFixedNotice(`✓ Applied: "${rec.fixAction.label}"`);
    } else if (rec.fixAction.tabId && onJumpToTab) {
      onJumpToTab(rec.fixAction.tabId);
    }
    setTimeout(() => setFixedNotice(null), 3500);
  };

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    if (filterSeverity === "passed") return allChecksWithDb.filter(c => c.passed);
    if (filterSeverity === "critical") return allChecksWithDb.filter(c => !c.passed && c.severity === "critical");
    if (filterSeverity === "warning") return allChecksWithDb.filter(c => !c.passed && (c.severity === "important" || c.severity === "recommended"));
    return allChecksWithDb.filter(c => !c.passed);
  }, [allChecksWithDb, filterSeverity]);

  // Insert real internal link into content
  const handleInsertInternalLink = (url: string, title: string) => {
    const linkHtml = ` <a href="${url}">${title}</a> `;
    const updatedContent = data.content ? `${data.content}\n<p>Recommended related reading: ${linkHtml}</p>` : `<p>Recommended: ${linkHtml}</p>`;
    onUpdateField("content", updatedContent);
    setFixedNotice(`✓ Inserted link to "${title}"`);
    setTimeout(() => setFixedNotice(null), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-800">
      
      {/* ── Top Header / Score Gauge & Editorial Guidelines ─────────────────── */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${scoreColors.badge}`}>
                {scoreColors.label}
              </span>
              <button
                type="button"
                onClick={() => setShowScoreModal(prev => !prev)}
                className="text-[11px] text-slate-300 hover:text-white underline font-medium flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>How Score is Calculated</span>
              </button>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Editorial SEO &amp; Technical Assistant</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Based on official Google Search Central guidelines. Editorial guidance only — not a Google ranking factor.
            </p>
          </div>
        </div>

        {/* Quick Audit Counters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 p-2.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{analysis.passedCount} Passed</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>{analysis.warningCount} Warnings</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold ${criticalIssues.length > 0 ? "bg-red-500 text-white animate-pulse" : "bg-red-500/20 text-red-300"}`}>
            <AlertCircle className="w-4 h-4" />
            <span>{criticalIssues.length} Critical</span>
          </div>
          {loadingDbAudit && (
            <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium px-2">
              <RefreshCw className="w-3 h-3 animate-spin text-primary" />
              <span>Checking site...</span>
            </div>
          )}
        </div>
      </div>

      {/* ── CRITICAL ISSUES BANNER (Always Prominent Regardless of Score) ──── */}
      {criticalIssues.length > 0 && (
        <div className="bg-red-600 text-white p-4 border-b border-red-700 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wider">
              <AlertOctagon className="w-5 h-5 text-amber-300" />
              <span>Critical Indexing / Technical Blockers ({criticalIssues.length})</span>
            </div>
            <span className="text-xs bg-red-800 text-white px-2 py-0.5 rounded font-bold">
              Must Resolve Before Publishing
            </span>
          </div>
          <p className="text-xs text-red-100">
            A high editorial score does not hide these issues. Search engines will fail to properly index or rank this page until resolved.
          </p>
          <div className="space-y-1.5 pt-1">
            {criticalIssues.map(issue => (
              <div key={issue.id} className="bg-red-700/80 p-2.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold">{issue.title}:</span>{" "}
                  <span className="text-red-100">{issue.issue}</span>
                </div>
                {issue.fixAction && (
                  <button
                    type="button"
                    onClick={() => handleApplySingle(issue)}
                    className="px-3 py-1 bg-white text-red-700 font-black rounded text-[11px] hover:bg-red-50 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                  >
                    {issue.fixAction.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Score Breakdown Modal / Drawer ─────────────────────────────────── */}
      {showScoreModal && (
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Transparent Editorial Score Breakdown</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowScoreModal(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Scores are calculated strictly from verifiable on-page elements. Points are never awarded for keyword stuffing, arbitrary length, or unverified backlinks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {analysis.scoreBreakdown.map(cat => (
              <div key={cat.category} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-slate-500 font-semibold block text-[11px]">{cat.category}</span>
                <span className="text-base font-black text-slate-900 block my-0.5">
                  {cat.earned} / {cat.max} pts
                </span>
                <p className="text-[10px] text-slate-400">{cat.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 overflow-x-auto gap-1">
        {[
          { id: "overview", label: "Checklist & Quality", icon: Layers, count: allChecksWithDb.filter(c => !c.passed).length },
          { id: "keyphrases", label: "5 Focus Keyphrases", icon: Star, count: analysis.keyphrasesData.length },
          { id: "serp", label: "SERP & Snippet", icon: Globe },
          { id: "slug_canonical", label: "URL & Canonical", icon: LinkIcon, count: (dbAudit?.slugConflict || dbAudit?.establishedSlugNeedsRedirect) ? 1 : undefined },
          { id: "headings", label: "Headings Outline", icon: Hash, count: analysis.totalHeadings },
          { id: "links_media", label: "Links & Media", icon: ImageIcon, count: analysis.imagesMissingAlt > 0 ? analysis.imagesMissingAlt : undefined },
          { id: "technical_schema", label: "Schema & Technical", icon: ShieldCheck },
          { id: "social", label: "Social Card", icon: Share2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive 
                  ? "border-primary text-primary bg-white shadow-xs" 
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? "bg-primary text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Toast Notice for Applied Changes ───────────────────────────────── */}
      {fixedNotice && (
        <div className="mx-6 mt-4 p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            {fixedNotice}
          </span>
          <button type="button" onClick={() => setFixedNotice(null)} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── TAB 1: OVERVIEW & ACTIONABLE CHECKLIST ─────────────────────────── */}
      {activeSubTab === "overview" && (
        <div className="p-6 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 min-w-0 overflow-hidden">
              <span className="text-slate-400 block font-semibold mb-1 truncate">Title Width</span>
              <span className={`text-base font-extrabold block truncate ${analysis.titlePixelWidth > 580 ? "text-amber-600" : "text-slate-900"}`}>
                {analysis.titlePixelWidth}px
              </span>
              <span className="text-[11px] text-slate-400 block truncate">max 580px ({analysis.titleLength} chars)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 min-w-0 overflow-hidden">
              <span className="text-slate-400 block font-semibold mb-1 truncate">Snippet Width</span>
              <span className={`text-base font-extrabold block truncate ${analysis.descPixelWidth > 960 ? "text-amber-600" : "text-slate-900"}`}>
                {analysis.descPixelWidth}px
              </span>
              <span className="text-[11px] text-slate-400 block truncate">max 960px ({analysis.descLength} chars)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 min-w-0 overflow-hidden">
              <span className="text-slate-400 block font-semibold mb-1 truncate">Word Count</span>
              <span className="text-base font-extrabold text-slate-900 block truncate">
                {analysis.wordCount} words
              </span>
              <span className="text-[11px] text-slate-400 block truncate">~{analysis.readingTimeMinutes} min read</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 min-w-0 overflow-hidden">
              <span className="text-slate-400 block font-semibold mb-1 truncate">Headings Ratio</span>
              <span className={`text-base font-extrabold block truncate ${analysis.wordsPerHeading < 40 && analysis.totalHeadings >= 10 ? "text-amber-600" : "text-slate-900"}`}>
                {analysis.totalHeadings} <span className="text-xs font-normal text-slate-500">headings</span>
              </span>
              <span className="text-[11px] text-slate-400 block truncate">~{analysis.wordsPerHeading} words/section</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 min-w-0 overflow-hidden">
              <span className="text-slate-400 block font-semibold mb-1 truncate">Images Alt Text</span>
              <span className={`text-base font-extrabold block truncate ${analysis.imagesMissingAlt > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {analysis.imagesMissingAlt} missing
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {analysis.imagesMissingAlt === 0 ? "All labeled" : `${analysis.totalImages} total images`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 min-w-0 overflow-hidden">
              <span className="text-slate-400 block font-semibold mb-1 truncate">Canonical State</span>
              <span className="text-base font-extrabold text-slate-900 block truncate">
                {data.canonicalUrl ? "Custom" : "Self-Referential"}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                {data.robots?.includes("noindex") ? "noindex set" : "index, follow"}
              </span>
            </div>
          </div>

          {/* Verification Status Legend */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
            <span className="font-extrabold text-slate-800">Check Status Types:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              ✓ [Verified] Code / Database Verified
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
              ~ [Estimated] Pixel &amp; Readability Heuristic
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
              🔍 [Requires Page Scan] Verifiable on Rendered URL
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
              📊 [External Data] Search Console / CWV Field Data
            </span>
          </div>

          {/* Severity Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Prioritized Editorial Checklist ({filteredRecs.length})</span>
              </h4>
              <p className="text-xs text-slate-500">
                Actionable recommendations with evidence and explicit rationale based on Google Search Central.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: "all", label: "All Outstanding" },
                { id: "critical", label: `Critical (${criticalIssues.length})` },
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

          {/* List of items */}
          {filteredRecs.length === 0 ? (
            <div className="text-center py-10 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-emerald-800 space-y-1">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
              <p className="font-extrabold text-sm">All checks in this category are satisfied!</p>
              <p className="text-xs text-emerald-600">Your article aligns with Google's on-page search best practices.</p>
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

                const statusBadge = {
                  verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  estimated: "bg-blue-50 text-blue-700 border-blue-200",
                  requires_scan: "bg-purple-50 text-purple-700 border-purple-200",
                  requires_external: "bg-slate-100 text-slate-700 border-slate-200",
                  not_checked: "bg-slate-100 text-slate-600 border-slate-200",
                }[rec.statusType];

                const statusLabel = {
                  verified: "Verified",
                  estimated: "Estimated",
                  requires_scan: "Requires Page Scan",
                  requires_external: "External Data",
                  not_checked: "Not Checked",
                }[rec.statusType];

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
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${severityBadge}`}>
                            {rec.severity}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge}`}>
                            [{statusLabel}]
                          </span>
                          <h5 className="text-xs font-bold text-slate-900">{rec.title}</h5>
                        </div>

                        {rec.issue && (
                          <p className="text-xs text-slate-700 leading-relaxed font-medium">
                            <span className="font-bold text-slate-800">Issue:</span> {rec.issue}
                          </p>
                        )}

                        {rec.whyItMatters && (
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            <span className="font-semibold text-slate-700">Why it matters:</span> {rec.whyItMatters}
                          </p>
                        )}

                        {rec.suggestedAction && (
                          <p className="text-[11px] text-indigo-700 font-medium">
                            💡 <span className="font-semibold">Recommendation:</span> {rec.suggestedAction}
                          </p>
                        )}

                        {rec.evidence && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            Evidence: {rec.evidence}
                          </p>
                        )}
                      </div>

                      {/* Action buttons */}
                      {rec.fixAction && (
                        <div className="flex items-center gap-2 shrink-0">
                          {rec.fixAction.value !== undefined ? (
                            <button
                              type="button"
                              onClick={() => handleApplySingle(rec)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                              title="Review and apply this recommendation"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              <span>{rec.fixAction.label}</span>
                            </button>
                          ) : rec.fixAction.tabId && onJumpToTab ? (
                            <button
                              type="button"
                              onClick={() => onJumpToTab(rec.fixAction!.tabId!)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Go to Field</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: FIVE FOCUS KEYPHRASES HUB ───────────────────────────────── */}
      {activeSubTab === "keyphrases" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>5 Focus Keyphrases Hub (Google Guidance Standards)</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Designate 1 Primary Focus Keyphrase and up to 4 Secondary Keyphrases. All 5 are saved persistently in the database.
              Natural variations and stemming (e.g. &quot;proxy&quot; / &quot;proxies&quot;, &quot;setup&quot; / &quot;setups&quot;) are credited.
              Google ranking does not require rigid keyword density formulas.
            </p>
          </div>

          {/* Primary Keyphrase Input */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>1. Primary Focus Keyphrase</span>
              </label>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
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
                  const baseName = data.name || (data as any).title || "guide";
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
              The central search topic answering reader intent. Recommended in Title, Meta Description, URL, and Introduction.
            </p>
          </div>

          {/* Secondary Keyphrases Inputs */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Secondary Keyphrases (Up to 4)
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
                      handleAddSecondaryKey(e);
                    }
                  }}
                  placeholder="Add long-tail variation (e.g. android socks5 proxy setup) and press Add"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={handleAddSecondaryKey}
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
                <p className="text-xs text-slate-400 italic">No secondary keyphrases added yet. Add long-tail queries to capture related search intent.</p>
              )}
            </div>
          </div>

          {/* Keyphrase Placement Matrix Table */}
          <div className="space-y-3">
            <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Natural Keyphrase Placement &amp; Variations Matrix
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
                    <th className="py-2.5 px-3 text-right">Mentions (Variations)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {analysis.keyphrasesData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Please define a primary keyphrase above to populate the matrix.
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
                            km.status === "repetitive" || km.status === "stuffed"
                              ? "text-amber-600 font-bold" 
                              : km.count > 0 
                                ? "text-emerald-600" 
                                : "text-slate-400"
                          }>
                            {km.count}x {km.variationsFound.length > 1 ? `(${km.variationsFound.join(", ")})` : ""}
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

      {/* ── TAB 3: SERP & GOOGLE SNIPPET PREVIEW ────────────────────────────── */}
      {activeSubTab === "serp" && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span>Google Search Result Snippet Preview</span>
              </h4>
              <p className="text-xs text-slate-500">
                Pixel-width simulation for Google Desktop SERP (Title max 580px, Snippet max 960px).
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
                TVM
              </div>
              <div className="truncate">
                <span className="font-semibold text-slate-800">The Valid Market</span>
                <span className="text-slate-400 mx-1.5">›</span>
                <span className="text-slate-500">
                  {data.contentType === "blog" ? "blog" : "product"} › {data.slug || "article-slug"}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-medium text-blue-800 hover:underline leading-snug cursor-pointer line-clamp-2 pt-0.5">
              {data.seoTitle || data.name || "Untitled Article Title"}
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed pt-1 line-clamp-2">
              {data.metaDescription || data.excerpt || "Explore comprehensive tutorials, proxy setup walkthroughs, and verified software insights on The Valid Market."}
            </p>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Google Search Central Note:</strong> Google may dynamically adjust snippet text or generate snippets from page body content based on what best matches each specific search query. Defining a compelling meta description guides Google to use your preferred summary.
            </p>
          </div>

          {/* Interactive SERP Fields Editor */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 space-y-5">
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              <span>Live SERP Title &amp; Description Sync</span>
            </h5>

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
                    onClick={() => {
                      onUpdateField("seoTitle", analysis.suggestedTitle);
                      setFixedNotice(`✓ Applied suggested title: "${analysis.suggestedTitle}"`);
                      setTimeout(() => setFixedNotice(null), 3000);
                    }}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-xs"
                    title="Apply clean suggested title"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Apply Suggestion</span>
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
                      onClick={() => {
                        onUpdateField("metaDescription", analysis.suggestedMetaDescription);
                        setFixedNotice("✓ Applied suggested meta description");
                        setTimeout(() => setFixedNotice(null), 3000);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                      title="Apply clean suggested description"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Apply Suggested Description</span>
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
          </div>
        </div>
      )}

      {/* ── TAB 4: URL, SLUG, CANONICAL & INDEXING INSPECTOR ────────────────── */}
      {activeSubTab === "slug_canonical" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              <span>URL Slug, Canonical URL &amp; Indexing Directives</span>
            </h4>
            <p className="text-xs text-slate-500">
              Verify URL permanence, canonical consistency, and robots search indexing rules.
            </p>
          </div>

          {/* 301 Redirect Alert if published slug is being changed */}
          {dbAudit?.establishedSlugNeedsRedirect && (
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-black text-xs text-amber-900 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Established Published URL Slug Modification</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                This article is already published under <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">/blog/{dbAudit.oldSlug}</code>.
                When you save, the system will <strong>automatically create a 301 Permanent Redirect</strong> from the old URL to <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">/blog/{data.slug}</code> to preserve existing Google rankings and backlinks.
              </p>
            </div>
          )}

          {/* Slug Input with Live Validation */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Article URL Slug
              </label>
              {dbAudit?.slugConflict ? (
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Slug Conflict Detected</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Available</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-400 font-mono select-none">
                https://www.thevalidmarket.com/blog/
              </span>
              <input
                type="text"
                value={data.slug || ""}
                onChange={(e) => onUpdateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"))}
                placeholder="article-slug"
                className="flex-1 font-mono text-slate-900 font-semibold focus:outline-none bg-transparent"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Slugs must be lowercase, hyphenated, and never contain spaces or symbols.
            </p>
          </div>

          {/* Canonical URL Input */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Canonical URL Directive (&lt;link rel=&quot;canonical&quot;&gt;)
              </label>
              <span className="text-[11px] text-slate-400">
                {data.canonicalUrl ? "Custom Override" : "Self-Referential (Recommended)"}
              </span>
            </div>

            <input
              type="text"
              value={data.canonicalUrl || ""}
              onChange={(e) => onUpdateField("canonicalUrl", e.target.value)}
              placeholder={`Default: https://www.thevalidmarket.com/blog/${data.slug || "article-slug"}`}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-primary/50 focus:outline-none"
            />

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Leave blank to automatically use the standard self-referential published URL. If overriding, use a full absolute HTTPS URL without query strings.
            </p>
          </div>

          {/* Robots Indexing Directive */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Robots Indexing Directive (&lt;meta name=&quot;robots&quot;&gt;)
              </label>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                data.robots?.includes("noindex") ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
              }`}>
                {data.robots || "index, follow"}
              </span>
            </div>

            <div className="flex gap-3">
              {[
                { label: "Index & Follow (Standard)", value: "index, follow", desc: "Allow search engines to index and rank this article." },
                { label: "Noindex, Nofollow (Private)", value: "noindex, nofollow", desc: "Strictly exclude from Google Search and XML sitemaps." },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateField("robots", opt.value)}
                  className={`flex-1 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    data.robots === opt.value || (!data.robots && opt.value === "index, follow")
                      ? "border-primary bg-primary/5 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-xs block text-slate-900">{opt.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: HEADINGS & DOCUMENT OUTLINE ──────────────────────────────── */}
      {activeSubTab === "headings" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              <span>Headings Hierarchy &amp; Document Outline</span>
            </h4>
            <p className="text-xs text-slate-500">
              Strict Single-H1 check (the page title acts as H1; article body headings should be H2/H3).
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className={`p-4 rounded-xl border ${analysis.h1CountInContent > 0 ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
              <span className="font-extrabold block text-sm">H1 Tags in Body</span>
              <span className="text-2xl font-black">{analysis.h1CountInContent}</span>
              <p className="text-[11px] mt-1">
                {analysis.h1CountInContent === 0 ? "Perfect single H1 layout." : "Demote <h1> to <h2> so only the page title is H1."}
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
              <span className="font-extrabold block text-sm">H2 Subsections</span>
              <span className="text-2xl font-black text-slate-900">{analysis.h2Count}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Major topical sections.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
              <span className="font-extrabold block text-sm">H3 Deep Dives</span>
              <span className="text-2xl font-black text-slate-900">{analysis.h3Count}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Sub-points nested under H2.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-800">
              <span className="font-extrabold block text-sm">Heading Density</span>
              <span className="text-2xl font-black text-slate-900">{analysis.totalHeadings}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                ~{analysis.wordsPerHeading} words per section.
              </p>
            </div>
          </div>

          {/* Heading Outline Tree */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
              Document Outline Tree
            </span>

            {analysis.headingsList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No headings found in article body. Use H2 headings in the editor to structure your points.
              </p>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                {/* Visual root H1 */}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px]">H1</span>
                  <span className="truncate">{data.name || "Main Page Title (Storefront Template Header)"}</span>
                  <span className="text-[10px] text-indigo-600 font-normal ml-auto">Layout Title</span>
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
                      style={{ marginLeft: `${Math.min(48, (h.level - 1) * 16)}px` }}
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

      {/* ── TAB 6: LINKS & MEDIA ASSISTANT ─────────────────────────────────── */}
      {activeSubTab === "links_media" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" />
              <span>Smart Internal Link Suggestions &amp; Image Alt Audit</span>
            </h4>
            <p className="text-xs text-slate-500">
              Internal links suggest real published site URLs from your catalog. Never invent URLs or report unchecked links as broken.
            </p>
          </div>

          {/* Real Internal Link Suggestions from DB */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-primary" />
                <span>Real Site Internal Link Suggestions (Click to Insert)</span>
              </label>
              <span className="text-[11px] text-slate-400">Active Catalog URLs</span>
            </div>

            {dbAudit?.siteLinks ? (
              <div className="space-y-3">
                {/* Related Articles */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Published Articles</span>
                  <div className="flex flex-wrap gap-2">
                    {dbAudit.siteLinks.articles.map(art => (
                      <button
                        key={art.url}
                        type="button"
                        onClick={() => handleInsertInternalLink(art.url, art.title)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <span className="truncate max-w-[220px]">{art.title}</span>
                        <Plus className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular Products */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Top Products &amp; Tools</span>
                  <div className="flex flex-wrap gap-2">
                    {dbAudit.siteLinks.products.map(prod => (
                      <button
                        key={prod.url}
                        type="button"
                        onClick={() => handleInsertInternalLink(prod.url, prod.title)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <span className="truncate max-w-[220px]">{prod.title}</span>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase">{prod.type}</span>
                        <Plus className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">Catalog Categories</span>
                  <div className="flex flex-wrap gap-2">
                    {dbAudit.siteLinks.categories.map(cat => (
                      <button
                        key={cat.url}
                        type="button"
                        onClick={() => handleInsertInternalLink(cat.url, cat.title)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <span className="truncate max-w-[220px]">{cat.title}</span>
                        <Plus className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Loading real catalog suggestions from database...</p>
            )}
          </div>

          {/* Image Alt Audit */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span>Image Alt Text Audit ({analysis.totalImages} images total)</span>
            </h5>

            <div className="space-y-2">
              {/* Featured Image Row */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">Featured Image</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Alt: {data.featuredImageAlt ? `"${data.featuredImageAlt}"` : <span className="text-red-600 font-bold">Missing Alt Text</span>}
                  </span>
                </div>
                {!data.featuredImageAlt && data.name && (
                  <button
                    type="button"
                    onClick={() => onUpdateField("featuredImageAlt", `${data.name} Guide - The Valid Market`)}
                    className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    Generate Alt
                  </button>
                )}
              </div>

              {/* Inline images with missing alt */}
              {analysis.missingAltSrcList.map((src, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-red-200 bg-red-50/50 flex items-center justify-between text-xs">
                  <div className="truncate mr-2">
                    <span className="font-bold text-red-700">Missing Alt:</span>{" "}
                    <span className="text-slate-600 font-mono text-[11px] truncate">{src}</span>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                    Label in Editor
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: STRUCTURED DATA & TECHNICAL STATUS ──────────────────────── */}
      {activeSubTab === "technical_schema" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Schema.org Structured Data &amp; Core Web Vitals Status</span>
            </h4>
            <p className="text-xs text-slate-500">
              Validates Schema.org BlogPosting JSON-LD and explains verified vs external performance standards.
            </p>
          </div>

          {/* Schema.org BlogPosting Preview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Schema.org BlogPosting JSON-LD (Generated on Storefront)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                [Verified Implementation]
              </span>
            </div>
            <pre className="text-[11px] font-mono overflow-x-auto p-3 bg-black/40 rounded-lg text-slate-300 leading-relaxed max-h-56">
{`{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "${getBaseUrl()}/blog/${data.slug || "slug"}"
  },
  "headline": "${data.seoTitle || data.name || "Article Headline"}",
  "description": "${data.metaDescription || data.excerpt || ""}",
  "image": ["${data.featuredImage || `${getBaseUrl()}/og-image.jpg`}"],
  "datePublished": "ISO 8601 Timestamp",
  "dateModified": "ISO 8601 Timestamp",
  "author": {
    "@type": "Organization",
    "name": "The Valid Market Editorial Team",
    "url": "${getBaseUrl()}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "The Valid Market",
    "url": "${getBaseUrl()}",
    "logo": {
      "@type": "ImageObject",
      "url": "${getBaseUrl()}/logo.png"
    }
  }
}`}
            </pre>
          </div>

          {/* Core Web Vitals Standards (Google 2026 Reference) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-primary" />
                <span>Core Web Vitals Thresholds (Google Official Standards)</span>
              </h5>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                [Requires External Data]
              </span>
            </div>

            <p className="text-xs text-slate-500">
              The editor evaluates on-page text and markup. Live Core Web Vitals are measured in the field by real Google Chrome users:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Largest Contentful Paint (LCP)</span>
                <span className="text-sm font-black text-emerald-600 block my-0.5">&le; 2.5 seconds</span>
                <p className="text-[10px] text-slate-400">Next.js &lt;Image priority&gt; handles hero images.</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Interaction to Next Paint (INP)</span>
                <span className="text-sm font-black text-emerald-600 block my-0.5">&le; 200 milliseconds</span>
                <p className="text-[10px] text-slate-400">Replaced FID in Google Core Web Vitals.</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold block text-[11px]">Cumulative Layout Shift (CLS)</span>
                <span className="text-sm font-black text-emerald-600 block my-0.5">&le; 0.1 score</span>
                <p className="text-[10px] text-slate-400">Explicit image aspect-ratios prevent shifting.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 8: SOCIAL CARD (OG & TWITTER) ──────────────────────────────── */}
      {activeSubTab === "social" && (
        <div className="p-6 space-y-6">
          <div className="space-y-1 pb-3 border-b border-slate-100">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <span>Social Media Sharing Card (OpenGraph &amp; Twitter / X)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Control how links appear when shared on Telegram, Discord, X, or WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Social Link Card Preview
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">thevalidmarket.com</span>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                    {data.ogTitle || data.seoTitle || data.name || "Headline Title"}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {data.ogDescription || data.metaDescription || data.excerpt || "Explore verified solutions and tutorials on The Valid Market."}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Social Fields */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Social Card Fields
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

    </div>
  );
}
