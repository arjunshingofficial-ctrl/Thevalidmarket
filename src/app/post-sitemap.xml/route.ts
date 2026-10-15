import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/siteUrl";
import { generateUrlSetXml, xmlResponse, getAbsoluteImageUrl, SitemapUrlItem } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();

  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        updatedAt: true,
        featuredImage: true,
        ogImage: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const urls: SitemapUrlItem[] = posts.map((post) => {
      const img = getAbsoluteImageUrl(post.featuredImage || post.ogImage, baseUrl);

      return {
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt,
        changefreq: "weekly",
        priority: 0.8,
        images: img ? [{ loc: img, title: post.title }] : undefined,
      };
    });

    return xmlResponse(generateUrlSetXml(urls));
  } catch (error) {
    console.error("Failed to generate post-sitemap.xml:", error);
    return xmlResponse(generateUrlSetXml([]));
  }
}
