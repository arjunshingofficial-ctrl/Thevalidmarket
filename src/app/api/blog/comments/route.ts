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

    const { postId, content, authorName, authorEmail, parentId, parentAuthor, rating, title } = body;

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length < 3) {
      return NextResponse.json({ error: "Review or comment must be at least 3 characters long." }, { status: 400 });
    }

    if (content.trim().length > 3000) {
      return NextResponse.json({ error: "Text cannot exceed 3000 characters." }, { status: 400 });
    }

    // Check if post exists and is published
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, slug: true, status: true }
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

    // Sanitize review/comment text to prevent XSS
    let cleanContent = sanitizeHtml(content.trim());

    // If rating or title is provided, prepend encoded metadata tags
    if (rating !== undefined || (title && typeof title === "string" && title.trim())) {
      const starRating = Math.min(5, Math.max(1, Number(rating) || 5));
      const cleanTitle = title && typeof title === "string" ? sanitizeHtml(title.trim().slice(0, 120)) : "";
      cleanContent = `[rating:${starRating}][title:${cleanTitle}]\n\n${cleanContent}`;
    }

    // If this is a reply to an existing comment/review, record parent association
    if (parentId && typeof parentId === "string") {
      const parentName = typeof parentAuthor === "string" && parentAuthor.trim() ? parentAuthor.trim() : "Member";
      cleanContent = `[reply:${parentId.trim()}:@${parentName}]\n\n${cleanContent}`;
    }

    // All new comments and reviews go to PENDING approval in admin panel
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

    const isReview = post.slug === "the-valid-market-review" || rating !== undefined;
    const successMessage = isReview
      ? "Thank you for Review us"
      : (parentId ? "Thank you for your reply!" : "Thank You for commenting!");

    return NextResponse.json({
      success: true,
      message: successMessage,
      comment: {
        id: comment.id,
        authorName: comment.authorName,
        status: comment.status,
        createdAt: comment.createdAt
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating blog comment/review:", error);
    return NextResponse.json({ error: error.message || "Failed to submit review." }, { status: 500 });
  }
}
