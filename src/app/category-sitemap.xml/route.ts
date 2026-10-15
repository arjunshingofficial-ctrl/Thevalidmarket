import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/siteUrl";
import { generateUrlSetXml, xmlResponse, SitemapUrlItem } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();

  try {
    const [categories, blogCategories] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
      prisma.blogCategory.findMany({
        select: { slug: true },
      }),
    ]);

    const urls: SitemapUrlItem[] = [];
    const now = new Date();

    // Store Category landing pages & store filtered hubs
    for (const cat of categories) {
      urls.push({
        loc: `${baseUrl}/category/${cat.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.8,
      });
      urls.push({
        loc: `${baseUrl}/store?category=${cat.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.75,
      });
    }

    // Blog / News topic hubs
    for (const bCat of blogCategories) {
      urls.push({
        loc: `${baseUrl}/news?category=${bCat.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      });
    }

    return xmlResponse(generateUrlSetXml(urls));
  } catch (error) {
    console.error("Failed to generate category-sitemap.xml:", error);
    return xmlResponse(generateUrlSetXml([]));
  }
}
