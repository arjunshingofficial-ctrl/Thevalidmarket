import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/siteUrl";
import { generateUrlSetXml, xmlResponse, getAbsoluteImageUrl, SitemapUrlItem } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();

  try {
    const courses = await prisma.course.findMany({
      where: {
        product: {
          status: "PUBLISHED",
        },
      },
      include: {
        product: {
          select: {
            slug: true,
            name: true,
            updatedAt: true,
            metadata: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const urls: SitemapUrlItem[] = courses.map((course) => {
      let image = getAbsoluteImageUrl(course.thumbnailUrl, baseUrl);
      if (!image && course.product.metadata) {
        try {
          const parsed = typeof course.product.metadata === "string" ? JSON.parse(course.product.metadata) : course.product.metadata;
          if (parsed?.image) {
            image = getAbsoluteImageUrl(parsed.image, baseUrl);
          }
        } catch {}
      }

      return {
        loc: `${baseUrl}/courses/${course.product.slug}`,
        lastmod: course.updatedAt || course.product.updatedAt,
        changefreq: "weekly",
        priority: 0.85,
        images: image ? [{ loc: image, title: `${course.product.name} Course` }] : undefined,
      };
    });

    return xmlResponse(generateUrlSetXml(urls));
  } catch (error) {
    console.error("Failed to generate courses-sitemap.xml:", error);
    return xmlResponse(generateUrlSetXml([]));
  }
}
