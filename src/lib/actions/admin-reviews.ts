"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { canReviewProduct } from "./reviews";
import { trackActivityEvent } from "@/lib/analytics";

export async function moderateReview(reviewId: string, action: string, newCreatedAt?: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return { success: false, error: "Review not found" };

    if (action === "DELETE") {
      await prisma.review.delete({ where: { id: reviewId } });
    } else {
      // action is STATUS: APPROVED, REJECTED, HIDDEN
      if (!["APPROVED", "REJECTED", "HIDDEN", "PENDING"].includes(action)) {
        return { success: false, error: "Invalid status" };
      }
      const data: any = { status: action };
      if (newCreatedAt) {
        const d = new Date(newCreatedAt);
        if (!isNaN(d.getTime())) data.createdAt = d;
      }
      await prisma.review.update({
        where: { id: reviewId },
        data,
      });
      
      if (action === "APPROVED") {
        try {
          await trackActivityEvent("REVIEW_APPROVED", review.productId, "Review approved");
        } catch (e) {
          console.error("Activity tracking error:", e);
        }
      }
    }

    // Revalidate specific product and dynamic route
    const product = await prisma.product.findUnique({ where: { id: review.productId } });
    if (product) {
      revalidatePath(`/product/${product.slug}`);
      revalidatePath(`/courses/${product.slug}`);
      revalidatePath(`/product/[slug]`, "page");
    }
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (err: any) {
    console.error("Error in moderateReview:", err);
    return { success: false, error: err?.message || "Failed to moderate review" };
  }
}

export async function updateReviewDate(reviewId: string, newCreatedAt: string) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
      return { success: false, error: "Unauthorized" };
    }
    const d = new Date(newCreatedAt);
    if (isNaN(d.getTime())) return { success: false, error: "Invalid date" };

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return { success: false, error: "Review not found" };

    await prisma.review.update({
      where: { id: reviewId },
      data: { createdAt: d },
    });

    const product = await prisma.product.findUnique({ where: { id: review.productId } });
    if (product) {
      revalidatePath(`/product/${product.slug}`);
      revalidatePath(`/courses/${product.slug}`);
      revalidatePath(`/product/[slug]`, "page");
    }
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (err: any) {
    console.error("Error in updateReviewDate:", err);
    return { success: false, error: err?.message || "Failed to update review date" };
  }
}

export async function adminAddReview(data: {
  productId: string;
  userId?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  type: string;
  avatarSeed?: string;
  createdAt?: string;
}) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
      return { success: false, error: "Unauthorized" };
    }

    if (!data.productId || (!data.userId && !data.reviewerName) || !data.comment) {
      return { success: false, error: "Please fill in all required fields" };
    }

    let targetUserId = data.userId;

    if (data.reviewerName && data.reviewerName.trim()) {
      const name = data.reviewerName.trim();
      const email = data.reviewerEmail?.trim()
        ? data.reviewerEmail.trim().toLowerCase()
        : `reviewer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@thevalidmarket.local`;

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name,
          },
        });
      } else if (user.name !== name) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name },
        });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return { success: false, error: "Reviewer user could not be determined" };
    }

    // For admin-created reviews, if admin selects VERIFIED_CUSTOMER_REVIEW, mark it as verified
    const verifiedPurchase = data.type === "VERIFIED_CUSTOMER_REVIEW";
    const reviewDate = data.createdAt ? new Date(data.createdAt) : new Date();
    const validDate = isNaN(reviewDate.getTime()) ? new Date() : reviewDate;

    await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: targetUserId,
          productId: data.productId,
        },
      },
      update: {
        rating: Number(data.rating),
        title: data.title || null,
        comment: data.comment,
        type: data.type,
        verifiedPurchase,
        status: "APPROVED",
        avatarSeed: data.avatarSeed || Math.random().toString(36).substring(7),
        createdAt: validDate,
      },
      create: {
        productId: data.productId,
        userId: targetUserId,
        rating: Number(data.rating),
        title: data.title || null,
        comment: data.comment,
        type: data.type,
        verifiedPurchase,
        status: "APPROVED",
        avatarSeed: data.avatarSeed || Math.random().toString(36).substring(7),
        createdAt: validDate,
      },
    });

    try {
      await trackActivityEvent("REVIEW_APPROVED", data.productId, "Review approved");
    } catch (e) {
      console.error("Activity tracking error:", e);
    }

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (product) {
      revalidatePath(`/product/${product.slug}`);
      revalidatePath(`/courses/${product.slug}`);
      revalidatePath(`/product/[slug]`, "page");
    }
    revalidatePath("/admin/reviews");

    return { success: true };
  } catch (err: any) {
    console.error("Error in adminAddReview:", err);
    return { success: false, error: err?.message || "Failed to add review" };
  }
}
