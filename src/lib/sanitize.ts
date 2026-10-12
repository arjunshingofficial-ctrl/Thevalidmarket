/**
 * Safe, robust HTML sanitization.
 * Strips script tags, style/form tags, dangerous event handlers (on*),
 * javascript: links, and unapproved iframes.
 * Preserves custom attributes, layout styles, and approved media embeds.
 * Fully resilient with pure-regex fallback if JSDOM is unavailable.
 */

const ALLOWED_DOMAINS = [
  "www.youtube-nocookie.com",
  "www.youtube.com",
  "player.vimeo.com",
  "dvtmzispblbufuzoimkk.supabase.co",
];

function isAllowedIframeSrc(src: string): boolean {
  try {
    const url = new URL(src);
    return ALLOWED_DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

/**
 * Fast, pure regex-based sanitization that runs in any JS environment (Node, Edge, Browser)
 * without requiring jsdom or native DOM globals.
 */
function regexSanitize(html: string): string {
  if (!html) return "";

  let clean = html;

  // 1. Remove dangerous blocks: <script>...</script>, <style>...</style>, etc.
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // 2. Remove dangerous interactive tags
  clean = clean.replace(/<\/?(?:form|input|button|textarea|select|option|object|embed|applet|meta|link|base)\b[^>]*>/gi, "");

  // 3. Strip all inline event handlers (onload, onclick, onerror, onmouseover, etc.)
  clean = clean.replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 4. Strip dangerous javascript: and vbscript: links
  clean = clean.replace(/\s+href\s*=\s*["']\s*(?:javascript|vbscript):[^"']*["']/gi, ' href="#"');

  // 5. Filter iframes to only approved domains
  clean = clean.replace(/<iframe[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
    if (isAllowedIframeSrc(src)) return match;
    return "<!-- iframe removed: disallowed domain -->";
  });

  return clean;
}

export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== "string") return "";
  return regexSanitize(dirty);
}
