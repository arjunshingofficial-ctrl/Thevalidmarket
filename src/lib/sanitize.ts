/**
 * Server-side HTML sanitization using isomorphic-dompurify.
 * Strips scripts, event handlers, and dangerous attributes.
 * Allows rich content blocks: custom data attributes, iframes from approved domains, etc.
 */
import DOMPurify from "isomorphic-dompurify";

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

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  const clean = DOMPurify.sanitize(dirty, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      // iframe attributes for video embeds
      "allowfullscreen", "frameborder", "allow",
      // custom data attributes for content blocks
      "data-video-embed", "data-callout", "type",
      // layout / style (limited)
      "style",
    ],
    ALLOW_DATA_ATTR: true,
    FORCE_BODY: false,
    WHOLE_DOCUMENT: false,
    FORBID_TAGS: ["script", "noscript", "style", "form", "input", "button"],
    FORBID_ATTR: [
      "onerror", "onload", "onclick", "onmouseover", "onmouseout",
      "onfocus", "onblur", "onkeydown", "onkeyup", "onkeypress",
      "onchange", "onsubmit", "onreset", "onselect", "onabort",
      "formaction", "action",
    ],
  });

  // Use regex fallback since we're in a server environment without full DOM
  const sanitizedWithIframes = clean.replace(
    /<iframe[^>]*src="([^"]*)"[^>]*>/gi,
    (match: string, src: string) => {
      if (isAllowedIframeSrc(src)) return match;
      return "<!-- iframe removed: disallowed domain -->";
    }
  );

  return sanitizedWithIframes;
}
