import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { postId, content, authorName, authorEmail } = body;

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length < 3) {
      return NextResponse.json({ error: "Comment must be at least 3 characters long." }, { status: 400 });
    }

    if (content.trim().length > 3000) {
      return NextResponse.json({ error: "Comment cannot exceed 3000 characters." }, { status: 400 });
    }

    // Check if post exists and is published
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true }
    });

    if (!post || post.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Article not found or not published." }, { status: 404 });
    }

    // Determine author info: ALWAYS prioritize the custom name entered in the form
    let name = typeof authorName === "string" ? authorName.trim() : "";
    let email = typeof authorEmail === "string" ? authorEmail.trim() : null;
    let userId: string | null = null;

    if (session?.user) {
      userId = (session.user as any).id || null;
      // Only fallback to session name/email if the user left the input blank
      if (!name) {
        name = session.user.name?.trim() || "Verified Member";
      }
      if (!email && session.user.email) {
        email = session.user.email.trim();
      }
    }

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }

    // Sanitize comment text to prevent XSS
    const cleanContent = sanitizeHtml(content.trim());

    // By default, all new comments go to PENDING approval
    const comment = await prisma.blogComment.create({
      data: {
        postId,
        userId,
        authorName: name,
        authorEmail: email || null,
        content: cleanContent,
        status: "PENDING",
      }
    });

    return NextResponse.json({
      success: true,
      message: "Your comment has been submitted and is awaiting moderator approval.",
      comment: {
        id: comment.id,
        authorName: comment.authorName,
        status: comment.status,
        createdAt: comment.createdAt
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating blog comment:", error);
    return NextResponse.json({ error: error.message || "Failed to submit comment." }, { status: 500 });
  }
}
