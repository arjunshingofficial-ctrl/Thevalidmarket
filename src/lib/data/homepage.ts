import { prisma } from "@/lib/prisma";
import { HomepageConfig, HomepageSection, DEFAULT_HOMEPAGE_CONFIG } from "@/types/homepage";

/**
 * Fetch the homepage configuration from SiteSettings.
 * @param preview If true, fetches draftConfig instead of homepageConfig
 */
export async function getHomepageConfig(preview = false): Promise<HomepageConfig> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  
  if (!settings) return DEFAULT_HOMEPAGE_CONFIG;

  const configString = preview ? settings.draftConfig : settings.homepageConfig;
  
  if (!configString) return DEFAULT_HOMEPAGE_CONFIG;
  
  try {
    const config = JSON.parse(configString) as HomepageConfig;
    if (!config || !Array.isArray(config.sections)) return DEFAULT_HOMEPAGE_CONFIG;
    return config;
  } catch (e) {
    console.error("Failed to parse homepage config", e);
    return DEFAULT_HOMEPAGE_CONFIG;
  }
}

/**
 * Fetch public stats for the homepage.
 */
export async function getMarketplaceStats() {
  const [productCount, categoryCount, reviewCount, aggregateRating] = await Promise.all([
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.review.aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true }
    })
  ]);

  return {
    productCount,
    categoryCount,
    reviewCount,
    averageRating: aggregateRating._avg.rating || 0
  };
}

export async function getHomepageProducts(sectionConfig: HomepageSection) {
  const { config } = sectionConfig;
  const take = config.productCount ? parseInt(config.productCount) : 4;
  const mode = config.selectionMode || "AUTOMATIC";

  if (mode === "MANUAL" && Array.isArray(config.productIds) && config.productIds.length > 0) {
    return prisma.product.findMany({
      where: { 
        id: { in: config.productIds },
        status: "PUBLISHED" 
      },
      include: { category: true },
      take
    });
  }

  const autoMode = config.automaticMode || "NEWEST";
  
  if (autoMode === "BEST_SELLING") {
    // Best Sellers: count PURCHASE_COMPLETED events
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const purchaseEvents = await prisma.analyticsEvent.findMany({
      where: { eventType: "PURCHASE_COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { productId: true, metadata: true }
    });

    const salesMap: Record<string, number> = {};
    for (const ev of purchaseEvents) {
      if (!ev.productId) continue;
      let qty = 1;
      try {
        if (ev.metadata) qty = JSON.parse(ev.metadata).quantity || 1;
      } catch (e) {}
      salesMap[ev.productId] = (salesMap[ev.productId] || 0) + qty;
    }

    const topIds = Object.entries(salesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, take)
      .map(entry => entry[0]);

    if (topIds.length === 0) return []; // Hide best sellers if no sales

    const products = await prisma.product.findMany({
      where: { id: { in: topIds }, status: "PUBLISHED" },
      include: { category: true }
    });

    // Sort to match the topIds order
    return topIds.map(id => products.find(p => p.id === id)).filter(Boolean);
  } 
  
  if (autoMode === "TRENDING") {
    // Trending Formula: Views(1) + Carts(4) + Purchases(10) over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const events = await prisma.analyticsEvent.findMany({
      where: { 
        eventType: { in: ["PRODUCT_VIEW", "ADD_TO_CART", "PURCHASE_COMPLETED"] },
        createdAt: { gte: sevenDaysAgo }
      },
      select: { productId: true, eventType: true }
    });

    const scoreMap: Record<string, number> = {};
    for (const ev of events) {
      if (!ev.productId) continue;
      const weight = ev.eventType === "PURCHASE_COMPLETED" ? 10 : (ev.eventType === "ADD_TO_CART" ? 4 : 1);
      scoreMap[ev.productId] = (scoreMap[ev.productId] || 0) + weight;
    }

    const topIds = Object.entries(scoreMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, take)
      .map(entry => entry[0]);

    if (topIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: topIds }, status: "PUBLISHED" },
        include: { category: true }
      });
      return topIds.map(id => products.find(p => p.id === id)).filter(Boolean);
    }
    
    // Fallback to newest if no trending data exists
  }

  // Fallback for NEWEST, HIGHEST_RATED (approx), FEATURED (approx), or TRENDING fallback
  return prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take,
    include: { category: true }
  });
}

/**
 * Fetch marketplace pulse historical data (last 7 days).
 */
