import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin("Content", "Manage");
    const { id } = await params;
    const formData = await req.formData();
    
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const content = formData.get("content") as string;
    const status = formData.get("status") as any;
    const seoTitle = formData.get("seoTitle") as string;
    const metaDescription = formData.get("metaDescription") as string;
    const canonicalUrl = formData.get("canonicalUrl") as string;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Page title is required." }, { status: 400 });
    }
    
    if (!slug?.trim()) {
      return NextResponse.json({ error: "Page slug is required." }, { status: 400 });
    }
    
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: "Invalid slug format. Use only lowercase letters, numbers, and hyphens." }, { status: 400 });
    }

    const existingPage = await prisma.page.findUnique({ where: { slug } });
    if (existingPage && existingPage.id !== id) {
      return NextResponse.json({ error: "Slug already exists." }, { status: 400 });
    }

    const page = await prisma.page.update({
      where: { id },
      data: {
        title,
        slug,
        content: content || "",
        status: status || "DRAFT",
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        canonicalUrl: canonicalUrl || null,
      }
    });

    revalidatePath("/admin/pages");
    revalidatePath(`/admin/pages/${page.id}/edit`);
    revalidatePath(`/${page.slug}`);

    return NextResponse.json(page);
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error;
    console.error("Page update error:", error);
    return NextResponse.json({ error: "Unable to save page. Please try again." }, { status: 500 });
  }
}
