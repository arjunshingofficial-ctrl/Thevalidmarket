/**
 * Real-Time SEO Analyzer Engine for Asia D Market
 * Implements Google & Seobility on-page audit criteria:
 * - Proportional pixel-width calculations for Title and Description
 * - 5 Focus Keyphrases analysis with matrix placement tracking
 * - Strict Single-H1 rendered check & heading hierarchy verification
 * - Image Alt text, Link anchors, keyword density & stuffing guards
 * - Deterministic suggestions for instant 1-click fixes
 */

export interface KeyphraseMatch {
  keyphrase: string;
  isPrimary: boolean;
  count: number;
  density: number; // percentage (e.g. 1.2)
  inTitle: boolean;
  inMetaDesc: boolean;
  inSlug: boolean;
  inIntro: boolean;
  inHeadings: boolean;
  inContent: boolean;
  inImageAlt: boolean;
  status: "missing" | "low" | "good" | "stuffed";
}

export interface SeoCheckItem {
  id: string;
  category: "title" | "description" | "slug" | "headings" | "keywords" | "images" | "links" | "technical";
  severity: "critical" | "important" | "recommended" | "optional" | "passed";
  passed: boolean;
  title: string;
  issue?: string;
  impact?: string;
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
  headingsList: { level: number; text: string }[];
  duplicateHeadings: string[];
  
  // Images & Links
  totalImages: number;
  imagesMissingAlt: number;
  missingAltSrcList: string[];
  internalLinksCount: number;
  externalLinksCount: number;
  vagueAnchorLinksCount: number;

  // Keyphrases
  keyphrasesData: KeyphraseMatch[];
  
  // Checks & Recommendations
  checks: SeoCheckItem[];
  recommendations: SeoCheckItem[]; // only failed checks, sorted by severity

  // Suggested values for instant 1-click apply
  suggestedTitle?: string;
  suggestedMetaDescription?: string;
  suggestedImageAlt?: string;
}

export interface SeoInputData {
  contentType: "blog" | "product";
  name?: string; // post title or product name
  title?: string; // alias for name
  slug: string;
  content: string; // HTML content from rich text editor
  excerpt?: string;
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  imageAlt?: string; // alias for featuredImageAlt
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  primaryKeyphrase?: string;
  focusKeyword?: string; // alias for primaryKeyphrase
  secondaryKeyphrases?: string[];
  secondaryKeywords?: string[]; // alias for secondaryKeyphrases
  siteUrl?: string;
}

// ─── Proportional Typography Pixel Width Estimators ─────────────────────────
// Calculates realistic rendered pixel widths for Google Desktop SERP:
// Title font: Roboto / Arial ~20px (~580px max before truncation)
// Snippet font: Roboto / Arial ~14px (~960px max)

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
    else px += 9.5; // standard lowercase
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

