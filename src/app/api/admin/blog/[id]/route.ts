import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin("Content", "Manage");
    const { id } = await params;
    const formData = await req.formData();
    
    // Check if status changes to published
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { status: true, publishDate: true } });
    const isPublishing = existing?.status !== "PUBLISHED" && formData.get("status") === "PUBLISHED";
    
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title: formData.get("title") as string,
        slug: formData.get("slug") as string,
        excerpt: formData.get("excerpt") as string,
        content: formData.get("content") as string,
        featuredImage: formData.get("featuredImage") as string,
        categoryId: (formData.get("categoryId") as string) || null,
        status: formData.get("status") as any,
        seoTitle: formData.get("seoTitle") as string,
        metaDescription: formData.get("metaDescription") as string,
        canonicalUrl: formData.get("canonicalUrl") as string,
        ...(isPublishing ? { publishDate: new Date() } : {})
      }
    });

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
