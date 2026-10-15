import { normalizeImageUrl } from "@/lib/storage/client";

/**
 * Escapes special XML characters to prevent malformed XML
 */
export function xmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats a Date into standard W3C datetime format (ISO 8601)
 */
export function formatDate(date?: Date | string | null): string {
  if (!date) return new Date().toISOString();
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Converts any relative or stored image path to a full canonical absolute URL
 */
export function getAbsoluteImageUrl(img?: string | null, baseUrl: string = "https://www.thevalidmarket.com"): string | undefined {
  if (!img) return undefined;
  const normalized = normalizeImageUrl(img);
  if (!normalized) return undefined;
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  return `${baseUrl}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}

export interface SitemapIndexItem {
  loc: string;
  lastmod?: Date | string;
}

export interface SitemapUrlImage {
  loc: string;
  title?: string;
}

export interface SitemapUrlItem {
  loc: string;
  lastmod?: Date | string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  images?: SitemapUrlImage[];
}

/**
 * Generates an XML Sitemap Index compliant with Google and sitemaps.org
 */
export function generateSitemapIndexXml(sitemaps: SitemapIndexItem[]): string {
  const sitemapNodes = sitemaps
    .map(
      (s) => `  <sitemap>
    <loc>${xmlEscape(s.loc)}</loc>
    <lastmod>${formatDate(s.lastmod)}</lastmod>
  </sitemap>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapNodes}
</sitemapindex>`;
}

/**
 * Generates an XML UrlSet compliant with Google Search, Google Images, and sitemaps.org
 */
export function generateUrlSetXml(urls: SitemapUrlItem[]): string {
  const urlNodes = urls
    .map((u) => {
      const parts: string[] = [
        `    <loc>${xmlEscape(u.loc)}</loc>`,
        `    <lastmod>${formatDate(u.lastmod)}</lastmod>`,
      ];
      if (u.changefreq) {
        parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      }
      if (typeof u.priority === "number") {
        parts.push(`    <priority>${u.priority.toFixed(1)}</priority>`);
      }
      if (u.images && u.images.length > 0) {
        for (const img of u.images) {
          if (!img.loc) continue;
          parts.push(`    <image:image>
      <image:loc>${xmlEscape(img.loc)}</image:loc>${
            img.title ? `\n      <image:title>${xmlEscape(img.title)}</image:title>` : ""
          }
    </image:image>`);
        }
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlNodes}
</urlset>`;
}

/**
 * Creates a standard XML HTTP response with optimal caching headers
 */
export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
