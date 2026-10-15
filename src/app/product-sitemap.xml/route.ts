import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/siteUrl";
import { generateUrlSetXml, xmlResponse, getAbsoluteImageUrl, SitemapUrlItem } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();

  try {
    const products = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        name: true,
        updatedAt: true,
        metadata: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const urls: SitemapUrlItem[] = products.map((product) => {
      let image: string | undefined;
      try {
        if (product.metadata) {
          const parsed = typeof product.metadata === "string" ? JSON.parse(product.metadata) : product.metadata;
          if (parsed?.image) {
            image = getAbsoluteImageUrl(parsed.image, baseUrl);
          }
        }
      } catch {}

      return {
        loc: `${baseUrl}/product/${product.slug}`,
        lastmod: product.updatedAt,
        changefreq: "weekly",
        priority: 0.9,
        images: image ? [{ loc: image, title: product.name }] : undefined,
      };
    });

    return xmlResponse(generateUrlSetXml(urls));
  } catch (error) {
    console.error("Failed to generate product-sitemap.xml:", error);
    return xmlResponse(generateUrlSetXml([]));
  }
}