export async function getMarketplacePulse() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const events = await prisma.analyticsEvent.findMany({
    where: { 
      eventType: { in: ["PRODUCT_PUBLISHED", "PURCHASE_COMPLETED", "REVIEW_APPROVED"] },
      createdAt: { gte: sevenDaysAgo }
    },
    select: { eventType: true, createdAt: true }
  });

  const dailyCounts: Record<string, any> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    dailyCounts[dateStr] = { date: dateStr, products: 0, orders: 0, reviews: 0 };
  }

  let totalEvents = 0;
  for (const ev of events) {
    const dateStr = ev.createdAt.toISOString().split('T')[0];
    if (dailyCounts[dateStr]) {
      totalEvents++;
      if (ev.eventType === "PRODUCT_PUBLISHED") dailyCounts[dateStr].products++;
      if (ev.eventType === "PURCHASE_COMPLETED") dailyCounts[dateStr].orders++;
      if (ev.eventType === "REVIEW_APPROVED") dailyCounts[dateStr].reviews++;
    }
  }

  const hasHistory = totalEvents > 5; // Require some minimum activity for a meaningful chart

  return {
    hasHistory,
    history: Object.values(dailyCounts)
  };
}

/**
 * Fetch approved reviews for the homepage.
 */
export async function getHomepageReviews(take = 5) {
  return prisma.review.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: {
        select: { name: true, image: true }
      },
      product: {
        select: { name: true, slug: true }
      }
    }
  });
}

/**
 * Fetch active categories.
 */
export async function getHomepageCategories(take = 6) {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take,
    include: {
      _count: {
        select: { products: { where: { status: "PUBLISHED" } } }
      }
    }
  });
}

/**
 * Fetch recent activity feed.
 */
export async function getRecentActivity(take = 5) {
  return prisma.analyticsEvent.findMany({
    where: { 
      eventType: { in: ["PRODUCT_PUBLISHED", "CATEGORY_CREATED", "REVIEW_APPROVED", "PURCHASE_COMPLETED"] } 
    },
    orderBy: { createdAt: "desc" },
    take
  });
}

/**
 * Fetch products for a CategoryProducts homepage section.
 * Supports multiple sort modes — only uses analytics-backed sorts when data actually exists.
 */
export async function getCategoryProducts({
  categorySlug,
  categoryId,
  take = 4,
  sort = "NEWEST",
  isDemo = false
}: {
  categorySlug?: string;
  categoryId?: string;
  take?: number;
  sort?: string;
  isDemo?: boolean;
}) {
  const demoMode = process.env.DEMO_MODE === "true";

  // Resolve category
  let category: any = null;
  if (categoryId) {
    category = await prisma.category.findUnique({ where: { id: categoryId } });
  } else if (categorySlug) {
    category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  }

  if (!category || !category.isActive) return { category: null, products: [] };

  const baseWhere: any = {
    categoryId: category.id,
    status: "PUBLISHED",
    ...(demoMode ? {} : { NOT: [{ metadata: { contains: '"isDemo":true' } }] })
  };

  // Analytics-backed sorts
  if (sort === "BEST_SELLING") {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await prisma.analyticsEvent.findMany({
      where: { eventType: "PURCHASE_COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { productId: true, metadata: true }
    });
    const salesMap: Record<string, number> = {};
    for (const ev of events) {
      if (!ev.productId) continue;
      let qty = 1;
      try { if (ev.metadata) qty = JSON.parse(ev.metadata).quantity || 1; } catch {}
      salesMap[ev.productId] = (salesMap[ev.productId] || 0) + qty;
    }
    const topIds = Object.entries(salesMap).sort((a, b) => b[1] - a[1]).slice(0, take).map(e => e[0]);
    if (topIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: topIds }, ...baseWhere },
        include: { category: true, reviews: { where: { status: "APPROVED" }, select: { rating: true } } }
      });
      return { category, products: topIds.map(id => products.find(p => p.id === id)).filter(Boolean) };
    }
    // Fall through to NEWEST if no sales data
  }

  if (sort === "HIGHEST_RATED") {
    const products = await prisma.product.findMany({
      where: baseWhere,
      include: { category: true, reviews: { where: { status: "APPROVED" }, select: { rating: true } } },
      take: take * 4 // over-fetch to sort in memory
    });
    const withRatings = products.map(p => ({
      ...p,
      _avgRating: p.reviews.length > 0 ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length : 0
    }));
    withRatings.sort((a, b) => b._avgRating - a._avgRating);
    return { category, products: withRatings.slice(0, take) };
  }

  // Standard DB sorts
  let orderBy: any = { createdAt: "desc" };
  if (sort === "OLDEST") orderBy = { createdAt: "asc" };
  if (sort === "PRICE_ASC") orderBy = { price: "asc" };
  if (sort === "PRICE_DESC") orderBy = { price: "desc" };
  if (sort === "FEATURED") orderBy = { sortOrder: "asc" };

  const products = await prisma.product.findMany({
    where: baseWhere,
    orderBy,
    take,
    include: { category: true, reviews: { where: { status: "APPROVED" }, select: { rating: true } } }
  });

  return { category, products };
}

/**
 * Batch-fetch all CategoryProducts sections to avoid N+1 queries.
 * Returns a map of section.id -> { category, products }.
 */
