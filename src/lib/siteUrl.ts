/**
 * Centralized Canonical Base URL Helper
 *
 * Ensures sitemaps, robots.txt, schema.org, and OpenGraph always output
 * the custom production domain (https://www.thevalidmarket.com) and guards
 * against stale Vercel staging domains (*.vercel.app) or apex domain redirects.
 */
export function getBaseUrl(): string {
  // In local development, support localhost / 127.0.0.1
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_SITE_URL &&
    (process.env.NEXT_PUBLIC_SITE_URL.includes("localhost") || process.env.NEXT_PUBLIC_SITE_URL.includes("127.0.0.1"))
  ) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
  }

  // Canonical production URL strictly with www prefix
  return "https://www.thevalidmarket.com";
}
