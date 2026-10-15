import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import NewsCategoryHub, { HubCategory, HubPost } from "@/components/blog/NewsCategoryHub";

export const revalidate = 120; // 2 minutes CDN cache with background revalidation

interface PageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const categorySlug = resolved.category?.trim().toLowerCase();

  if (categorySlug) {
    try {
      const category = await prisma.blogCategory.findUnique({
        where: { slug: categorySlug },
      });

      if (category) {
        const title = category.seoTitle || `${category.name} News, Guides & Tutorials | The Valid Market`;
        const description =
          category.seoDescription ||
          category.description ||
          `Browse all in-depth articles, tutorials, and operational updates in the ${category.name} category on The Valid Market.`;

        return {
          title,
          description,
          alternates: {
            canonical: `/news?category=${category.slug}`,
          },
          openGraph: {
            title,
            description,
            type: "website",
            url: `/news?category=${category.slug}`,
          },
          twitter: {
            card: "summary_large_image",
            title,
            description,
          },
        };
      }
    } catch (e) {
      console.error("Error generating category metadata:", e);
    }
  }

  return {
    title: "News, Insights & Technical Guides | The Valid Market",
    description:
      "Read the latest tutorials, proxy configurations, cybersecurity breakdowns, and platform announcements from The Valid Market.",
    alternates: {
      canonical: "/news",
    },
    openGraph: {
      title: "News, Insights & Technical Guides | The Valid Market",
      description:
        "Read the latest tutorials, proxy configurations, cybersecurity breakdowns, and platform announcements from The Valid Market.",
      type: "website",
      url: "/news",
    },
  };
}

export default async function NewsPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const categorySlug = resolved.category?.trim().toLowerCase();
  const q = resolved.q?.trim();
  const sort = resolved.sort || "newest";

  // 1. Fetch all blog categories with published post count
  let categories: HubCategory[] = [];
  try {
    const rawCats = await prisma.blogCategory.findMany({
      include: {
        _count: {
          select: {
            posts: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    categories = rawCats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      seoTitle: c.seoTitle,
      seoDescription: c.seoDescription,
      postCount: c._count.posts,
    }));
  } catch (err) {
    console.error("Error loading blog categories:", err);
  }

  // 2. Resolve active category
  let activeCategory: HubCategory | null = null;
  if (categorySlug) {
    activeCategory = categories.find((c) => c.slug.toLowerCase() === categorySlug) || null;
    if (!activeCategory) {
      try {
        const directCat = await prisma.blogCategory.findUnique({
          where: { slug: categorySlug },
          include: {
            _count: {
              select: {
                posts: {
                  where: { status: "PUBLISHED" },
                },
              },
            },
          },
        });
        if (directCat) {
          activeCategory = {
            id: directCat.id,
            name: directCat.name,
            slug: directCat.slug,
            description: directCat.description,
            seoTitle: directCat.seoTitle,
            seoDescription: directCat.seoDescription,
            postCount: directCat._count.posts,
          };
        }
      } catch (err) {
        console.error("Error finding category directly:", err);
      }
    }
  }

  // 3. Build where clause
  const whereClause: any = {
    status: "PUBLISHED",
  };

  if (activeCategory) {
    whereClause.categoryId = activeCategory.id;
  }

  if (q) {
    whereClause.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  // 4. Determine ordering
  let orderBy: any = { publishDate: "desc" };
  if (sort === "popular") {
    orderBy = { views: "desc" };
  } else if (sort === "oldest") {
    orderBy = { publishDate: "asc" };
  }

  // 5. Query posts
  let posts: HubPost[] = [];
  try {
    const rawPosts = await prisma.blogPost.findMany({
      where: whereClause,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy,
    });
    posts = rawPosts as HubPost[];
  } catch (err) {
    console.error("Error querying blog posts:", err);
  }

  // 6. Query recent posts, popular products, and featured courses for sidebar
  let recentPosts: any[] = [];
  let popularProducts: any[] = [];
  let featuredCourses: any[] = [];

  try {
    const [recentRaw, productsRaw, coursesRaw] = await Promise.all([
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        include: { category: true },
        orderBy: { publishDate: "desc" },
        take: 4,
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          type: true,
          metadata: true,
        },
      }),
      prisma.course.findMany({
        where: { status: "ACTIVE" },
        take: 2,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
            },
          },
        },
      }),
    ]);

    recentPosts = recentRaw.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      featuredImage: p.featuredImage,
      publishDate: p.publishDate,
      createdAt: p.createdAt,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    }));

    popularProducts = productsRaw;

    featuredCourses = coursesRaw
      .filter((c) => c && c.product)
      .map((c) => ({
        id: c.id,
        title: c.product.name,
        slug: c.product.slug,
        price: c.product.price,
        imageUrl: c.thumbnailUrl,
        level: "All Levels",
      }));

    if (featuredCourses.length === 0) {
      const fallbackCourseProducts = await prisma.product.findMany({
        where: { status: "PUBLISHED", type: "COURSE" },
        take: 2,
      });
      featuredCourses = fallbackCourseProducts.map((p) => ({
        id: p.id,
        title: p.name,
        slug: p.slug,
        price: p.price,
        imageUrl: null,
        level: "Masterclass",
      }));
    }
  } catch (err) {
    console.error("Error querying sidebar data:", err);
  }

  return (
    <NewsCategoryHub
      posts={posts}
      categories={categories}
      activeCategory={activeCategory}
      searchQuery={q}
      currentSort={sort}
      basePath="/news"
      popularProducts={popularProducts}
      featuredCourses={featuredCourses}
      recentPosts={recentPosts}
    />
  );
}
