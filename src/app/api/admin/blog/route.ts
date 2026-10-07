import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";

export async function POST(req: Request) {
  try {
    const session = await requireAdmin("Content", "Manage");
    const formData = await req.formData();
    
    const post = await prisma.blogPost.create({
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
        authorId: session.user.id,
        publishDate: formData.get("status") === "PUBLISHED" ? new Date() : null,
      }
    });

    return NextResponse.json(post);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
