import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim() || existing.title;
    let slug = (formData.get("slug") as string)?.trim().toLowerCase() || existing.slug;

    // Check slug collision with other posts
    if (slug !== existing.slug) {
      const slugConflict = await prisma.blogPost.findFirst({
        where: { slug, id: { not: id } }
      });
      if (slugConflict) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
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

    // Check if status changes to published
    const newStatus = (formData.get("status") as string) || existing.status;
    const isPublishing = existing.status !== "PUBLISHED" && newStatus === "PUBLISHED";

    const rawTags = formData.get("tags");
    let tagsJson: string | null = null;
    if (typeof rawTags === "string" && rawTags.trim()) {
      try {
        const parsed = JSON.parse(rawTags);
        tagsJson = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([parsed]);
      } catch {
        tagsJson = JSON.stringify(rawTags.split(",").map(t => t.trim()).filter(Boolean));
      }
    } else {
      tagsJson = existing.tags;
    }

    const rawContent = formData.get("content");
    const content = rawContent !== null ? sanitizeHtml(rawContent as string) : existing.content;

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: (formData.get("excerpt") as string) ?? existing.excerpt,
        content,
        featuredImage: (formData.get("featuredImage") as string) ?? existing.featuredImage,
        featuredImageAlt: (formData.get("featuredImageAlt") as string)?.trim() ?? (existing as any).featuredImageAlt,
        categoryId,
        status: newStatus,
        tags: tagsJson,
        seoTitle: (formData.get("seoTitle") as string) ?? existing.seoTitle,
        metaDescription: (formData.get("metaDescription") as string) ?? existing.metaDescription,
        canonicalUrl: (formData.get("canonicalUrl") as string) ?? existing.canonicalUrl,
        ...(isPublishing ? { publishDate: new Date() } : {})
      }
    });

    try {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
      if (existing.slug !== post.slug) {
        revalidatePath(`/blog/${existing.slug}`);
      }
    } catch {}

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: error.message || "Failed to update blog post" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.blogPost.delete({ where: { id } });

    try {
      revalidatePath("/");
      revalidatePath("/blog");
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json({ error: error.message || "Failed to delete post" }, { status: 500 });
  }
}
