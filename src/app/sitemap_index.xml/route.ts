import { getBaseUrl } from "@/lib/siteUrl";
import { generateSitemapIndexXml, xmlResponse } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const sitemaps = [
    { loc: `${baseUrl}/product-sitemap.xml`, lastmod: now },
    { loc: `${baseUrl}/courses-sitemap.xml`, lastmod: now },
    { loc: `${baseUrl}/category-sitemap.xml`, lastmod: now },
    { loc: `${baseUrl}/post-sitemap.xml`, lastmod: now },
    { loc: `${baseUrl}/page-sitemap.xml`, lastmod: now },
  ];

  return xmlResponse(generateSitemapIndexXml(sitemaps));
}
