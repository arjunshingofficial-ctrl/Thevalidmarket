import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/siteUrl";
import { generateUrlSetXml, xmlResponse, getAbsoluteImageUrl, SitemapUrlItem } from "@/lib/sitemap-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const baseUrl = getBaseUrl();

  try {
    // 1. Fetch all data in parallel for maximum performance
    const [products, courses, categories, blogCategories, cmsPages, posts] = await Promise.all([
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          name: true,
          updatedAt: true,
          metadata: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.course.findMany({
        where: { product: { status: "PUBLISHED" } },
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
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.blogCategory.findMany({
        select: { slug: true },
      }),
      prisma.page.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          title: true,
          updatedAt: true,
          featuredImage: true,
          ogImage: true,
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const allUrls: SitemapUrlItem[] = [];
    const now = new Date();

    // Core Store Hubs & Landing Pages (only active, indexable static routes)
    const staticHubs: SitemapUrlItem[] = [
      {
        loc: baseUrl,
        lastmod: now,
        changefreq: "daily",
        priority: 1.0,
      },
      {
        loc: `${baseUrl}/store`,
        lastmod: now,
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: `${baseUrl}/courses`,
        lastmod: now,
        changefreq: "daily",
        priority: 0.9,
      },
      {
        loc: `${baseUrl}/news`,
        lastmod: now,
        changefreq: "daily",
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/blog`,
        lastmod: now,
        changefreq: "daily",
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/contact`,
        lastmod: now,
        changefreq: "monthly",
        priority: 0.7,
      },
    ];
    allUrls.push(...staticHubs);

    // Published Products with Google Images
    for (const product of products) {
      let image: string | undefined;
      try {
        if (product.metadata) {
          const parsed = typeof product.metadata === "string" ? JSON.parse(product.metadata) : product.metadata;
          if (parsed?.image) {
            image = getAbsoluteImageUrl(parsed.image, baseUrl);
          }
        }
      } catch {}

      allUrls.push({
        loc: `${baseUrl}/product/${product.slug}`,
        lastmod: product.updatedAt,
        changefreq: "weekly",
        priority: 0.9,
        images: image ? [{ loc: image, title: product.name }] : undefined,
      });
    }

    // Academy Courses
    for (const course of courses) {
      let image = getAbsoluteImageUrl(course.thumbnailUrl, baseUrl);
      if (!image && course.product.metadata) {
        try {
          const parsed = typeof course.product.metadata === "string" ? JSON.parse(course.product.metadata) : course.product.metadata;
          if (parsed?.image) {
            image = getAbsoluteImageUrl(parsed.image, baseUrl);
          }
        } catch {}
      }

      allUrls.push({
        loc: `${baseUrl}/courses/${course.product.slug}`,
        lastmod: course.updatedAt || course.product.updatedAt,
        changefreq: "weekly",
        priority: 0.85,
        images: image ? [{ loc: image, title: `${course.product.name} Course` }] : undefined,
      });
    }

    // Store Categories (Canonical Category landing pages only - no query parameters)
    for (const cat of categories) {
      allUrls.push({
        loc: `${baseUrl}/category/${cat.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.8,
      });
    }

    // Published Blog Posts with Featured Images
    for (const post of posts) {
      const img = getAbsoluteImageUrl(post.featuredImage || post.ogImage, baseUrl);
      allUrls.push({
        loc: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt,
        changefreq: "weekly",
        priority: 0.8,
        images: img ? [{ loc: img, title: post.title }] : undefined,
      });
    }

    // CMS Pages
    for (const page of cmsPages) {
      allUrls.push({
        loc: `${baseUrl}/${page.slug}`,
        lastmod: page.updatedAt,
        changefreq: "monthly",
        priority: 0.7,
      });
    }

    return xmlResponse(generateUrlSetXml(allUrls));
  } catch (error) {
    console.error("Failed to generate complete unified sitemap.xml:", error);
    return xmlResponse(generateUrlSetXml([]));
  }
}
