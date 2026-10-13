import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.blogComment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, content, authorName, authorEmail } = body;

    const data: any = {};
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      data.status = status;
    }
    if (typeof content === "string" && content.trim()) {
      data.content = sanitizeHtml(content.trim());
    }
    if (typeof authorName === "string" && authorName.trim()) {
      data.authorName = authorName.trim();
    }
    if (typeof authorEmail === "string") {
      data.authorEmail = authorEmail.trim() || null;
    }

    const updated = await prisma.blogComment.update({
      where: { id },
      data,
      include: {
        post: {
          select: { id: true, title: true, slug: true }
        }
      }
    });

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: error.message || "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.blogComment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await prisma.blogComment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: error.message || "Failed to delete comment" }, { status: 500 });
  }
}
