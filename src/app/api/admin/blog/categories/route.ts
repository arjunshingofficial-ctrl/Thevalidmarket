import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || !["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || !["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const formData = await req.formData();
      body = {
        name: formData.get("name"),
        slug: formData.get("slug"),
        description: formData.get("description"),
        seoTitle: formData.get("seoTitle"),
        seoDescription: formData.get("seoDescription"),
      };
    }

    const name = String(body.name || "").trim();
    let slug = String(body.slug || "").trim();
    const description = body.description ? String(body.description).trim() : null;
    const seoTitle = body.seoTitle ? String(body.seoTitle).trim() : null;
    const seoDescription = body.seoDescription ? String(body.seoDescription).trim() : null;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!slug) {
      slug = slugify(name);
    } else {
      slug = slugify(slug);
    }

    const existing = await prisma.blogCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description,
        seoTitle,
        seoDescription,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
