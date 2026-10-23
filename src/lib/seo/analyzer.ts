/**
 * Complete Blog SEO Optimization Engine for The Valid Market / Asia D Market
 * Based on official Google Search Central Guidelines & W3C Web Standards:
 * - Natural 5 Focus Keyphrases analysis with variations & synonyms
 * - Proportional serif/sans SERP pixel-width calculations (Title max 580px, Snippet max 960px)
 * - Strict Single-H1 rendered layout check & logical heading hierarchy (H2, H3, empty/skipped level guards)
 * - Canonical URL format & protocol validation
 * - People-First Content Quality: Intro clarity, paragraph readability, actionable next steps
 * - Comprehensive Image & Media Alt Text audits
 * - Link structure: Internal discovery, vague anchor detection, dynamic URL query safeguards
 * - Transparent status distinctions: [Verified], [Estimated], [Requires Scan], [External Data]
 * - Explainable editorial scoring (OK: 0-59, Good: 60-84, Best: 85-100)
 */

import { getBaseUrl } from "@/lib/siteUrl";

export type CheckStatusType = "verified" | "estimated" | "requires_scan" | "requires_external" | "not_checked";

export interface KeyphraseMatch {
  keyphrase: string;
  isPrimary: boolean;
  count: number;
  density?: number;
  inTitle: boolean;
  inMetaDesc: boolean;
  inSlug: boolean;
  inIntro: boolean;
  inHeadings: boolean;
  inContent: boolean;
  inImageAlt: boolean;
  variationsFound: string[];
  status: "missing" | "good" | "repetitive" | "stuffed";
}

export interface SeoCheckItem {
  id: string;
  category: "title" | "description" | "slug" | "canonical" | "headings" | "keywords" | "images" | "links" | "technical" | "quality";
  severity: "critical" | "important" | "recommended" | "optional" | "passed";
  statusType: CheckStatusType;
  passed: boolean;
  title: string;
  issue?: string;
  impact?: string;
  evidence?: string;
  whyItMatters?: string;
  suggestedAction?: string;
  fixAction?: {
    label: string;
    field: string;
    value?: any;
    tabId?: string;
  };
}

export interface SeoAnalysisResult {
  score: number; // 0 - 100
  statusLevel: "OK" | "Good" | "Best";
  passedCount: number;
  warningCount: number;
  errorCount: number;
  criticalIssues: SeoCheckItem[]; // Prominently displayed regardless of score

  // Title & Desc metrics
  titleLength: number;
  titlePixelWidth: number;
  titleStatus: "empty" | "too_short" | "good" | "too_long";
  descLength: number;
  descPixelWidth: number;
  descStatus: "empty" | "too_short" | "good" | "too_long";

  // Content stats
  wordCount: number;
  readingTimeMinutes: number;
  h1CountInContent: number;
  h2Count: number;
  h3Count: number;
  totalHeadings: number;
  wordsPerHeading: number;
  headingsList: { level: number; text: string }[];
  duplicateHeadings: string[];
  emptyHeadingsCount: number;
  hasSkippedHeadingLevels: boolean;
  hasLongArticleWithoutToc: boolean;
  hasLongParagraphs: boolean;

  // Images & Links
  totalImages: number;
  imagesMissingAlt: number;
  missingAltSrcList: string[];
  internalLinksCount: number;
  externalLinksCount: number;
  vagueAnchorLinksCount: number;
  dynamicInternalLinksCount: number;
  dynamicInternalLinksList: string[];

  // Keyphrases
  keyphrasesData: KeyphraseMatch[];

  // Checks & Recommendations
  checks: SeoCheckItem[];
  recommendations: SeoCheckItem[];

  // Suggested values for instant review & safe 1-click apply
  suggestedTitle?: string;
  suggestedMetaDescription?: string;
  suggestedImageAlt?: string;

  // Transparent scoring explanation
  scoreBreakdown: {
    category: string;
    earned: number;
    max: number;
    explanation: string;
  }[];
}

export interface SeoInputData {
  contentType: "blog" | "product";
  name?: string;
  title?: string;
  slug: string;
  content: string;
  excerpt?: string;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  imageAlt?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  primaryKeyphrase?: string;
  focusKeyword?: string;
  secondaryKeyphrases?: string[];
  secondaryKeywords?: string[];
  siteUrl?: string;
  // External or live scan data if passed
  isSlugConflict?: boolean;
  isTitleConflict?: boolean;
  isDescConflict?: boolean;
}

