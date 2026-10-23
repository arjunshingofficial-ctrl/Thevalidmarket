import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug")?.trim().toLowerCase() || "";
    const title = searchParams.get("title")?.trim() || "";
    const seoTitle = searchParams.get("seoTitle")?.trim() || "";
    const metaDescription = searchParams.get("metaDescription")?.trim() || "";
    const postId = searchParams.get("postId")?.trim() || "";

    // 1. Slug Conflict Detection
    let slugConflict: { type: string; title: string; url: string } | null = null;
    if (slug) {
      const conflictingPost = await prisma.blogPost.findFirst({
        where: {
          slug,
          ...(postId ? { id: { not: postId } } : {}),
        },
        select: { id: true, title: true, slug: true, status: true },
      });

      if (conflictingPost) {
        slugConflict = {
          type: "blog",
          title: conflictingPost.title,
          url: `/blog/${conflictingPost.slug}`,
        };
      } else {
        const conflictingPage = await prisma.page.findFirst({
          where: { slug },
          select: { id: true, title: true, slug: true },
        });
        if (conflictingPage) {
          slugConflict = {
            type: "page",
            title: conflictingPage.title,
            url: `/${conflictingPage.slug}`,
          };
        }
      }
    }

    // 2. SEO Title Uniqueness Check across published posts
    let titleConflict: { id: string; title: string; slug: string } | null = null;
    const effectiveTitleToCheck = (seoTitle || title).toLowerCase();
    if (effectiveTitleToCheck && effectiveTitleToCheck.length > 5) {
      const duplicatePost = await prisma.blogPost.findFirst({
        where: {
          status: "PUBLISHED",
          ...(postId ? { id: { not: postId } } : {}),
          OR: [
            { seoTitle: { equals: seoTitle || title, mode: "insensitive" } },
            { title: { equals: title || seoTitle, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, slug: true },
      });

      if (duplicatePost) {
        titleConflict = {
          id: duplicatePost.id,
          title: duplicatePost.title,
          slug: duplicatePost.slug,
        };
      }
    }

    // 3. Meta Description Uniqueness Check
    let descConflict: { id: string; title: string; slug: string } | null = null;
    if (metaDescription && metaDescription.length > 30) {
      const duplicateDesc = await prisma.blogPost.findFirst({
        where: {
          status: "PUBLISHED",
          ...(postId ? { id: { not: postId } } : {}),
          metaDescription: { equals: metaDescription, mode: "insensitive" },
        },
        select: { id: true, title: true, slug: true },
      });

      if (duplicateDesc) {
        descConflict = {
          id: duplicateDesc.id,
          title: duplicateDesc.title,
          slug: duplicateDesc.slug,
        };
      }
    }

    // 4. Established Slug & Redirect Detection
    let establishedSlugNeedsRedirect = false;
    let oldSlug: string | null = null;
    if (postId) {
      const currentPost = await prisma.blogPost.findUnique({
        where: { id: postId },
        select: { slug: true, status: true },
      });
      if (currentPost && currentPost.status === "PUBLISHED" && slug && currentPost.slug !== slug) {
        establishedSlugNeedsRedirect = true;
        oldSlug = currentPost.slug;
      }
    }

    // 5. Fetch Real Site URLs for Smart Internal Linking
    const [recentPosts, popularProducts, categories] = await Promise.all([
      prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          ...(postId ? { id: { not: postId } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { title: true, slug: true },
      }),
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { name: true, slug: true, type: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 6,
        select: { name: true, slug: true },
      }),
    ]);

    const siteLinks = {
      articles: recentPosts.map((p) => ({ title: p.title, url: `/blog/${p.slug}` })),
      products: popularProducts.map((p) => ({ title: p.name, url: `/product/${p.slug}`, type: p.type })),
      categories: categories.map((c) => ({ title: c.name, url: `/category/${c.slug}` })),
    };

    return NextResponse.json({
      slugConflict,
      titleConflict,
      descConflict,
      establishedSlugNeedsRedirect,
      oldSlug,
      siteLinks,
    });
  } catch (error: any) {
    console.error("Error running SEO check API:", error);
    return NextResponse.json({ error: error.message || "Failed to run SEO check" }, { status: 500 });
  }
}
