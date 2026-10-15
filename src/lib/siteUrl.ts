/**
 * Centralized Canonical Base URL Helper
 *
 * Ensures sitemaps, robots.txt, schema.org, and OpenGraph always output
 * the custom production domain (https://www.thevalidmarket.com) and guards
 * against stale Vercel staging domains (*.vercel.app) or legacy URLs.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (envUrl) {
    // In local development, support localhost / 127.0.0.1
    if (
      process.env.NODE_ENV === "development" &&
      (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))
    ) {
      return envUrl.replace(/\/$/, "");
    }

    // In production, reject *.vercel.app staging URLs and legacy domains
    if (!envUrl.includes("vercel.app") && !envUrl.includes("thevalidmarket.com")) {
      return envUrl.replace(/\/$/, "");
    }
  }

  return "https://www.thevalidmarket.com";
}