// Strip HTML tags safely in browser
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract headings from HTML
export function extractHeadings(html: string): { level: number; text: string }[] {
  if (!html) return [];
  const matches = html.matchAll(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/gi);
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

// Extract links from HTML
export function extractLinks(html: string, siteHost: string = "asiadmarket.com"): { href: string; text: string; isInternal: boolean }[] {
  if (!html) return [];
  const matches = html.matchAll(/<a\b([^>]*?)>(.*?)<\/a>/gi);
  const links: { href: string; text: string; isInternal: boolean }[] = [];
  for (const match of matches) {
    const attrs = match[1];
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    const href = hrefMatch ? hrefMatch[1].trim() : "";
    const text = stripHtml(match[2]).trim();
    const isInternal = href.startsWith("/") || href.startsWith("#") || href.includes(siteHost);
    links.push({ href, text, isInternal });
  }
  return links;
}

// ─── Main SEO Analyzer Engine ───────────────────────────────────────────────
export function analyzeSeo(input: SeoInputData): SeoAnalysisResult {
  const safeInput = input || ({} as SeoInputData);
  const {
    contentType = "product",
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
    siteUrl = "https://asiadmarket.com",
  } = safeInput;

  const checks: SeoCheckItem[] = [];
  let score = 0;

  // 1. Plain text extraction & word count
  const plainText = stripHtml(content || "");
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // First 120 words for Introduction check
  const introText = words.slice(0, 120).join(" ").toLowerCase();

  // 2. Headings extraction
  const headings = extractHeadings(content);
  const h1sInContent = headings.filter(h => h.level === 1);
  const h2Count = headings.filter(h => h.level === 2).length;
  const h3Count = headings.filter(h => h.level === 3).length;

  const headingTexts = headings.map(h => h.text.toLowerCase());
  const duplicateHeadings = headingTexts.filter((item, index) => item.length > 2 && headingTexts.indexOf(item) !== index);

  // 3. Images extraction
  const inlineImages = extractImages(content);
  let totalImages = inlineImages.length;
  if (featuredImage) totalImages += 1;

  const missingAltSrcList: string[] = [];
  inlineImages.forEach(img => {
    if (!img.alt) missingAltSrcList.push(img.src);
  });
  if (featuredImage && !featuredImageAlt) {
    missingAltSrcList.push(featuredImage);
  }
  const imagesMissingAlt = missingAltSrcList.length;

  // All alt texts combined for keyword search
  const allAltsCombined = [
    featuredImageAlt,
    ...inlineImages.map(i => i.alt),
  ].join(" ").toLowerCase();

  // 4. Links extraction
  const parsedLinks = extractLinks(content);
  const internalLinksCount = parsedLinks.filter(l => l.isInternal).length;
  const externalLinksCount = parsedLinks.filter(l => !l.isInternal).length;
  
  const vagueAnchorPatterns = /^(click here|here|read more|learn more|link|this|more|check here|website)$/i;
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
  const titleWords = effectiveTitle.toLowerCase().split(/\W+/).filter(w => w.length > 3);
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

  // 7. Focus Keyphrases Matrix
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
    // Regex escape
    const escaped = keyphrase.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");

    const matchesInBody = (plainText.match(regex) || []).length;
    const density = wordCount > 0 ? parseFloat(((matchesInBody / wordCount) * 100).toFixed(2)) : 0;

    const inTitle = effectiveTitle.toLowerCase().includes(keyphrase);
    const inMetaDesc = effectiveDesc.toLowerCase().includes(keyphrase);
    const inSlug = (slug || "").toLowerCase().replace(/-/g, " ").includes(keyphrase.replace(/-/g, " "));
    const inIntro = introText.includes(keyphrase);
    const inHeadings = headings.some(h => h.text.toLowerCase().includes(keyphrase));
    const inContent = matchesInBody > 0;
    const inImageAlt = allAltsCombined.includes(keyphrase);

    let status: "missing" | "low" | "good" | "stuffed" = "good";
    if (matchesInBody === 0) status = "missing";
    else if (density < 0.3) status = "low";
    else if (density > 2.8) status = "stuffed";

    return {
      keyphrase,
      isPrimary,
      count: matchesInBody,
      density,
      inTitle,
      inMetaDesc,
      inSlug,
      inIntro,
      inHeadings,
      inContent,
      inImageAlt,
      status,
    };
  });

  const primaryMatch = keyphrasesData.find(k => k.isPrimary);

  // ─── CHECKS DEFINITIONS & SCORING ─────────────────────────────────────────

  // Title Check 1: Exists
  if (!effectiveTitle) {
    checks.push({
      id: "title_exists",
      category: "title",
      severity: "critical",
      passed: false,
      title: "SEO Title is Missing",
      issue: "Page has no title tag defined.",
      impact: "Search engines will not index or display this page without a title.",
      fixAction: {
        label: "Set Title from Name",
        field: "seoTitle",
        value: name || "New Product",
        tabId: "seo",
      },
    });
  } else {
    score += 5;
    checks.push({
      id: "title_exists",
      category: "title",
      severity: "passed",
      passed: true,
      title: "SEO Title is Defined",
    });
  }

  // Title Check 2: Length & Pixel Width
  if (effectiveTitle) {
    if (titlePixelWidth > 580 || titleLength > 60) {
      checks.push({
        id: "title_length",
        category: "title",
        severity: "important",
        passed: false,
        title: `SEO Title is Too Long (${titleLength} chars / ${titlePixelWidth}px)`,
        issue: "Title exceeds Google's 580px desktop pixel limit and will be cut off with '...'.",
        impact: "Users will not see your full value proposition in search results.",
        fixAction: {
          label: "Trim Title",
          field: "seoTitle",
          value: effectiveTitle.slice(0, 58).trim(),
          tabId: "seo",
        },
      });
      score += 2;
    } else if (titleLength < 35) {
      checks.push({
        id: "title_length",
        category: "title",
        severity: "recommended",
        passed: false,
        title: `SEO Title is Too Short (${titleLength} chars)`,
        issue: "Title is under 35 characters and misses ranking opportunity.",
        impact: "A descriptive 45–58 character title attracts significantly more clicks.",
        fixAction: {
          label: "Expand Title",
          field: "seoTitle",
          value: cleanPrimaryKey ? `${effectiveTitle} | Complete Guide & Tools` : `${effectiveTitle} | Asia D Market`,
          tabId: "seo",
        },
      });
      score += 3;
    } else {
      score += 6;
      checks.push({
        id: "title_length",
        category: "title",
        severity: "passed",
        passed: true,
        title: `SEO Title Length is Optimal (${titleLength} chars / ${titlePixelWidth}px)`,
      });
    }
  }

  // Title Check 3: Word Repetitions
  if (titleRepeats.length > 0) {
    const titleParts = effectiveTitle.split(/\s*\|\s*/);
    const seenParts = new Set<string>();
    const deduplicatedParts = titleParts.filter(p => {
      const lower = p.trim().toLowerCase();
      if (!lower || seenParts.has(lower)) return false;
      seenParts.add(lower);
      return true;
    });
    let cleanedTitle = deduplicatedParts.join(" | ");
    if (cleanedTitle === effectiveTitle || cleanedTitle.length < 10) {
      const seenWords = new Set<string>();
      cleanedTitle = effectiveTitle
        .split(" ")
        .filter(w => {
          const l = w.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (l.length > 3 && seenWords.has(l)) return false;
          if (l.length > 3) seenWords.add(l);
          return true;
        })
        .join(" ");
    }
    checks.push({
      id: "title_repetition",
      category: "title",
      severity: "important",
      passed: false,
      title: `Word Repetitions in Title (${titleRepeats.join(", ")})`,
      issue: `Words like "${titleRepeats[0]}" are repeated multiple times in the title.`,
      impact: "Search engines penalize repetitive title text as low quality or keyword stuffing.",
      fixAction: {
        label: "Deduplicate Title Words",
        field: "seoTitle",
        value: cleanedTitle,
        tabId: "seo",
      },
    });
  } else if (effectiveTitle) {
    score += 2;
    checks.push({
      id: "title_repetition",
      category: "title",
      severity: "passed",
      passed: true,
      title: "No Word Repetitions in Title",
    });
  }

  // Meta Description Check 1: Exists
  if (!effectiveDesc) {
    checks.push({
      id: "desc_exists",
      category: "description",
      severity: "critical",
      passed: false,
      title: "Meta Description is Missing",
      issue: "No snippet description provided for search results.",
      impact: "Google will generate random text snippets from the page, reducing click-through rates.",
      fixAction: {
        label: "Generate from Content",
        field: "metaDescription",
        value: plainText.slice(0, 150).trim() + "...",
        tabId: "seo",
      },
    });
  } else {
    score += 4;
    checks.push({
      id: "desc_exists",
      category: "description",
      severity: "passed",
      passed: true,
      title: "Meta Description is Defined",
    });
  }

  // Meta Description Check 2: Length & Width
  if (effectiveDesc) {
    if (descLength > 160 || descPixelWidth > 960) {
      checks.push({
        id: "desc_length",
        category: "description",
        severity: "important",
        passed: false,
        title: `Meta Description is Too Long (${descLength} chars / ${descPixelWidth}px)`,
        issue: "Description exceeds 160 characters and will be truncated on Google SERPs.",
        impact: "Call-to-action text at the end of the snippet may get truncated.",
        fixAction: {
          label: "Trim Description",
          field: "metaDescription",
          value: effectiveDesc.slice(0, 152).trim() + "...",
          tabId: "seo",
        },
      });
      score += 2;
    } else if (descLength < 80) {
      const enrichedDesc = cleanPrimaryKey
        ? `${effectiveDesc} Discover complete guides, features, and verified tools for ${cleanPrimaryKey} at Asia D Market.`.slice(0, 155).trim()
        : `${effectiveDesc} Instant access, verified downloads, and 24/7 dedicated assistance at Asia D Market.`.slice(0, 155).trim();
      checks.push({
        id: "desc_length",
        category: "description",
        severity: "recommended",
        passed: false,
        title: `Meta Description is Too Short (${descLength} chars)`,
        issue: "Description is under 80 characters.",
        impact: "A full 130–155 character description gives users more reasons to click.",
        fixAction: {
          label: "Enrich Description",
          field: "metaDescription",
          value: enrichedDesc,
          tabId: "seo",
        },
      });
      score += 2;
    } else {
      score += 5;
      checks.push({
        id: "desc_length",
        category: "description",
        severity: "passed",
        passed: true,
        title: `Meta Description Length is Optimal (${descLength} chars / ${descPixelWidth}px)`,
      });
    }
  }

  // Primary Keyphrase Checks
  if (!cleanPrimaryKey) {
    checks.push({
      id: "keyphrase_primary_defined",
      category: "keywords",
      severity: "critical",
      passed: false,
      title: "Primary Focus Keyphrase is Not Set",
      issue: "No target focus search phrase has been designated for this page.",
      impact: "Without a focus phrase, the content cannot be systematically optimized for search rankings.",
      fixAction: {
        label: "Set Focus Keyphrase",
        field: "focusKeyword",
        value: (name || "product").toLowerCase().split(" ").slice(0, 3).join(" "),
        tabId: "seo",
      },
    });
  } else {
    score += 4;
    checks.push({
      id: "keyphrase_primary_defined",
      category: "keywords",
      severity: "passed",
      passed: true,
      title: `Primary Focus Keyphrase Set: "${cleanPrimaryKey}"`,
    });

    // Primary in Title
    if (primaryMatch?.inTitle) {
      score += 7;
      checks.push({
        id: "keyphrase_in_title",
        category: "title",
        severity: "passed",
        passed: true,
        title: "Primary Keyphrase Appears in Title",
      });
    } else {
      checks.push({
        id: "keyphrase_in_title",
        category: "title",
        severity: "critical",
        passed: false,
        title: `Primary Keyphrase Missing from Title`,
        issue: `"${cleanPrimaryKey}" does not appear anywhere in the SEO title.`,
        impact: "The title tag is the single most important on-page SEO ranking signal.",
        fixAction: {
          label: "Include Keyphrase in Title",
          field: "seoTitle",
          value: `${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)} | ${effectiveTitle}`.slice(0, 58),
          tabId: "seo",
        },
      });
    }

    // Primary in Meta Description
    if (primaryMatch?.inMetaDesc) {
      score += 6;
      checks.push({
        id: "keyphrase_in_desc",
        category: "description",
        severity: "passed",
        passed: true,
        title: "Primary Keyphrase Appears in Meta Description",
      });
    } else {
      checks.push({
        id: "keyphrase_in_desc",
        category: "description",
        severity: "important",
        passed: false,
        title: "Primary Keyphrase Missing from Meta Description",
        issue: `"${cleanPrimaryKey}" is not found in the meta description.`,
        impact: "Google bolds matching keywords in snippets, significantly boosting CTR.",
        fixAction: {
          label: "Include in Description",
          field: "metaDescription",
          value: `Discover our verified ${cleanPrimaryKey} guide and tools. ${effectiveDesc}`.slice(0, 155),
          tabId: "seo",
        },
      });
    }

    // Primary in Slug
    if (primaryMatch?.inSlug) {
      score += 3;
      checks.push({
        id: "keyphrase_in_slug",
        category: "slug",
        severity: "passed",
        passed: true,
        title: "Primary Keyphrase Appears in URL Slug",
      });
    } else {
      checks.push({
        id: "keyphrase_in_slug",
        category: "slug",
        severity: "recommended",
        passed: false,
        title: "Primary Keyphrase Missing from URL Slug",
        issue: `"${cleanPrimaryKey}" words are not reflected in the URL path.`,
        impact: "Keywords in URLs reassure visitors and search crawlers of page relevance.",
        fixAction: {
          label: "Update Slug",
          field: "slug",
          value: cleanPrimaryKey.replace(/[^a-z0-9]+/g, "-"),
          tabId: "general",
        },
      });
    }

    // Primary in Introduction
    if (primaryMatch?.inIntro) {
      score += 4;
      checks.push({
        id: "keyphrase_in_intro",
        category: "keywords",
        severity: "passed",
        passed: true,
        title: "Primary Keyphrase Appears in First 100 Words",
      });
    } else {
      const introLead = `<p>Welcome to our comprehensive guide on <strong>${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)}</strong>. Below you will find key features, step-by-step instructions, and verified tools.</p>\n`;
      const fixedIntroContent = content && content.trim().startsWith("<p>") 
        ? content.replace(/<p(\b[^>]*)>/i, `<p$1>Looking for <strong>${cleanPrimaryKey}</strong>? `)
        : (content ? `${introLead}${content}` : introLead);
      checks.push({
        id: "keyphrase_in_intro",
        category: "keywords",
        severity: "important",
        passed: false,
        title: "Primary Keyphrase Missing from Introduction",
        issue: `"${cleanPrimaryKey}" does not appear early in the introductory paragraphs.`,
        impact: "Early keyword prominence signals immediate relevance to search engine parsers.",
        fixAction: {
          label: "Insert Keyphrase in Intro",
          field: "content",
          value: fixedIntroContent,
          tabId: "general",
        },
      });
    }

    // Primary in Headings
    if (primaryMatch?.inHeadings) {
      score += 4;
      checks.push({
        id: "keyphrase_in_headings",
        category: "headings",
        severity: "passed",
        passed: true,
        title: "Primary Keyphrase Appears in H2/H3 Headings",
      });
    } else {
      const headingTitle = `Why Choose ${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)}?`;
      const fixedHeadingContent = content.includes("<h2>") 
        ? content.replace(/<h2>/i, `<h2>${headingTitle}</h2>\n<h2>`)
        : `<h2>${headingTitle}</h2>\n${content || "<p>Detailed guide and specifications below.</p>"}`;
      checks.push({
        id: "keyphrase_in_headings",
        category: "headings",
        severity: "recommended",
        passed: false,
        title: "Primary Keyphrase Missing from Section Headings",
        issue: `No H2 or H3 heading contains "${cleanPrimaryKey}".`,
        impact: "Subheadings containing the target keyphrase improve topical relevance.",
        fixAction: {
          label: "Add Heading with Keyphrase",
          field: "content",
          value: fixedHeadingContent,
          tabId: "general",
        },
      });
    }

    // Density & Stuffing Guard
    if (primaryMatch) {
      if (primaryMatch.status === "stuffed") {
        checks.push({
          id: "keyword_stuffing",
          category: "keywords",
          severity: "critical",
          passed: false,
          title: `Keyword Stuffing Warning (${primaryMatch.density}% Density)`,
          issue: `"${cleanPrimaryKey}" appears ${primaryMatch.count} times (${primaryMatch.density}% of content).`,
          impact: "Google penalizes unnaturally high keyword repetition. Keep density between 0.5% and 2.2%.",
          fixAction: {
            label: "Reduce Keyword Repetition",
            field: "content",
            tabId: "general",
          },
        });
        score -= 6; // penalty
      } else if (primaryMatch.count > 0) {
        score += 3;
        checks.push({
          id: "keyword_stuffing",
          category: "keywords",
          severity: "passed",
          passed: true,
          title: `Natural Keyword Density (${primaryMatch.density}%, ${primaryMatch.count} mentions)`,
        });
      }
    }
  }

  // Secondary Keyphrases Check
  if (cleanSecondaryKeys.length > 0) {
    const presentSecondary = keyphrasesData.filter(k => !k.isPrimary && k.count > 0).length;
    if (presentSecondary > 0) {
      score += 4;
      checks.push({
        id: "secondary_keyphrases_found",
        category: "keywords",
        severity: "passed",
        passed: true,
        title: `${presentSecondary} of ${cleanSecondaryKeys.length} Secondary Keyphrases Used in Content`,
      });
    } else {
      const secondaryParagraph = `\n\n<p><strong>Related topics:</strong> ${cleanSecondaryKeys.map((k: string) => `${k.charAt(0).toUpperCase() + k.slice(1)}`).join(", ")} are supported with comprehensive documentation and verified access on Asia D Market.</p>`;
      checks.push({
        id: "secondary_keyphrases_found",
        category: "keywords",
        severity: "recommended",
        passed: false,
        title: "Secondary Keyphrases Not Mentioned in Content",
        issue: `Configured secondary keyphrases (${cleanSecondaryKeys.join(", ")}) do not appear in the text.`,
        impact: "Secondary keyphrases help rank for related long-tail search queries.",
        fixAction: {
          label: "Incorporate Related Terms",
          field: "content",
          value: content ? `${content}${secondaryParagraph}` : secondaryParagraph,
          tabId: "general",
        },
      });
    }
  }

  // Heading Structure Check 1: Single H1 Enforcement
  if (h1sInContent.length > 0) {
    const demotedContent = content
      .replace(/<h1(\b[^>]*)>/gi, "<h2$1>")
      .replace(/<\/h1>/gi, "</h2>");
    checks.push({
      id: "headings_single_h1",
      category: "headings",
      severity: "important",
      passed: false,
      title: `Multiple H1 Tags Detected (${h1sInContent.length} found in body)`,
      issue: "The article body contains <h1> tags. The page title already acts as the primary H1.",
      impact: "Pages with multiple H1 tags confuse search engine crawlers regarding the primary topic.",
      fixAction: {
        label: "Demote Body H1 to H2",
        field: "content",
        value: demotedContent,
        tabId: "general",
      },
    });
  } else {
    score += 5;
    checks.push({
      id: "headings_single_h1",
      category: "headings",
      severity: "passed",
      passed: true,
      title: "Strict Single H1 Rule Maintained",
    });
  }

  // Heading Structure Check 2: Logical H2 Presence
  const minHeadings = contentType === "blog" ? 2 : 1;
  if (h2Count < minHeadings) {
    const structuredContent = content
      ? `${content}\n\n<h2>Key Highlights & Specifications</h2>\n<p>Explore detailed features, setup requirements, and verified benefits below.</p>\n<h2>Frequently Asked Questions</h2>\n<p>Find quick answers regarding licensing, downloads, and technical support.</p>`
      : `<h2>Key Highlights & Specifications</h2>\n<p>Explore detailed features, setup requirements, and verified benefits below.</p>\n<h2>Frequently Asked Questions</h2>\n<p>Find quick answers regarding licensing, downloads, and technical support.</p>`;
    checks.push({
      id: "headings_h2_presence",
      category: "headings",
      severity: "important",
      passed: false,
      title: `Too Few Section Headings (${h2Count} H2s found)`,
      issue: `Content should have at least ${minHeadings} H2 headings to divide ideas.`,
      impact: "Unbroken walls of text hurt user dwell time and crawler parsing.",
      fixAction: {
        label: "Add Section Headings",
        field: "content",
        value: structuredContent,
        tabId: "general",
      },
    });
  } else {
    score += 5;
    checks.push({
      id: "headings_h2_presence",
      category: "headings",
      severity: "passed",
      passed: true,
      title: `Good Heading Structure (${h2Count} H2 headings)`,
    });
  }

  // Heading Structure Check 3: Duplicate Headings
  if (duplicateHeadings.length > 0) {
    let deduplicatedContent = content;
    duplicateHeadings.forEach((dup) => {
      let count = 0;
      const regex = new RegExp(`(<h[2-6]\\b[^>]*>\\s*${dup.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}\\s*<\\/h[2-6]>)`, "gi");
      deduplicatedContent = deduplicatedContent.replace(regex, (match) => {
        count++;
        if (count > 1) {
          return match.replace(new RegExp(dup, "i"), `${dup} (Part ${count})`);
        }
        return match;
      });
    });
    checks.push({
      id: "headings_duplicates",
      category: "headings",
      severity: "recommended",
      passed: false,
      title: `Duplicate Headings Found: "${duplicateHeadings[0]}"`,
      issue: "Two or more headings share the exact same wording.",
      impact: "Repetitive headings reduce the clarity of the document outline.",
      fixAction: {
        label: "Make Duplicate Headings Unique",
        field: "content",
        value: deduplicatedContent,
        tabId: "general",
      },
    });
  } else if (h2Count > 0) {
    score += 3;
    checks.push({
      id: "headings_duplicates",
      category: "headings",
      severity: "passed",
      passed: true,
      title: "All Heading Texts Are Unique",
    });
  }

  // Content Length Check
  const minWordTarget = contentType === "blog" ? 600 : 200;
  if (wordCount < minWordTarget) {
    const faqExpansion = `\n\n<h2>Detailed Guide & Specifications</h2>\n<p>This resource is meticulously researched to provide verified information, secure setup instructions, and practical use cases for our community.</p>\n\n<h2>Frequently Asked Questions</h2>\n<p><strong>How do I access this item?</strong> Instant access and download links are delivered directly to your customer dashboard upon confirmation.</p>\n<p><strong>Is technical support included?</strong> Yes, Asia D Market provides 24/7 technical customer support for all active licenses and services.</p>\n<p><strong>Can I request custom configurations?</strong> Contact our technical team via live chat for bespoke enterprise requirements.</p>`;
    checks.push({
      id: "content_word_count",
      category: "headings",
      severity: "important",
      passed: false,
      title: `Content is Thin (${wordCount} words / target ${minWordTarget}+)`,
      issue: `Current word count is ${wordCount}. In-depth content ranks significantly better.`,
      impact: "Thin content struggles to compete against comprehensive guides on Google.",
      fixAction: {
        label: "Expand Details & FAQ",
        field: "content",
        value: content ? `${content}\n${faqExpansion}` : faqExpansion,
        tabId: "general",
      },
    });
    score += Math.round((wordCount / minWordTarget) * 8);
  } else {
    score += 8;
    checks.push({
      id: "content_word_count",
      category: "headings",
      severity: "passed",
      passed: true,
      title: `Thorough Content Length (${wordCount} words, ~${readingTimeMinutes} min read)`,
    });
  }

  // Image SEO Checks
  if (totalImages === 0) {
    checks.push({
      id: "image_presence",
      category: "images",
      severity: "recommended",
      passed: false,
      title: "No Images or Visuals Included",
      issue: "The article or product has no featured image or inline screenshots.",
      impact: "Pages with engaging visuals retain visitors longer and can rank in Google Images.",
      fixAction: {
        label: "Set Default Featured Image",
        field: "featuredImage",
        value: "/og-image.jpg",
        tabId: "general",
      },
    });
  } else {
    score += 4;
    checks.push({
      id: "image_presence",
      category: "images",
      severity: "passed",
      passed: true,
      title: `Visual Media Present (${totalImages} image${totalImages > 1 ? "s" : ""})`,
    });

    // Image Alt text check
    if (imagesMissingAlt > 0) {
      checks.push({
        id: "image_missing_alt",
        category: "images",
        severity: "critical",
        passed: false,
        title: `${imagesMissingAlt} Image${imagesMissingAlt > 1 ? "s" : ""} Missing Alt Text`,
        issue: "Images lack descriptive alt attributes for accessibility and Google Image indexing.",
        impact: "Search engines cannot interpret image context without descriptive alt text.",
        fixAction: {
          label: "Add Image Alt Text",
          field: "featuredImageAlt",
          value: cleanPrimaryKey ? `${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)} - Asia D Market Guide` : `${effectiveTitle} - Asia D Market`,
          tabId: "general",
        },
      });
    } else {
      score += 4;
      checks.push({
        id: "image_missing_alt",
        category: "images",
        severity: "passed",
        passed: true,
        title: "All Images Have Descriptive Alt Text",
      });
    }

    // Primary Keyword in Image Alt
    if (cleanPrimaryKey && allAltsCombined.includes(cleanPrimaryKey)) {
      score += 2;
      checks.push({
        id: "image_keyword_alt",
        category: "images",
        severity: "passed",
        passed: true,
        title: `Primary Keyphrase Included in Image Alt Text`,
      });
    } else if (cleanPrimaryKey) {
      checks.push({
        id: "image_keyword_alt",
        category: "images",
        severity: "optional",
        passed: false,
        title: "Primary Keyphrase Missing from Image Alt Text",
        issue: `"${cleanPrimaryKey}" does not appear in any image alt attributes.`,
        impact: "Relevant image alt tags provide strong context for Google Image Search.",
        fixAction: {
          label: "Include in Featured Alt",
          field: "featuredImageAlt",
          value: `${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)} Overview - Asia D Market`,
          tabId: "general",
        },
      });
    }
  }

  // Link Analysis Checks
  if (internalLinksCount === 0) {
    const internalLinkSnippet = `\n\n<p>Explore more verified software, proxies, and accounts in the <a href="/store">Asia D Market Store</a> or review our latest <a href="/blog">technical guides</a>.</p>`;
    checks.push({
      id: "links_internal",
      category: "links",
      severity: "recommended",
      passed: false,
      title: "No Internal Links Found",
      issue: "Content does not link to other pages, products, or tools on Asia D Market.",
      impact: "Internal links pass PageRank and help search crawlers index your catalog.",
      fixAction: {
        label: "Add Store & Blog Link",
        field: "content",
        value: content ? `${content}${internalLinkSnippet}` : internalLinkSnippet,
        tabId: "general",
      },
    });
  } else {
    score += 3;
    checks.push({
      id: "links_internal",
      category: "links",
      severity: "passed",
      passed: true,
      title: `Internal Links Present (${internalLinksCount} internal link${internalLinksCount > 1 ? "s" : ""})`,
    });
  }

  if (vagueAnchorLinksCount > 0) {
    let improvedAnchorsContent = content;
    improvedAnchorsContent = improvedAnchorsContent.replace(
      /<a\b([^>]*)>(click here|here|read more|learn more|link|this)<\/a>/gi,
      (match, attrs, anchor) => {
        return `<a${attrs}>explore the full Asia D Market catalog</a>`;
      }
    );
    checks.push({
      id: "links_vague_anchors",
      category: "links",
      severity: "recommended",
      passed: false,
      title: `${vagueAnchorLinksCount} Link${vagueAnchorLinksCount > 1 ? "s" : ""} With Vague Anchor Text`,
      issue: "Found generic anchors like 'click here' or 'learn more' instead of descriptive phrases.",
      impact: "Descriptive anchor text tells Google what the destination page is about.",
      fixAction: {
        label: "Improve Anchor Text",
        field: "content",
        value: improvedAnchorsContent,
        tabId: "general",
      },
    });
  } else if (internalLinksCount > 0 || externalLinksCount > 0) {
    score += 2;
    checks.push({
      id: "links_vague_anchors",
      category: "links",
      severity: "passed",
      passed: true,
      title: "Descriptive Anchor Text Used for Links",
    });
  }

  // Technical & Social Checks
  const isNoIndex = (robots || "").toLowerCase().includes("noindex");
  if (isNoIndex) {
    checks.push({
      id: "tech_noindex",
      category: "technical",
      severity: "critical",
      passed: false,
      title: "Page Set to 'noindex'",
      issue: "Robots directive specifies noindex.",
      impact: "Search engines are explicitly instructed NOT to index or rank this page.",
      fixAction: {
        label: "Enable Indexing",
        field: "robots",
        value: "index, follow",
        tabId: "seo",
      },
    });
  } else {
    score += 2;
    checks.push({
      id: "tech_noindex",
      category: "technical",
      severity: "passed",
      passed: true,
      title: "Robots Directive Permits Indexing",
    });
  }

  if (ogTitle || seoTitle || name) {
    score += 3;
    checks.push({
      id: "tech_social_meta",
      category: "technical",
      severity: "passed",
      passed: true,
      title: "Social Sharing OpenGraph Tags Configured",
    });
  }

  // Clamp score 0 - 100
  const finalScore = Math.max(0, Math.min(100, score));

  // Determine editorial threshold
  let statusLevel: "OK" | "Good" | "Best" = "OK";
  if (finalScore >= 85) statusLevel = "Best";
  else if (finalScore >= 60) statusLevel = "Good";
  else statusLevel = "OK";

  // Counts
  const passedCount = checks.filter(c => c.passed).length;
  const warningCount = checks.filter(c => !c.passed && (c.severity === "important" || c.severity === "recommended")).length;
  const errorCount = checks.filter(c => !c.passed && c.severity === "critical").length;

  // Filter recommendations (failed checks sorted: critical -> important -> recommended -> optional)
  const severityWeight = { critical: 4, important: 3, recommended: 2, optional: 1, passed: 0 };
  const recommendations = checks
    .filter(c => !c.passed)
    .sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

  // Generate Suggested Title
  let suggestedTitle = effectiveTitle;
  if (cleanPrimaryKey && !effectiveTitle.toLowerCase().includes(cleanPrimaryKey)) {
    suggestedTitle = `${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)} | ${effectiveTitle}`.slice(0, 58).trim();
  } else if (titleLength > 60) {
    suggestedTitle = effectiveTitle.slice(0, 57).trim();
  }

  // Generate Suggested Meta Description
  let suggestedMetaDescription = effectiveDesc;
  if (!effectiveDesc || effectiveDesc.length < 90) {
    const summaryCandidate = plainText.slice(0, 140).trim();
    if (cleanPrimaryKey) {
      suggestedMetaDescription = `Explore ${cleanPrimaryKey} with instant delivery and verified security on Asia D Market. ${summaryCandidate}`.slice(0, 155).trim();
    } else {
      suggestedMetaDescription = `${summaryCandidate} Available now on Asia D Market with verified instant delivery.`.slice(0, 155).trim();
    }
  }

  // Generate Suggested Alt Text
  const suggestedImageAlt = cleanPrimaryKey
    ? `${cleanPrimaryKey.charAt(0).toUpperCase() + cleanPrimaryKey.slice(1)} - Asia D Market Guide`
    : `${effectiveTitle} - Asia D Market`;

  return {
    score: finalScore,
    statusLevel,
    passedCount,
    warningCount,
    errorCount,
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
    headingsList: headings,
    duplicateHeadings,
    totalImages,
    imagesMissingAlt,
    missingAltSrcList,
    internalLinksCount,
    externalLinksCount,
    vagueAnchorLinksCount,
    keyphrasesData,
    checks,
    recommendations,
    suggestedTitle,
    suggestedMetaDescription,
    suggestedImageAlt,
  };
}