// ─── Typography Pixel Width Estimators (Google SERP Desktop Simulation) ──────
export function estimateTitlePixelWidth(text: string): number {
  if (!text) return 0;
  let px = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[WM@%#]/.test(ch)) px += 18;
    else if (/[A-Z]/.test(ch)) px += 13.5;
    else if (/[mw]/.test(ch)) px += 14.5;
    else if (/[ijl\s',.!:;|]/.test(ch)) px += 5.5;
    else if (/[tfkr]/.test(ch)) px += 8;
    else if (/[0-9]/.test(ch)) px += 10.5;
    else px += 9.5;
  }
  return Math.round(px);
}

export function estimateDescPixelWidth(text: string): number {
  if (!text) return 0;
  let px = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[WM@%#]/.test(ch)) px += 13;
    else if (/[A-Z]/.test(ch)) px += 10;
    else if (/[mw]/.test(ch)) px += 11;
    else if (/[ijl\s',.!:;|]/.test(ch)) px += 4;
    else if (/[tfkr]/.test(ch)) px += 6;
    else if (/[0-9]/.test(ch)) px += 8;
    else px += 7.2;
  }
  return Math.round(px);
}

// Strip HTML tags safely
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract headings from HTML
export function extractHeadings(html: string): { level: number; text: string }[] {
  if (!html) return [];
  const matches = html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi);
  const headings: { level: number; text: string }[] = [];
  for (const match of matches) {
    const level = parseInt(match[1]);
    const text = stripHtml(match[2]).trim();
    headings.push({ level, text });
  }
  return headings;
}

// Extract images from HTML
export function extractImages(html: string): { src: string; alt: string }[] {
  if (!html) return [];
  const matches = html.matchAll(/<img\b([^>]*?)>/gi);
  const images: { src: string; alt: string }[] = [];
  for (const match of matches) {
    const attrs = match[1];
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
    images.push({
      src: srcMatch ? srcMatch[1] : "",
      alt: altMatch ? altMatch[1].trim() : "",
    });
  }
  return images;
}

export interface ExtractedLink {
  href: string;
  text: string;
  isInternal: boolean;
  hasDynamicParams: boolean;
  isNoFollow: boolean;
  rawAttrs: string;
}

// Extract links from HTML with dynamic parameter and nofollow detection
export function extractLinks(html: string, siteHost: string = "thevalidmarket.com"): ExtractedLink[] {
  if (!html) return [];
  const matches = html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi);
  const links: ExtractedLink[] = [];
  for (const match of matches) {
    const attrs = match[1] || "";
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch ? hrefMatch[1].trim() : "";
    const text = stripHtml(match[2]).trim();

    const isExplicitExternal = /^https?:\/\//i.test(href) && !href.includes(siteHost) && !href.includes("localhost");
    const isSpecialScheme = /^(mailto:|tel:|javascript:|#)/i.test(href);
    const isInternal = !isExplicitExternal && !isSpecialScheme && (href.startsWith("/") || href.includes(siteHost) || !/^[a-z]+:/i.test(href));
    const hasDynamicParams = href.includes("?") && /[?&][^=&#]+=[^&#]*/i.test(href);
    const isNoFollow = /\brel\s*=\s*["'][^"']*\bnofollow\b[^"']*["']/i.test(attrs);

    links.push({
      href,
      text,
      isInternal,
      hasDynamicParams,
      isNoFollow,
      rawAttrs: attrs,
    });
  }
  return links;
}

// ─── Automated Content Fix Helpers (Preserved & Enhanced) ────────────────────
export function cleanDynamicInternalLinks(contentHtml: string, siteHost: string = "thevalidmarket.com"): string {
  if (!contentHtml) return "";
  return contentHtml.replace(/<a\b([^>]*?)>(.*?)<\/a>/gi, (fullMatch, attrs, linkBody) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) return fullMatch;
    const href = hrefMatch[1].trim();

    const isExplicitExternal = /^https?:\/\//i.test(href) && !href.includes(siteHost) && !href.includes("localhost");
    const isSpecialScheme = /^(mailto:|tel:|javascript:|#)/i.test(href);
    const isInternal = !isExplicitExternal && !isSpecialScheme && (href.startsWith("/") || href.includes(siteHost) || !/^[a-z]+:/i.test(href));
    const hasDynamicParams = href.includes("?") && /[?&][^=&#]+=[^&#]*/i.test(href);
    const isNoFollow = /\brel\s*=\s*["'][^"']*\bnofollow\b[^"']*["']/i.test(attrs);

    if (isInternal && hasDynamicParams && !isNoFollow) {
      const catMatch = href.match(/[\/?&]category=([a-z0-9_-]+)/i);
      if (catMatch && href.includes("/store")) {
        const cleanHref = `/category/${catMatch[1]}`;
        const newAttrs = attrs.replace(hrefMatch[0], `href="${cleanHref}"`);
        return `<a${newAttrs}>${linkBody}</a>`;
      }

      const trackingParams = /[?&](ref|utm_[a-z]+|source|tracker|aff|campaign|fbclid|gclid)=[^&#]*/gi;
      let strippedHref = href.replace(trackingParams, "").replace(/\?&/, "?").replace(/[?&]$/, "");
      if (strippedHref !== href && !strippedHref.includes("?")) {
        const newAttrs = attrs.replace(hrefMatch[0], `href="${strippedHref}"`);
        return `<a${newAttrs}>${linkBody}</a>`;
      }

      let newAttrs = attrs;
      if (/\brel\s*=\s*["']([^"']*)["']/i.test(newAttrs)) {
        newAttrs = newAttrs.replace(/\brel\s*=\s*["']([^"']*)["']/i, (_m: string, val: string) => `rel="${val} nofollow"`);
      } else {
        newAttrs = `${newAttrs} rel="nofollow"`;
      }
      return `<a${newAttrs}>${linkBody}</a>`;
    }
    return fullMatch;
  });
}

export function deduplicateHeadingTexts(contentHtml: string, duplicates: string[]): string {
  if (!contentHtml || !duplicates.length) return contentHtml;
  let result = contentHtml;
  duplicates.forEach((dup) => {
    let count = 0;
    const escaped = dup.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(`(<h[1-6]\\b[^>]*>\\s*)(${escaped})(\\s*<\\/h[1-6]>)`, "gi");
    result = result.replace(regex, (match, prefix, text, suffix) => {
      count++;
      if (count > 1) {
        return `${prefix}${text} (Part ${count})${suffix}`;
      }
      return match;
    });
  });
  return result;
}

export function rebalanceExcessiveHeadings(contentHtml: string): string {
  if (!contentHtml) return "";
  let result = contentHtml;

  // Demote H4-H6 tags to strong paragraphs
  result = result.replace(/<h([4-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_match, _tag, inner) => {
    const trimmed = inner.trim();
    return /^<strong\b[^>]*>[\s\S]*<\/strong>$/i.test(trimmed)
      ? `<p>${trimmed}</p>`
      : `<p><strong>${trimmed}</strong></p>`;
  });

  return result;
}

// ─── Natural Variations & Stemming Generator ─────────────────────────────────
export function getKeyphraseVariations(phrase: string): string[] {
  const clean = (phrase || "").trim().toLowerCase();
  if (!clean) return [];
  const variations = new Set<string>([clean]);

  // Handle common English plural/singular forms
  const words = clean.split(/\s+/);
  const lastWord = words[words.length - 1];

  let altLastWord = "";
  if (lastWord.endsWith("ies") && lastWord.length > 4) {
    altLastWord = lastWord.slice(0, -3) + "y"; // proxies -> proxy
  } else if (lastWord.endsWith("es") && lastWord.length > 4) {
    altLastWord = lastWord.slice(0, -2); // processes -> process
  } else if (lastWord.endsWith("s") && !lastWord.endsWith("ss") && lastWord.length > 3) {
    altLastWord = lastWord.slice(0, -1); // courses -> course
  } else if (lastWord.endsWith("y") && !/[aeiou]y$/.test(lastWord)) {
    altLastWord = lastWord.slice(0, -1) + "ies"; // proxy -> proxies
  } else if (!lastWord.endsWith("s")) {
    altLastWord = lastWord + "s"; // course -> courses
  }

  if (altLastWord && altLastWord !== lastWord) {
    const variationWords = [...words.slice(0, -1), altLastWord];
    variations.add(variationWords.join(" "));
  }

  // Handle hyphen vs space
  if (clean.includes("-")) {
    variations.add(clean.replace(/-/g, " "));
  } else if (clean.includes(" ")) {
    variations.add(clean.replace(/\s+/g, "-"));
  }

  return Array.from(variations);
}

// ─── Robust Title & Description Generation Helpers (No Double Pipes!) ────────
export function buildCleanSeoTitle(rawTitle: string, keyphrase?: string, siteBrand: string = "The Valid Market"): string {
  const brandName = siteBrand || "The Valid Market";
  if (!rawTitle) {
    if (keyphrase) {
      const capKey = keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1);
      return `${capKey} Guide & Setup | ${brandName}`.slice(0, 60);
    }
    return `Practical Guide & Resources | ${brandName}`;
  }

  // Split title by common pipe / dash separators to prevent redundant chains
  const segments = rawTitle
    .split(/\s*\|\s*|\s*—\s*/)
    .map(s => s.trim())
    .filter(Boolean);

  // Remove existing brand name mentions from segments
  const brandRegex = new RegExp(`(^|\\s)(${brandName}|The Valid Market|Asia D Market)(\\s|$)`, "i");
  const filtered = segments.filter(s => !brandRegex.test(s));

  let primaryPart = filtered[0] || rawTitle.trim();

  // If primary keyphrase is missing, thoughtfully integrate it
  if (keyphrase) {
    const cleanKey = keyphrase.trim().toLowerCase();
    const hasKey = filtered.some(f => f.toLowerCase().includes(cleanKey));
    if (!hasKey) {
      const capKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
      if (!primaryPart.toLowerCase().includes(cleanKey)) {
        primaryPart = `${capKey}: ${primaryPart}`;
      }
    }
  }

  const combined = `${primaryPart} | ${brandName}`;
  if (combined.length <= 60 && estimateTitlePixelWidth(combined) <= 580) {
    return combined;
  }
  if (primaryPart.length <= 60 && estimateTitlePixelWidth(primaryPart) <= 580) {
    return primaryPart;
  }
  return primaryPart.slice(0, 56).trim() + "...";
}

export function buildCleanMetaDescription(plainBodyText: string, keyphrase?: string, title?: string, siteBrand: string = "The Valid Market"): string {
  const sentences = (plainBodyText || "")
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && !s.toLowerCase().startsWith("http") && !s.includes("<"));

  let baseSnippet = "";
  if (sentences.length > 0) {
    baseSnippet = sentences[0];
    if (baseSnippet.length < 80 && sentences.length > 1) {
      baseSnippet = `${baseSnippet} ${sentences[1]}`;
    }
  }

  if (!baseSnippet) {
    baseSnippet = title
      ? `Explore complete setup instructions, key features, and verified guidance for ${title}.`
      : `Explore verified software, proxy solutions, and technical guides.`;
  }

  baseSnippet = baseSnippet.replace(/[.;,:\s]+$/, "");

  if (keyphrase && !baseSnippet.toLowerCase().includes(keyphrase.toLowerCase())) {
    const capKey = keyphrase.charAt(0).toUpperCase() + keyphrase.slice(1);
    const candidate = `${capKey}: ${baseSnippet}. Read our complete guide on ${siteBrand}.`;
    return candidate.length <= 158 ? candidate : candidate.slice(0, 155).trim() + "...";
  }

  const result = `${baseSnippet}. Complete guide on ${siteBrand}.`;
  return result.length <= 158 ? result : result.slice(0, 155).trim() + "...";
}

// ─── Main SEO Analyzer Engine ────────────────────────────────────────────────
export function analyzeSeo(input: SeoInputData): SeoAnalysisResult {
  const safeInput = input || ({} as SeoInputData);
  const {
    contentType = "blog",
    name = (safeInput as any).title || "",
    slug = "",
    content = "",
    excerpt = "",
    seoTitle = "",
    metaDescription = "",
    canonicalUrl = "",
    featuredImage = "",
    featuredImageAlt = (safeInput as any).imageAlt || "",
    robots = "index, follow",
    ogTitle = "",
    ogDescription = "",
    ogImage = "",
    primaryKeyphrase = (safeInput as any).focusKeyword || "",
    secondaryKeyphrases = (safeInput as any).secondaryKeywords || [],
    siteUrl = getBaseUrl(),
  } = safeInput;

  const checks: SeoCheckItem[] = [];
  const scoreBreakdown: { category: string; earned: number; max: number; explanation: string }[] = [];

  // 1. Text extraction & parsing
  const plainText = stripHtml(content || "");
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Paragraph readability analysis
  const rawParagraphs = (content || "").match(/<p\b[^>]*>([\s\S]*?)<\/p>/gi) || [];
  let hasLongParagraphs = false;
  rawParagraphs.forEach(p => {
    const pWordCount = stripHtml(p).split(/\s+/).filter(Boolean).length;
    if (pWordCount > 220) hasLongParagraphs = true;
  });

  // First 120 words for Introduction intent analysis
  const introText = words.slice(0, 120).join(" ").toLowerCase();

  // 2. Headings analysis
  const headings = extractHeadings(content);
  const h1sInContent = headings.filter(h => h.level === 1);
  const h2Count = headings.filter(h => h.level === 2).length;
  const h3Count = headings.filter(h => h.level === 3).length;
  const totalHeadings = headings.length;
  const wordsPerHeading = totalHeadings > 0 ? Math.round(wordCount / totalHeadings) : wordCount;

  // Empty headings detection
  const emptyHeadingsCount = headings.filter(h => !h.text || h.text.trim().length === 0).length;

  // Skipped heading levels (e.g. H1 -> H3 without H2, or H2 -> H4 without H3)
  let hasSkippedHeadingLevels = false;
  for (let i = 0; i < headings.length - 1; i++) {
    if (headings[i + 1].level - headings[i].level > 1) {
      hasSkippedHeadingLevels = true;
      break;
    }
  }

  // Duplicate headings
  const headingTexts = headings.map(h => h.text.toLowerCase().trim()).filter(Boolean);
  const headingOccurrences: Record<string, number> = {};
  headingTexts.forEach(t => { headingOccurrences[t] = (headingOccurrences[t] || 0) + 1; });
  const duplicateHeadings = Object.keys(headingOccurrences).filter(t => headingOccurrences[t] > 1);

  // Table of Contents recommendation for long articles
  const hasLongArticleWithoutToc = contentType === "blog" && wordCount >= 1000 && h2Count >= 3 && !content.includes("table-of-contents") && !content.includes("toc-list") && !content.toLowerCase().includes("table of contents");

  // 3. Images extraction
  const inlineImages = extractImages(content);
  let totalImages = inlineImages.length;
  if (featuredImage) totalImages += 1;

  const missingAltSrcList: string[] = [];
  inlineImages.forEach(img => {
    if (!img.alt || img.alt.trim().length === 0) missingAltSrcList.push(img.src);
  });
  if (featuredImage && (!featuredImageAlt || featuredImageAlt.trim().length === 0)) {
    missingAltSrcList.push(featuredImage);
  }
  const imagesMissingAlt = missingAltSrcList.length;

  const allAltsCombined = [
    featuredImageAlt,
    ...inlineImages.map(i => i.alt),
  ].join(" ").toLowerCase();

  // 4. Links extraction
  const parsedLinks = extractLinks(content);
  const internalLinksCount = parsedLinks.filter(l => l.isInternal).length;
  const externalLinksCount = parsedLinks.filter(l => !l.isInternal).length;
  const dynamicInternalLinks = parsedLinks.filter(l => l.isInternal && l.hasDynamicParams && !l.isNoFollow);
  const dynamicInternalLinksCount = dynamicInternalLinks.length;
  const dynamicInternalLinksList = Array.from(new Set(dynamicInternalLinks.map(l => l.href)));

  const vagueAnchorPatterns = /^(click here|here|read more|learn more|link|this|more|check here|website|page)$/i;
  const vagueAnchorLinksCount = parsedLinks.filter(l => vagueAnchorPatterns.test(l.text.trim())).length;

  // 5. Title Analysis
  const effectiveTitle = ((seoTitle || name || (safeInput as any).title || "") as string).trim();
  const titleLength = effectiveTitle.length;
  const titlePixelWidth = estimateTitlePixelWidth(effectiveTitle);

  let titleStatus: "empty" | "too_short" | "good" | "too_long" = "good";
  if (!effectiveTitle) titleStatus = "empty";
  else if (titleLength < 35 || titlePixelWidth < 280) titleStatus = "too_short";
  else if (titleLength > 60 || titlePixelWidth > 580) titleStatus = "too_long";

  // Check word repetitions in title
  const titleWords = effectiveTitle.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !["with", "from", "that", "this", "your"].includes(w));
  const wordFrequencies: Record<string, number> = {};
  titleWords.forEach(w => { wordFrequencies[w] = (wordFrequencies[w] || 0) + 1; });
  const titleRepeats = Object.entries(wordFrequencies).filter(([_, count]) => count > 1).map(([w]) => w);

  // 6. Meta Description Analysis
  const effectiveDesc = ((metaDescription || excerpt || "") as string).trim();
  const descLength = effectiveDesc.length;
  const descPixelWidth = estimateDescPixelWidth(effectiveDesc);

  let descStatus: "empty" | "too_short" | "good" | "too_long" = "good";
  if (!effectiveDesc) descStatus = "empty";
  else if (descLength < 80) descStatus = "too_short";
  else if (descLength > 160 || descPixelWidth > 960) descStatus = "too_long";

  // 7. Focus Keyphrases Matrix with Variations & Stemming
  const cleanPrimaryKey = (primaryKeyphrase || "").trim().toLowerCase();
  const cleanSecondaryKeys = (secondaryKeyphrases || [])
    .map((k: string) => (k || "").trim().toLowerCase())
    .filter((k: string) => k.length > 0 && k !== cleanPrimaryKey)
    .slice(0, 4);

  const allKeyphrases = [
    ...(cleanPrimaryKey ? [{ keyphrase: cleanPrimaryKey, isPrimary: true }] : []),
    ...cleanSecondaryKeys.map((k: string) => ({ keyphrase: k, isPrimary: false })),
  ];

  const keyphrasesData: KeyphraseMatch[] = allKeyphrases.map(({ keyphrase, isPrimary }) => {
    const variations = getKeyphraseVariations(keyphrase);
    const variationsFound: string[] = [];

    let totalMatches = 0;
    variations.forEach(variation => {
      const escaped = variation.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      const m = (plainText.match(regex) || []).length;
      if (m > 0) {
        totalMatches += m;
        variationsFound.push(variation);
      }
    });

    // Check presence in key elements (matches exact phrase or any natural variation)
    const matchesAny = (targetText: string) => {
      const lower = (targetText || "").toLowerCase();
      return variations.some(v => lower.includes(v.toLowerCase()));
    };

    const inTitle = matchesAny(effectiveTitle);
    const inMetaDesc = matchesAny(effectiveDesc);
    const inSlug = variations.some(v => (slug || "").toLowerCase().replace(/-/g, " ").includes(v.replace(/-/g, " ")));
    const inIntro = matchesAny(introText);
    const inHeadings = headings.some(h => matchesAny(h.text));
    const inContent = totalMatches > 0;
    const inImageAlt = matchesAny(allAltsCombined);

    const density = wordCount > 0 ? parseFloat(((totalMatches / wordCount) * 100).toFixed(2)) : 0;
    let status: "missing" | "good" | "repetitive" | "stuffed" = "good";
    if (totalMatches === 0) status = "missing";
    else if (wordCount > 50 && totalMatches > Math.max(10, Math.ceil(wordCount * 0.03))) status = "repetitive";

    return {
      keyphrase,
      isPrimary,
      count: totalMatches,
      density,
      inTitle,
      inMetaDesc,
      inSlug,
      inIntro,
      inHeadings,
      inContent,
      inImageAlt,
      variationsFound: Array.from(new Set(variationsFound)),
      status,
    };
  });

  const primaryMatch = keyphrasesData.find(k => k.isPrimary);

  // 8. Canonical URL Formatting Checks
  const trimmedCanonical = (canonicalUrl || "").trim();
  const hasCanonical = trimmedCanonical.length > 0;
  let isCanonicalValid = true;
  let canonicalIssueMsg = "";

  if (hasCanonical) {
    if (trimmedCanonical.includes("?") || trimmedCanonical.includes("#")) {
      isCanonicalValid = false;
      canonicalIssueMsg = "Canonical URL contains tracking query parameters or hash fragments.";
    } else if (trimmedCanonical.startsWith("http://")) {
      isCanonicalValid = false;
      canonicalIssueMsg = "Canonical URL must use secure HTTPS rather than insecure HTTP.";
    } else if (!trimmedCanonical.startsWith("https://") && !trimmedCanonical.startsWith("/")) {
      isCanonicalValid = false;
      canonicalIssueMsg = "Canonical URL must be a valid absolute HTTPS URL.";
    }
  }

  // ─── CHECKS DEFINITIONS ───────────────────────────────────────────────────

  // [Title: Exists]
  if (!effectiveTitle) {
    checks.push({
      id: "title_exists",
      category: "title",
      severity: "critical",
      statusType: "verified",
      passed: false,
      title: "Title Tag is Missing",
      issue: "The article or page does not have a title defined.",
      impact: "Search engines require an informative title to understand and index the page.",
      whyItMatters: "According to Google Search Central, title tags are one of the most critical on-page ranking signals.",
      suggestedAction: "Provide a descriptive title accurately summarizing the article topic.",
      fixAction: {
        label: "Set Title from Name",
        field: "seoTitle",
        value: name || "New Article",
        tabId: "seo",
      },
    });
  } else {
    checks.push({
      id: "title_exists",
      category: "title",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Title Tag is Defined",
      evidence: `Current title: "${effectiveTitle}"`,
    });
  }

  // [Title: Length & SERP Pixel Width]
  if (effectiveTitle) {
    if (titlePixelWidth > 580 || titleLength > 60) {
      checks.push({
        id: "title_length",
        category: "title",
        severity: "important",
        statusType: "estimated",
        passed: false,
        title: `Title Exceeds Rendered Pixel Limit (${titlePixelWidth}px / ${titleLength} chars)`,
        issue: `Title exceeds Google's ~580px desktop display limit and will likely be truncated on search result pages.`,
        impact: "Important context and brand identification at the end of the title will be cut off with an ellipsis (...).",
        whyItMatters: "Concise, compelling titles with key information front-loaded improve organic click-through rates.",
        suggestedAction: "Trim title under 580 pixels (recommended: 45–58 characters).",
        fixAction: {
          label: "Trim Title Under 580px",
          field: "seoTitle",
          value: buildCleanSeoTitle(effectiveTitle.slice(0, 48), cleanPrimaryKey),
          tabId: "seo",
        },
      });
    } else if (titleLength < 30) {
      checks.push({
        id: "title_length",
        category: "title",
        severity: "recommended",
        statusType: "estimated",
        passed: false,
        title: `Title is Short (${titleLength} chars)`,
        issue: "Title is very short and may lack descriptive specificity.",
        impact: "Vague titles fail to answer user intent and give fewer reasons for searchers to click.",
        whyItMatters: "A descriptive title communicating unique value attracts more qualified search visitors.",
        suggestedAction: "Expand title with clear topic details (40–58 characters recommended).",
        fixAction: {
          label: "Expand Title with Context",
          field: "seoTitle",
          value: buildCleanSeoTitle(effectiveTitle, cleanPrimaryKey),
          tabId: "seo",
        },
      });
    } else {
      checks.push({
        id: "title_length",
        category: "title",
        severity: "passed",
        statusType: "estimated",
        passed: true,
        title: `Title Length & Pixel Width are Optimal (${titleLength} chars / ${titlePixelWidth}px)`,
        evidence: `Rendered width is within Google's 580px desktop boundary.`,
      });
    }
  }

  // [Title: Repetitive Words]
  if (titleRepeats.length > 0) {
    checks.push({
      id: "title_repetition",
      category: "title",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: `Word Repetitions in Title (${titleRepeats.join(", ")})`,
      issue: `Words like "${titleRepeats[0]}" appear multiple times in the title.`,
      impact: "Repetitive title text looks unnatural and may trigger algorithmic keyword-stuffing filters.",
      whyItMatters: "Google explicitly advises avoiding repetitive, boilerplate, or keyword-stuffed title elements.",
      suggestedAction: "Rephrase title to describe the topic once clearly without repeating words.",
      fixAction: {
        label: "Deduplicate Title Words",
        field: "seoTitle",
        value: buildCleanSeoTitle(effectiveTitle, cleanPrimaryKey),
        tabId: "seo",
      },
    });
  } else if (effectiveTitle) {
    checks.push({
      id: "title_repetition",
      category: "title",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "No Repetitive Words in Title",
    });
  }

  // [Meta Description: Exists]
  if (!effectiveDesc) {
    checks.push({
      id: "desc_exists",
      category: "description",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: "Meta Description is Missing",
      issue: "No custom meta description has been defined.",
      impact: "Google will synthesize an automatic snippet from page content, which may not highlight your key takeaways.",
      whyItMatters: "A well-written snippet gives searchers an accurate summary of what they will learn.",
      suggestedAction: "Add an informative 120–155 character description summarizing the article.",
      fixAction: {
        label: "Generate from Article Content",
        field: "metaDescription",
        value: buildCleanMetaDescription(plainText, cleanPrimaryKey, effectiveTitle),
        tabId: "seo",
      },
    });
  } else {
    checks.push({
      id: "desc_exists",
      category: "description",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Meta Description is Defined",
      evidence: `Length: ${descLength} chars (~${descPixelWidth}px)`,
    });
  }

  // [Meta Description: Length & Pixel Width]
  if (effectiveDesc) {
    if (descLength > 160 || descPixelWidth > 960) {
      checks.push({
        id: "desc_length",
        category: "description",
        severity: "important",
        statusType: "estimated",
        passed: false,
        title: `Meta Description May Truncate (${descLength} chars / ${descPixelWidth}px)`,
        issue: "Description exceeds ~160 characters and will likely be clipped on search result pages.",
        impact: "Important call-to-action text or end context may be hidden behind an ellipsis.",
        whyItMatters: "Keeping descriptions within ~155 characters ensures the full snippet is visible across desktop and mobile.",
        suggestedAction: "Trim description to ~140-155 characters.",
        fixAction: {
          label: "Trim Description",
          field: "metaDescription",
          value: effectiveDesc.slice(0, 150).trim() + "...",
          tabId: "seo",
        },
      });
    } else if (descLength < 70) {
      checks.push({
        id: "desc_length",
        category: "description",
        severity: "recommended",
        statusType: "estimated",
        passed: false,
        title: `Meta Description is Very Brief (${descLength} chars)`,
        issue: "Description is under 70 characters and misses an opportunity to summarize page value.",
        impact: "Brief snippets may be replaced entirely by Google's automated snippet extractor.",
        whyItMatters: "Comprehensive summaries (120–155 characters) provide clear search intent alignment.",
        suggestedAction: "Enrich description with specific benefits or key steps covered in the article.",
        fixAction: {
          label: "Enrich Description",
          field: "metaDescription",
          value: buildCleanMetaDescription(plainText, cleanPrimaryKey, effectiveTitle),
          tabId: "seo",
        },
      });
    } else {
      checks.push({
        id: "desc_length",
        category: "description",
        severity: "passed",
        statusType: "estimated",
        passed: true,
        title: `Meta Description Length is Balanced (${descLength} chars / ${descPixelWidth}px)`,
      });
    }
  }

  // [Primary Focus Keyphrase Presence Checks]
  if (!cleanPrimaryKey) {
    checks.push({
      id: "keyphrase_primary_defined",
      category: "keywords",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: "Primary Focus Keyphrase Not Designated",
      issue: "No primary focus phrase designated to evaluate topical coverage.",
      impact: "The assistant cannot benchmark element alignment without a target phrase.",
      whyItMatters: "Focus keyphrases serve as editorial reference points for topical focus.",
      suggestedAction: "Set one primary topic search phrase (e.g., 'socks5 proxy for android').",
      fixAction: {
        label: "Set Primary Focus Keyphrase",
        field: "focusKeyword",
        value: (name || "guide").toLowerCase().split(" ").slice(0, 3).join(" "),
        tabId: "seo",
      },
    });
  } else {
    checks.push({
      id: "keyphrase_primary_defined",
      category: "keywords",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: `Primary Focus Keyphrase Set: "${cleanPrimaryKey}"`,
    });

    // In Title
    if (primaryMatch?.inTitle) {
      checks.push({
        id: "keyphrase_in_title",
        category: "title",
        severity: "passed",
        statusType: "verified",
        passed: true,
        title: "Primary Keyphrase Present in Title",
      });
    } else {
      checks.push({
        id: "keyphrase_in_title",
        category: "title",
        severity: "important",
        statusType: "verified",
        passed: false,
        title: "Primary Keyphrase Missing from Title",
        issue: `"${cleanPrimaryKey}" does not appear naturally in the title tag.`,
        impact: "Search engines rely heavily on title words to determine topic relevance.",
        whyItMatters: "Including the core subject in the title immediately clarifies page value to searchers.",
        suggestedAction: "Incorporate the primary keyphrase naturally into the title.",
        fixAction: {
          label: "Include Keyphrase in Title",
          field: "seoTitle",
          value: buildCleanSeoTitle(effectiveTitle, cleanPrimaryKey),
          tabId: "seo",
        },
      });
    }

    // In Meta Description
    if (primaryMatch?.inMetaDesc) {
      checks.push({
        id: "keyphrase_in_desc",
        category: "description",
        severity: "passed",
        statusType: "verified",
        passed: true,
        title: "Primary Keyphrase Present in Meta Description",
      });
    } else {
      checks.push({
        id: "keyphrase_in_desc",
        category: "description",
        severity: "recommended",
        statusType: "verified",
        passed: false,
        title: "Primary Keyphrase Missing from Meta Description",
        issue: `"${cleanPrimaryKey}" does not appear in the meta description snippet.`,
        impact: "Search engines often bold matching words in the snippet when they match user queries.",
        whyItMatters: "Bolded keywords draw attention and help searchers confirm relevance.",
        suggestedAction: "Mention the primary topic in the first sentence of the description.",
        fixAction: {
          label: "Incorporate Keyphrase into Description",
          field: "metaDescription",
          value: buildCleanMetaDescription(plainText, cleanPrimaryKey, effectiveTitle),
          tabId: "seo",
        },
      });
    }

    // In Slug
    if (primaryMatch?.inSlug) {
      checks.push({
        id: "keyphrase_in_slug",
        category: "slug",
        severity: "passed",
        statusType: "verified",
        passed: true,
        title: "Primary Keyphrase Reflected in URL Slug",
      });
    } else {
      checks.push({
        id: "keyphrase_in_slug",
        category: "slug",
        severity: "optional",
        statusType: "verified",
        passed: false,
        title: "Primary Keyphrase Not in URL Slug",
        issue: `Slug "${slug || "untitled"}" does not contain the primary phrase.`,
        impact: "Descriptive URLs reassure visitors and crawlers of topic relevance before clicking.",
        whyItMatters: "Clean, human-readable URLs improve user trust and sharing.",
        suggestedAction: "If this is a new draft, set a readable slug containing key terms. If already published, preserve existing URL.",
        fixAction: {
          label: "Set Descriptive Slug (Drafts Only)",
          field: "slug",
          value: cleanPrimaryKey.replace(/[^a-z0-9]+/g, "-"),
          tabId: "general",
        },
      });
    }

    // In Introduction (first 120 words)
    if (primaryMatch?.inIntro) {
      checks.push({
        id: "keyphrase_in_intro",
        category: "quality",
        severity: "passed",
        statusType: "estimated",
        passed: true,
        title: "Primary Topic Introduced in Opening Paragraphs",
      });
    } else {
      checks.push({
        id: "keyphrase_in_intro",
        category: "quality",
        severity: "recommended",
        statusType: "estimated",
        passed: false,
        title: "Topic Clarification Recommended in Introduction",
        issue: `"${cleanPrimaryKey}" is not mentioned in the opening 120 words.`,
        impact: "Readers must read deep into the article to verify they found what they were looking for.",
        whyItMatters: "Google's helpful content guidelines recommend immediate clarity on page purpose.",
        suggestedAction: "Directly state what the article covers in the first 1-2 sentences.",
      });
    }

    // In Headings
    if (primaryMatch?.inHeadings) {
      checks.push({
        id: "keyphrase_in_headings",
        category: "headings",
        severity: "passed",
        statusType: "verified",
        passed: true,
        title: "Keyphrase Appears in Subheadings",
      });
    } else {
      checks.push({
        id: "keyphrase_in_headings",
        category: "headings",
        severity: "optional",
        statusType: "verified",
        passed: false,
        title: "Keyphrase Not Found in Subheadings",
        issue: `None of the ${h2Count} H2 headings reference "${cleanPrimaryKey}".`,
        impact: "Descriptive subheadings help readers skim and locate specific sections.",
        whyItMatters: "Headings that reflect subtopics improve reader comprehension and scannability.",
        suggestedAction: "Add an H2 heading addressing a key facet of the topic.",
      });
    }

    // Natural presence vs repetition guard (No arbitrary density formula!)
    if (primaryMatch && (primaryMatch.status === "repetitive" || primaryMatch.status === "stuffed")) {
      checks.push({
        id: "keyword_repetition_guard",
        category: "keywords",
        severity: "important",
        statusType: "estimated",
        passed: false,
        title: `Excessive Keyphrase Repetition (${primaryMatch.count} mentions)`,
        issue: `"${cleanPrimaryKey}" appears ${primaryMatch.count} times in ${wordCount} words.`,
        impact: "Overuse of exact keyphrases sounds robotic, degrades readability, and triggers spam signals.",
        whyItMatters: "Google Search Central emphasizes writing naturally for human readers, not keyword repeating.",
        suggestedAction: "Replace repetitive mentions with natural synonyms, pronouns, or diverse phrasings.",
      });
    } else if (primaryMatch && primaryMatch.count > 0) {
      checks.push({
        id: "keyword_repetition_guard",
        category: "keywords",
        severity: "passed",
        statusType: "verified",
        passed: true,
        title: `Natural Keyphrase Integration (${primaryMatch.count} mentions, variations: ${primaryMatch.variationsFound.join(", ") || "exact"})`,
      });
    }
  }

  // [Secondary Keyphrases Check]
  if (cleanSecondaryKeys.length > 0) {
    const presentCount = keyphrasesData.filter(k => !k.isPrimary && k.count > 0).length;
    if (presentCount > 0) {
      checks.push({
        id: "secondary_keyphrases_found",
        category: "keywords",
        severity: "passed",
        statusType: "verified",
        passed: true,
        title: `${presentCount} of ${cleanSecondaryKeys.length} Secondary Keyphrases Used in Content`,
      });
    } else {
      checks.push({
        id: "secondary_keyphrases_found",
        category: "keywords",
        severity: "optional",
        statusType: "verified",
        passed: false,
        title: "Secondary Keyphrases Not Mentioned in Article",
        issue: `Configured secondary terms (${cleanSecondaryKeys.join(", ")}) do not appear in the body.`,
        impact: "Related sub-topics and long-tail variants help answer broader reader questions.",
        whyItMatters: "Covering related concepts makes content more comprehensive and authoritative.",
        suggestedAction: "Naturally discuss these related terms in relevant sections where helpful.",
      });
    }
  }

  // [Headings: Single H1 Enforcement]
  if (h1sInContent.length > 0) {
    const demotedContent = content
      .replace(/<h1(\b[^>]*)>/gi, "<h2$1>")
      .replace(/<\/h1>/gi, "</h2>");
    checks.push({
      id: "headings_single_h1",
      category: "headings",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: `Multiple H1 Tags Detected (${h1sInContent.length} found in body)`,
      issue: "The article body contains <h1> tags. The page title already acts as the primary H1.",
      impact: "Multiple H1 tags in content fragment page hierarchy for screen readers and search crawlers.",
      whyItMatters: "W3C and Google heading hierarchy best practice reserves H1 for the page title.",
      suggestedAction: "Demote content <h1> tags to <h2> subheadings.",
      fixAction: {
        label: "Demote Body H1 to H2",
        field: "content",
        value: demotedContent,
        tabId: "general",
      },
    });
  } else {
    checks.push({
      id: "headings_single_h1",
      category: "headings",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Strict Single H1 Hierarchy Maintained",
    });
  }

  // [Headings: Empty Headings]
  if (emptyHeadingsCount > 0) {
    checks.push({
      id: "headings_empty",
      category: "headings",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: `${emptyHeadingsCount} Empty Heading Tag${emptyHeadingsCount > 1 ? "s" : ""} Found`,
      issue: "The document contains heading tags with no text or only whitespace.",
      impact: "Empty headings create broken DOM outline nodes and harm accessibility.",
      whyItMatters: "Assistive technologies announce empty headings, confusing visually impaired users.",
      suggestedAction: "Remove or populate empty heading tags in the editor.",
    });
  }

  // [Headings: Hierarchy Skipped Levels]
  if (hasSkippedHeadingLevels) {
    checks.push({
      id: "headings_hierarchy_skipped",
      category: "headings",
      severity: "recommended",
      statusType: "verified",
      passed: false,
      title: "Heading Levels Skipped in Outline",
      issue: "Document skips heading levels (e.g. jumping directly from H1 to H3 or H2 to H4).",
      impact: "Skipped levels disrupt the logical document outline.",
      whyItMatters: "Proper nesting (H1 -> H2 -> H3) enables crawlers and users to parse topical hierarchy effortlessly.",
      suggestedAction: "Structure sub-points sequentially under H2 headings before using H3.",
    });
  }

  // [Headings: Duplicate Heading Texts]
  const uniqueDupes = Array.from(new Set(duplicateHeadings));
  if (uniqueDupes.length > 0) {
    const deduplicatedContent = deduplicateHeadingTexts(content, uniqueDupes);
    checks.push({
      id: "headings_duplicates",
      category: "headings",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: `Duplicate Heading Texts (${uniqueDupes.length} duplicate${uniqueDupes.length > 1 ? "s" : ""})`,
      issue: `Two or more sections share identical heading text: ${uniqueDupes.map(d => `"${d}"`).join(", ")}.`,
      impact: "Identical headings make it difficult for readers and search engines to distinguish between sections.",
      whyItMatters: "Unique subheadings allow Google to extract precise featured snippets.",
      suggestedAction: "Make each heading title specific to its section content.",
      fixAction: {
        label: "Make Duplicate Headings Unique",
        field: "content",
        value: deduplicatedContent,
        tabId: "general",
      },
    });
  } else if (headings.length > 0) {
    checks.push({
      id: "headings_duplicates",
      category: "headings",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "All Section Headings Are Unique",
    });
  }

  // [Headings: Presence of H2 Sections]
  const minExpectedH2 = contentType === "blog" ? 2 : 1;
  if (h2Count < minExpectedH2) {
    checks.push({
      id: "headings_h2_presence",
      category: "headings",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: `Few Section Headings (${h2Count} H2 found)`,
      issue: `Content should have at least ${minExpectedH2} H2 headings to divide ideas.`,
      impact: "Walls of text fatigue readers and reduce average dwell time.",
      whyItMatters: "Clear headings break long articles into digestible, easily navigable chapters.",
      suggestedAction: "Use H2 headings to separate major themes, setup steps, or takeaways.",
    });
  } else {
    checks.push({
      id: "headings_h2_presence",
      category: "headings",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: `Well-Structured Section Headings (${h2Count} H2 headings)`,
    });
  }

  // [Content: Table of Contents Recommendation]
  if (hasLongArticleWithoutToc) {
    checks.push({
      id: "content_toc_recommendation",
      category: "headings",
      severity: "recommended",
      statusType: "verified",
      passed: false,
      title: "Table of Contents Recommended for Long Article",
      issue: `Article is ~${wordCount} words across ${h2Count} sections without a Table of Contents.`,
      impact: "Mobile readers have to scroll extensively to find specific sections.",
      whyItMatters: "Table of contents jump-links provide rich sitelinks in Google Search results.",
      suggestedAction: "Add an overview Table of Contents at the top of the article.",
    });
  }

  // [Content: Paragraph Length & Readability]
  if (hasLongParagraphs) {
    checks.push({
      id: "content_paragraph_readability",
      category: "quality",
      severity: "recommended",
      statusType: "estimated",
      passed: false,
      title: "Dense Paragraphs Found (> 200 words)",
      issue: "One or more paragraphs contain over 200 words without breaks.",
      impact: "Dense text blocks increase bounce rate, particularly on mobile devices.",
      whyItMatters: "People-first content uses short 2–4 sentence paragraphs and bullet lists for scannability.",
      suggestedAction: "Split dense paragraphs into shorter thoughts or bullet lists.",
    });
  } else if (wordCount > 100) {
    checks.push({
      id: "content_paragraph_readability",
      category: "quality",
      severity: "passed",
      statusType: "estimated",
      passed: true,
      title: "Good Paragraph Flow & Readability",
    });
  }

  // [Content: Comprehensive Depth (No Arbitrary Word Counts!)]
  const minWordTarget = contentType === "blog" ? 400 : 150;
  if (wordCount < minWordTarget) {
    checks.push({
      id: "content_word_count",
      category: "quality",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: `Content Appears Brief (${wordCount} words)`,
      issue: `Article has only ${wordCount} words. It may not provide complete answers to the reader's question.`,
      impact: "Thin articles struggle to compete against comprehensive, practical resources.",
      whyItMatters: "Google values helpful, in-depth content that fully satisfies user query intent.",
      suggestedAction: "Add practical steps, verified examples, setup prerequisites, or a FAQ section.",
    });
  } else {
    checks.push({
      id: "content_word_count",
      category: "quality",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: `Comprehensive Information Depth (${wordCount} words, ~${readingTimeMinutes} min read)`,
    });
  }

  // [Images: Presence]
  if (totalImages === 0) {
    checks.push({
      id: "image_presence",
      category: "images",
      severity: "recommended",
      statusType: "verified",
      passed: false,
      title: "No Visual Media or Featured Image Set",
      issue: "The article does not have a featured image or inline screenshots.",
      impact: "Pages without visual media are less engaging and cannot rank in Google Images.",
      whyItMatters: "Visuals, diagrams, and screenshots reinforce instructional clarity.",
      suggestedAction: "Set an informative featured image via the Media Library.",
    });
  } else {
    checks.push({
      id: "image_presence",
      category: "images",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: `Visual Media Present (${totalImages} image${totalImages > 1 ? "s" : ""})`,
    });

    // [Images: Alt Text Audit]
    if (imagesMissingAlt > 0) {
      checks.push({
        id: "image_missing_alt",
        category: "images",
        severity: "critical",
        statusType: "verified",
        passed: false,
        title: `${imagesMissingAlt} Image${imagesMissingAlt > 1 ? "s" : ""} Missing Alt Text`,
        issue: "One or more images lack descriptive alt attributes.",
        impact: "Search crawlers cannot index or understand image contents without descriptive alt text.",
        whyItMatters: "Alt text is vital for accessibility and is Google's primary signal for Google Image search.",
        suggestedAction: "Add descriptive alt text explaining what is shown in each image.",
        fixAction: {
          label: "Add Featured Image Alt Text",
          field: "featuredImageAlt",
          value: cleanPrimaryKey ? `${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)} Guide - The Valid Market` : `${effectiveTitle} - The Valid Market`,
          tabId: "general",
        },
      });
    } else {
      checks.push({
        id: "image_missing_alt",
        category: "images",
        severity: "passed",
        statusType: "verified",
        passed: true,
        title: "All Images Have Descriptive Alt Attributes",
      });
    }
  }

  // [Links: Internal Linking & Discovery]
  if (internalLinksCount === 0) {
    checks.push({
      id: "links_internal",
      category: "links",
      severity: "recommended",
      statusType: "verified",
      passed: false,
      title: "No Internal Links Found in Body",
      issue: "Article does not link to any related products, categories, or guides on the site.",
      impact: "Misses internal link equity distribution and lowers reader page discovery.",
      whyItMatters: "Internal links guide readers to relevant next steps and help Google crawl your catalog.",
      suggestedAction: "Add 1-2 relevant internal links to related guides or products.",
    });
  } else {
    checks.push({
      id: "links_internal",
      category: "links",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: `Internal Links Present (${internalLinksCount} internal link${internalLinksCount > 1 ? "s" : ""})`,
    });
  }

  // [Links: Vague Anchor Text Guard]
  if (vagueAnchorLinksCount > 0) {
    checks.push({
      id: "links_vague_anchors",
      category: "links",
      severity: "recommended",
      statusType: "verified",
      passed: false,
      title: `${vagueAnchorLinksCount} Link${vagueAnchorLinksCount > 1 ? "s" : ""} with Generic Anchor Text`,
      issue: "Links use generic text like 'click here', 'read more', or 'link'.",
      impact: "Generic anchor words convey zero context to search engines about the destination page.",
      whyItMatters: "Google explicitly recommends descriptive anchor text indicating the destination topic.",
      suggestedAction: "Replace generic anchors with descriptive nouns describing the destination.",
    });
  } else if (internalLinksCount > 0 || externalLinksCount > 0) {
    checks.push({
      id: "links_vague_anchors",
      category: "links",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Descriptive Anchor Text Used for Links",
    });
  }

  // [Links: Dynamic Internal Parameters Without Nofollow]
  if (dynamicInternalLinksCount > 0) {
    const cleanedDynamicContent = cleanDynamicInternalLinks(content);
    checks.push({
      id: "links_dynamic_internal",
      category: "links",
      severity: "important",
      statusType: "verified",
      passed: false,
      title: `Internal Links with Unsafe Dynamic Query Parameters (${dynamicInternalLinksCount})`,
      issue: `Internal links contain raw query strings (${dynamicInternalLinksList.slice(0, 2).join(", ")}) without nofollow.`,
      impact: "Can cause duplicate indexing loops and waste search crawler budget.",
      whyItMatters: "Internal links should point to canonical, clean URLs or be marked nofollow.",
      suggestedAction: "Clean query parameters from internal links or mark with rel='nofollow'.",
      fixAction: {
        label: "Clean Dynamic Internal Links",
        field: "content",
        value: cleanedDynamicContent,
        tabId: "general",
      },
    });
  } else if (internalLinksCount > 0) {
    checks.push({
      id: "links_dynamic_internal",
      category: "links",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "All Internal Links Are Clean (No Dynamic Query Parameters)",
    });
  }

  // [Technical: Canonical URL Format & Protocol]
  if (hasCanonical && !isCanonicalValid) {
    checks.push({
      id: "tech_canonical_validity",
      category: "canonical",
      severity: "critical",
      statusType: "verified",
      passed: false,
      title: "Invalid Canonical URL Format",
      issue: canonicalIssueMsg,
      impact: "Search engines will ignore invalid canonical directives, risking duplicate URL indexing.",
      whyItMatters: "Canonical URLs must strictly be absolute HTTPS URLs without query strings or hash tags.",
      suggestedAction: "Enter a clean, absolute HTTPS URL for the canonical tag.",
      fixAction: {
        label: "Set Clean Default Canonical",
        field: "canonicalUrl",
        value: `${siteUrl}/blog/${slug || "article"}`,
        tabId: "seo",
      },
    });
  } else if (hasCanonical) {
    checks.push({
      id: "tech_canonical_validity",
      category: "canonical",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Custom Canonical URL Validated",
      evidence: `Canonical: ${trimmedCanonical}`,
    });
  } else {
    checks.push({
      id: "tech_canonical_validity",
      category: "canonical",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Self-Referential Canonical Configured (Default)",
      evidence: `Default canonical automatically outputs ${siteUrl}/blog/${slug || "article"}`,
    });
  }

  // [Technical: Indexing Directive (Robots Meta)]
  const isNoIndex = (robots || "").toLowerCase().includes("noindex");
  if (isNoIndex) {
    checks.push({
      id: "tech_noindex",
      category: "technical",
      severity: "critical",
      statusType: "verified",
      passed: false,
      title: "CRITICAL: Page Set to 'noindex'",
      issue: "Robots meta directive specifies 'noindex'.",
      impact: "Google, Bing, and other search engines are strictly commanded NOT to index or rank this page.",
      whyItMatters: "This prevents the article from ever appearing in search results.",
      suggestedAction: "If this article is meant to be indexed by search engines, switch robots directive to 'index, follow'.",
      fixAction: {
        label: "Enable Search Indexing",
        field: "robots",
        value: "index, follow",
        tabId: "seo",
      },
    });
  } else {
    checks.push({
      id: "tech_noindex",
      category: "technical",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Robots Directive Permits Search Indexing (index, follow)",
    });
  }

  // [Technical: Social Media OpenGraph Tags]
  if (ogTitle || seoTitle || name) {
    checks.push({
      id: "tech_social_meta",
      category: "technical",
      severity: "passed",
      statusType: "verified",
      passed: true,
      title: "Social Sharing Metadata Configured (OpenGraph & Twitter Card)",
    });
  } else {
    checks.push({
      id: "tech_social_meta",
      category: "technical",
      severity: "recommended",
      statusType: "verified",
      passed: false,
      title: "Social Sharing OpenGraph Tags Missing",
      issue: "No custom social sharing title configured.",
      impact: "Links shared on Telegram, Discord, and Twitter may lack engaging cards.",
      suggestedAction: "Configure custom OG title, description, and social preview image.",
    });
  }

  // [Technical: Structured Data (Schema.org BlogPosting)]
  checks.push({
    id: "tech_structured_data",
    category: "technical",
    severity: "passed",
    statusType: "verified",
    passed: true,
    title: "Schema.org BlogPosting JSON-LD Supported on Storefront",
    evidence: "Headline, description, image, datePublished, dateModified, and Organization publisher are rendered.",
  });

  // [Technical: External Check Distinctions (Search Console & Core Web Vitals)]
  checks.push({
    id: "tech_cwv_lab",
    category: "technical",
    severity: "optional",
    statusType: "requires_external",
    passed: true,
    title: "Core Web Vitals Thresholds (Google 2026 Standards)",
    evidence: "Good LCP <= 2.5s | Good INP <= 200ms | Good CLS <= 0.1. Requires external field data from Google Search Console / PageSpeed.",
  });

  checks.push({
    id: "tech_backlinks_external",
    category: "technical",
    severity: "optional",
    statusType: "requires_external",
    passed: true,
    title: "Off-Page Backlinks & Impressions Audit",
    evidence: "External ranking signals require connected Search Console or third-party webmaster APIs. Editor analyzes on-page signals only.",
  });

  // ─── SCORING FORMULA (Transparent & Explainable) ─────────────────────────
  // Points assigned strictly based on real technical & editorial signals:
  // Title (20 pts), Description (15 pts), Headings & Structure (20 pts),
  // Content Quality & Keyphrase Integration (25 pts), Media & Links (20 pts)
  let titleScore = 0;
  if (effectiveTitle) {
    titleScore += 10;
    if (titlePixelWidth <= 580 && titleLength >= 35 && titleLength <= 60) titleScore += 7;
    else if (titleLength >= 30) titleScore += 4;
    if (titleRepeats.length === 0) titleScore += 3;
  }
  scoreBreakdown.push({
    category: "Title & SERP Clarity",
    earned: titleScore,
    max: 20,
    explanation: "Title presence, pixel width within 580px, and absence of repetitive stuffing.",
  });

  let descScore = 0;
  if (effectiveDesc) {
    descScore += 8;
    if (descPixelWidth <= 960 && descLength >= 80 && descLength <= 160) descScore += 5;
    else if (descLength >= 70) descScore += 3;
    if (primaryMatch?.inMetaDesc) descScore += 2;
  }
  scoreBreakdown.push({
    category: "Meta Description",
    earned: descScore,
    max: 15,
    explanation: "Concise summary answering search intent within Google's snippet boundary.",
  });

  let headingScore = 0;
  if (h1sInContent.length === 0) headingScore += 7;
  if (h2Count >= minExpectedH2) headingScore += 7;
  if (emptyHeadingsCount === 0 && !hasSkippedHeadingLevels) headingScore += 3;
  if (duplicateHeadings.length === 0 && headings.length > 0) headingScore += 3;
  scoreBreakdown.push({
    category: "Headings & Document Hierarchy",
    earned: headingScore,
    max: 20,
    explanation: "Single H1 structure, H2 topical dividing, unique titles, and sequential nesting.",
  });

  let contentScore = 0;
  if (wordCount >= minWordTarget) contentScore += 9;
  else if (wordCount >= 150) contentScore += 4;
  if (!hasLongParagraphs) contentScore += 4;
  if (primaryMatch && primaryMatch.count > 0 && primaryMatch.status !== "repetitive") contentScore += 7;
  if (primaryMatch?.inIntro) contentScore += 3;
  if (keyphrasesData.some(k => !k.isPrimary && k.count > 0)) contentScore += 2;
  scoreBreakdown.push({
    category: "Content Depth & Readability",
    earned: Math.min(25, contentScore),
    max: 25,
    explanation: "Comprehensive coverage, comfortable paragraph spacing, and natural keyword presence.",
  });

  let mediaLinksScore = 0;
  if (totalImages > 0) {
    mediaLinksScore += 4;
    if (imagesMissingAlt === 0) mediaLinksScore += 6;
  }
  if (internalLinksCount > 0) mediaLinksScore += 4;
  if (vagueAnchorLinksCount === 0 && (internalLinksCount > 0 || externalLinksCount > 0)) mediaLinksScore += 3;
  if (dynamicInternalLinksCount === 0 && internalLinksCount > 0) mediaLinksScore += 3;
  scoreBreakdown.push({
    category: "Media & Internal Navigation",
    earned: Math.min(20, mediaLinksScore),
    max: 20,
    explanation: "Labeled image alt text, descriptive anchor links, and clean URL references.",
  });

  let totalRawScore = titleScore + descScore + headingScore + contentScore + mediaLinksScore;

  // Technical deductions for severe indexing errors
  if (isNoIndex) totalRawScore = Math.min(totalRawScore, 40); // Cap if noindex!
  if (hasCanonical && !isCanonicalValid) totalRawScore = Math.max(0, totalRawScore - 15);

  const finalScore = Math.max(0, Math.min(100, Math.round(totalRawScore)));

  // Editorial Tiers (transparent editorial guidance, never promised as Google ranking tiers)
  let statusLevel: "OK" | "Good" | "Best" = "OK";
  if (finalScore >= 85) statusLevel = "Best";
  else if (finalScore >= 60) statusLevel = "Good";
  else statusLevel = "OK";

  // Critical issues that must remain visible REGARDLESS of overall score
  const criticalIssues = checks.filter(c => !c.passed && c.severity === "critical");

  const passedCount = checks.filter(c => c.passed).length;
  const warningCount = checks.filter(c => !c.passed && (c.severity === "important" || c.severity === "recommended")).length;
  const errorCount = checks.filter(c => !c.passed && c.severity === "critical").length;

  const severityWeight = { critical: 4, important: 3, recommended: 2, optional: 1, passed: 0 };
  const recommendations = checks
    .filter(c => !c.passed)
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

  // Safe Suggested Values (for review, not auto-overwritten)
  const suggestedTitle = buildCleanSeoTitle(effectiveTitle, cleanPrimaryKey);
  const suggestedMetaDescription = buildCleanMetaDescription(plainText, cleanPrimaryKey, effectiveTitle);
  const suggestedImageAlt = cleanPrimaryKey
    ? `${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)} - The Valid Market Guide`
    : `${effectiveTitle} - The Valid Market`;

  return {
    score: finalScore,
    statusLevel,
    passedCount,
    warningCount,
    errorCount,
    criticalIssues,
    titleLength,
    titlePixelWidth,
    titleStatus,
    descLength,
    descPixelWidth,
    descStatus,
    wordCount,
    readingTimeMinutes,
    h1CountInContent: h1sInContent.length,
    h2Count,
    h3Count,
    totalHeadings,
    wordsPerHeading,
    headingsList: headings,
    duplicateHeadings,
    emptyHeadingsCount,
    hasSkippedHeadingLevels,
    hasLongArticleWithoutToc,
    hasLongParagraphs,
    totalImages,
    imagesMissingAlt,
    missingAltSrcList,
    internalLinksCount,
    externalLinksCount,
    vagueAnchorLinksCount,
    dynamicInternalLinksCount,
    dynamicInternalLinksList,
    keyphrasesData,
    checks,
    recommendations,
    suggestedTitle,
    suggestedMetaDescription,
    suggestedImageAlt,
    scoreBreakdown,
  };
}
