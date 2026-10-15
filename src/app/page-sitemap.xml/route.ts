import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/siteUrl";
import { generateUrlSetXml, xmlResponse, SitemapUrlItem } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();

  try {
    const cmsPages = await prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    const staticHubs: SitemapUrlItem[] = [
      {
        loc: baseUrl,
        lastmod: new Date(),
        changefreq: "daily",
        priority: 1.0,
      },
      {
        loc: `${baseUrl}/store`,
        lastmod: new Date(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: `${baseUrl}/courses`,
        lastmod: new Date(),
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: `${baseUrl}/tools`,
        lastmod: new Date(),
        changefreq: "weekly",
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/news`,
        lastmod: new Date(),
        changefreq: "daily",
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/about`,
        lastmod: new Date(),
        changefreq: "monthly",
        priority: 0.7,
      },
      {
        loc: `${baseUrl}/contact`,
        lastmod: new Date(),
        changefreq: "monthly",
        priority: 0.7,
      },
      {
        loc: `${baseUrl}/terms`,
        lastmod: new Date(),
        changefreq: "monthly",
        priority: 0.6,
      },
      {
        loc: `${baseUrl}/privacy`,
        lastmod: new Date(),
        changefreq: "monthly",
        priority: 0.6,
      },
      {
        loc: `${baseUrl}/faq`,
        lastmod: new Date(),
        changefreq: "monthly",
        priority: 0.7,
      },
    ];

    const dynamicPages: SitemapUrlItem[] = cmsPages.map((page) => ({
      loc: `${baseUrl}/${page.slug}`,
      lastmod: page.updatedAt,
      changefreq: "monthly",
      priority: 0.7,
    }));

    return xmlResponse(generateUrlSetXml([...staticHubs, ...dynamicPages]));
  } catch (error) {
    console.error("Failed to generate page-sitemap.xml:", error);
    return xmlResponse(generateUrlSetXml([]));
  }
}
