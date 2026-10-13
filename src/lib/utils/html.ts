/**
 * Automatically optimizes HTML content for modern PageSpeed & SEO:
 * - Switches uncompressed Supabase storage image URLs (.png / .jpg) to .webp
 * - Injects loading="lazy" and decoding="async" to eliminate render blocking
 * - Enforces Single H1 rule: demotes any <h1> inside post body to <h2>
 * - Injects descriptive fallback alt="..." for any <img> missing or having empty alt tags
 */
export function optimizeDescriptionHtml(html?: string | null, fallbackAlt?: string | null): string {
  if (!html) return "<p>No description provided.</p>";

  // 1. Auto-switch any Supabase storage image URLs from .png / .jpg to .webp
  let processed = html.replace(
    /(https?:\/\/[^"'\s]+supabase\.co\/storage\/v1\/object\/public\/[^"'\s]+?)\.(png|jpe?g)/gi,
    "$1.webp"
  );

  // 2. Demote any <h1> tags inside the content body to <h2> to preserve strict Single-H1 SEO rules
  processed = processed.replace(/<(\/?)h1(\b[^>]*)>/gi, "<$1h2$2>");

  // 3. Ensure all <img> tags have loading="lazy" and decoding="async"
  processed = processed.replace(
    /<img\b(?![^>]*\bloading=)([^>]*?)>/gi,
    '<img loading="lazy" decoding="async"$1>'
  );

  // 4. Ensure all <img> tags have a valid, non-empty alt attribute for SEO & accessibility
  const cleanAlt = (fallbackAlt || "Asia D Market Digital Guide").replace(/["<>]/g, "").trim();
  processed = processed.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    // If alt is completely missing:
    if (!/\balt\s*=/i.test(attrs)) {
      return `<img alt="${cleanAlt}" ${attrs}>`;
    }
    // If alt="" or alt='' is empty:
    if (/\balt\s*=\s*(["'])\s*\1/i.test(attrs)) {
      return match.replace(/\balt\s*=\s*(["'])\s*\1/i, `alt="${cleanAlt}"`);
    }
    return match;
  });

  return processed;
}
