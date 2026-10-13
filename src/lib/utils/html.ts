/**
 * Automatically ensures images inside rich text descriptions are lightweight,
 * modern, and lazy-loaded for optimal PageSpeed and Core Web Vitals:
 * - Replaces uncompressed .png / .jpg Supabase image URLs with .webp
 * - Injects loading="lazy" and decoding="async" to eliminate render blocking
 */
export function optimizeDescriptionHtml(html?: string | null): string {
  if (!html) return "<p>No description provided.</p>";

  // 1. Auto-switch any Supabase storage image URLs from .png / .jpg to .webp
  let processed = html.replace(
    /(https?:\/\/[^"'\s]+supabase\.co\/storage\/v1\/object\/public\/[^"'\s]+?)\.(png|jpe?g)/gi,
    "$1.webp"
  );

  // 2. Ensure all <img> tags have loading="lazy" and decoding="async"
  processed = processed.replace(
    /<img\b(?![^>]*\bloading=)([^>]*?)>/gi,
    '<img loading="lazy" decoding="async"$1>'
  );

  return processed;
}