export async function getCategoryProductSections(
  sections: Array<{ id: string; config: Record<string, any> }>
) {
  const results: Record<string, { category: any; products: any[] }> = {};

  // Run all category fetches concurrently (bounded by section count, not by product count)
  await Promise.all(
    sections.map(async (section) => {
      const { categoryId, categorySlug, productCount, sort } = section.config;
      const take = productCount ? parseInt(String(productCount)) : 4;
      results[section.id] = await getCategoryProducts({ categoryId, categorySlug, take, sort });
    })
  );

  return results;
}

/**
 * Fetch published blog posts for the homepage.
 */
export async function getHomepageBlogPosts({
  take = 3,
  sort = "NEWEST",
  categoryIds,
}: {
  take?: number;
  sort?: string;
  categoryIds?: string[];
}) {
  const where: any = {
    status: "PUBLISHED",
  };

  if (categoryIds && categoryIds.length > 0) {
    where.categoryId = { in: categoryIds };
  }

  if (sort === "FEATURED") {
    // Treat most recent as featured if no featured flag exists
    return prisma.blogPost.findMany({
      where,
      orderBy: { publishDate: "desc" },
      take,
      include: { category: { select: { id: true, name: true, slug: true } } }
    });
  }

  const orderBy: any = sort === "OLDEST" ? { publishDate: "asc" } : { publishDate: "desc" };

  return prisma.blogPost.findMany({
    where,
    orderBy,
    take,
    include: { category: { select: { id: true, name: true, slug: true } } }
  });
}

/**
 * Fetch all blog categories for admin UI.
 */
export async function getBlogCategoriesForAdmin() {
  return prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
}

/**
 * Fetch all product categories for admin UI.
 */
export async function getProductCategoriesForAdmin() {
  return prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

/**
 * Fetch products for FeaturedCourses section.
 */
export async function getFeaturedCourses(sectionConfig: HomepageSection) {
  const { config } = sectionConfig;
  const take = config.productCount ? parseInt(config.productCount) : 4;
  const mode = config.selectionMode || "AUTOMATIC";

  const category = await prisma.category.findUnique({
    where: { slug: "courses", isActive: true }
  });

  if (!category) return []; // If courses category doesn't exist

  const baseWhere: any = {
    categoryId: category.id,
    status: "PUBLISHED",
  };

  if (mode === "MANUAL" && Array.isArray(config.productIds) && config.productIds.length > 0) {
    return prisma.product.findMany({
      where: { 
        id: { in: config.productIds },
        ...baseWhere
      },
      include: { category: true, fieldValues: { include: { field: true } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } }, course: { select: { thumbnailUrl: true, instructor: true } } },
      take
    });
  }

  const autoMode = config.automaticMode || "NEWEST";
  
  if (autoMode === "BEST_SELLING") {
    // Basic fallback using standard getCategoryProducts logic or simple query
    // To save time, we will just sort by ID or similar for most popular, since we want to reuse logic
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const purchaseEvents = await prisma.analyticsEvent.findMany({
      where: { eventType: "PURCHASE_COMPLETED", createdAt: { gte: thirtyDaysAgo } },
      select: { productId: true, metadata: true }
    });

    const salesMap: Record<string, number> = {};
    for (const ev of purchaseEvents) {
      if (!ev.productId) continue;
      let qty = 1;
      try {
        if (ev.metadata) qty = JSON.parse(ev.metadata).quantity || 1;
      } catch (e) {}
      salesMap[ev.productId] = (salesMap[ev.productId] || 0) + qty;
    }

    const topIds = Object.entries(salesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, take)
      .map(entry => entry[0]);

    if (topIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: topIds }, ...baseWhere },
        include: { category: true, fieldValues: { include: { field: true } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } }, course: { select: { thumbnailUrl: true, instructor: true } } }
      });
      return topIds.map(id => products.find(p => p.id === id)).filter(Boolean);
    }
  } 

  if (autoMode === "HIGHEST_RATED") {
    const products = await prisma.product.findMany({
      where: baseWhere,
      include: { category: true, fieldValues: { include: { field: true } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } }, course: { select: { thumbnailUrl: true, instructor: true } } },
      take: take * 4 // over-fetch to sort in memory
    });
    const withRatings = products.map(p => ({
      ...p,
      _avgRating: p.reviews.length > 0 ? p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length : 0
    }));
    withRatings.sort((a, b) => b._avgRating - a._avgRating);
    return withRatings.slice(0, take);
  }

  let orderBy: any = { createdAt: "desc" };
  if (autoMode === "FEATURED") orderBy = { sortOrder: "asc" };

  return prisma.product.findMany({
    where: baseWhere,
    orderBy,
    take,
    include: { category: true, fieldValues: { include: { field: true } }, reviews: { where: { status: "APPROVED" }, select: { rating: true } }, course: { select: { thumbnailUrl: true, instructor: true } } }
  });
}
