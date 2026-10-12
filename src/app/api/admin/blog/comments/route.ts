import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF", "MANAGER"];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const postId = searchParams.get("postId");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (postId) {
      where.postId = postId;
    }

    const comments = await prisma.blogComment.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const pendingCount = await prisma.blogComment.count({
      where: { status: "PENDING" }
    });

    return NextResponse.json({ comments, pendingCount });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch comments" }, { status: 500 });
  }
}
