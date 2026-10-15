import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/siteUrl';
import { normalizeImageUrl } from '@/lib/storage/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  // Helper to ensure valid absolute image URL for Google Image Search indexing
  const getAbsoluteImageUrl = (img?: string | null): string | undefined => {
    if (!img) return undefined;
    const normalized = normalizeImageUrl(img);
    if (!normalized) return undefined;
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }
    return `${baseUrl}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
  };

  try {
    // 1. Fetch published products & courses
    const products = await prisma.product.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        metadata: true,
        course: { select: { id: true, status: true, thumbnailUrl: true } },
      },
    });

    const productUrls: MetadataRoute.Sitemap = [];
    const courseUrls: MetadataRoute.Sitemap = [];

    for (const product of products) {
      let image: string | undefined;
      try {
        if (product.metadata) {
          const parsed = typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata;
          if (parsed?.image) {
            image = getAbsoluteImageUrl(parsed.image);
          }
        }
      } catch {}

      // Standard Product Page
      productUrls.push({
        url: `${baseUrl}/product/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
        ...(image ? { images: [image] } : {}),
      });

      // Dedicated Academy Course Detail Page
      if (product.course) {
        const courseThumb = getAbsoluteImageUrl(product.course.thumbnailUrl) || image;
        courseUrls.push({
          url: `${baseUrl}/courses/${product.slug}`,
          lastModified: product.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.85,
          ...(courseThumb ? { images: [courseThumb] } : {}),
        });
      }
    }

    // 2. Fetch active store categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });

    const categoryUrls: MetadataRoute.Sitemap = categories.flatMap((cat) => [
      {
        url: `${baseUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/store?category=${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ]);

    // 3. Fetch blog categories (for /news hub filtering)
    const blogCategories = await prisma.blogCategory.findMany({
      select: { slug: true },
    });

    const blogCategoryUrls: MetadataRoute.Sitemap = blogCategories.map((bCat) => ({
      url: `${baseUrl}/news?category=${bCat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // 4. Fetch published static pages (Terms, Privacy, FAQs, etc.)
    const pages = await prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    });

    const pageUrls: MetadataRoute.Sitemap = pages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    // 5. Fetch published blog posts with featured images
    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        featuredImage: true,
        ogImage: true,
      },
    });

    const postUrls: MetadataRoute.Sitemap = posts.map((post) => {
      const img = getAbsoluteImageUrl(post.featuredImage || post.ogImage);
      return {
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
        ...(img ? { images: [img] } : {}),
      };
    });

    // 6. Core Hubs & Landing Pages
    const staticHubs: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/store`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/courses`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/news`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];

    return [
      ...staticHubs,
      ...productUrls,
      ...courseUrls,
      ...categoryUrls,
      ...blogCategoryUrls,
      ...pageUrls,
      ...postUrls,
    ];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${baseUrl}/store`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${baseUrl}/courses`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    ];
  }
}
