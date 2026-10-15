import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/siteUrl";
import { generateSitemapIndexXml, xmlResponse, SitemapIndexItem } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();

  try {
    const [latestProduct, latestCourse, latestPost, latestPage] = await Promise.all([
      prisma.product.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.course.findFirst({
        where: { product: { status: "PUBLISHED" } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.blogPost.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.page.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    const sitemaps: SitemapIndexItem[] = [
      {
        loc: `${baseUrl}/product-sitemap.xml`,
        lastmod: latestProduct?.updatedAt || new Date(),
      },
      {
        loc: `${baseUrl}/courses-sitemap.xml`,
        lastmod: latestCourse?.updatedAt || latestProduct?.updatedAt || new Date(),
      },
      {
        loc: `${baseUrl}/category-sitemap.xml`,
        lastmod: latestProduct?.updatedAt || new Date(),
      },
      {
        loc: `${baseUrl}/post-sitemap.xml`,
        lastmod: latestPost?.updatedAt || new Date(),
      },
      {
        loc: `${baseUrl}/page-sitemap.xml`,
        lastmod: latestPage?.updatedAt || new Date(),
      },
    ];

    return xmlResponse(generateSitemapIndexXml(sitemaps));
  } catch (error) {
    console.error("Failed to generate master sitemap.xml index:", error);
    const fallbackSitemaps: SitemapIndexItem[] = [
      { loc: `${baseUrl}/product-sitemap.xml`, lastmod: new Date() },
      { loc: `${baseUrl}/courses-sitemap.xml`, lastmod: new Date() },
      { loc: `${baseUrl}/category-sitemap.xml`, lastmod: new Date() },
      { loc: `${baseUrl}/post-sitemap.xml`, lastmod: new Date() },
      { loc: `${baseUrl}/page-sitemap.xml`, lastmod: new Date() },
    ];
    return xmlResponse(generateSitemapIndexXml(fallbackSitemaps));
  }
}
