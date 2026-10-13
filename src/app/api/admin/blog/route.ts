import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    let slug = (formData.get("slug") as string)?.trim().toLowerCase();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!slug) {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }

    // Check slug uniqueness
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Get valid author ID
    let authorId = (session.user as any).id;
    if (!authorId && session.user.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      authorId = user?.id;
    }
    if (!authorId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } } }
      });
      authorId = adminUser?.id || "admin";
    }

    // Validate categoryId
    const rawCategoryId = formData.get("categoryId") as string;
    let categoryId: string | null = null;
    if (rawCategoryId && rawCategoryId.trim() && rawCategoryId !== "null" && rawCategoryId !== "undefined") {
      const categoryExists = await prisma.blogCategory.findUnique({ where: { id: rawCategoryId } });
      if (categoryExists) {
        categoryId = rawCategoryId;
      }
    }

    // Tags processing
    const rawTags = formData.get("tags");
    let tagsJson: string | null = null;
    if (typeof rawTags === "string" && rawTags.trim()) {
      try {
        const parsed = JSON.parse(rawTags);
        tagsJson = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([parsed]);
      } catch {
        tagsJson = JSON.stringify(rawTags.split(",").map(t => t.trim()).filter(Boolean));
      }
    }

    const status = (formData.get("status") as string) || "DRAFT";
    const content = sanitizeHtml((formData.get("content") as string) || "");

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        excerpt: (formData.get("excerpt") as string) || null,
        content,
        featuredImage: (formData.get("featuredImage") as string) || null,
        featuredImageAlt: (formData.get("featuredImageAlt") as string)?.trim() || null,
        categoryId,
        status,
        tags: tagsJson,
        seoTitle: (formData.get("seoTitle") as string) || null,
        metaDescription: (formData.get("metaDescription") as string) || null,
        canonicalUrl: (formData.get("canonicalUrl") as string) || null,
        authorId,
        publishDate: status === "PUBLISHED" ? new Date() : null,
      }
    });

    try {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
    } catch {}

    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    return NextResponse.json({ error: error.message || "Failed to create blog post" }, { status: 500 });
  }
}
