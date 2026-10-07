"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { canReviewProduct } from "./reviews";
import { trackActivityEvent } from "@/lib/analytics";

export async function moderateReview(reviewId: string, action: string) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
    throw new Error("Unauthorized");
  }

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");

  if (action === "DELETE") {
    await prisma.review.delete({ where: { id: reviewId } });
  } else {
    // action is STATUS: APPROVED, REJECTED, HIDDEN
    if (!["APPROVED", "REJECTED", "HIDDEN", "PENDING"].includes(action)) {
      throw new Error("Invalid status");
    }
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: action },
    });
    
    if (action === "APPROVED") {
      await trackActivityEvent("REVIEW_APPROVED", review.productId, "Review approved");
    }
  }

  // Revalidate specific product and dynamic route
  const product = await prisma.product.findUnique({ where: { id: review.productId } });
  if (product) {
    revalidatePath(`/product/${product.slug}`);
    revalidatePath(`/product/[slug]`, "page");
  }
  revalidatePath("/admin/reviews");
}

export async function adminAddReview(data: {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment: string;
  type: string;
  avatarSeed?: string;
}) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.role || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role)) {
    throw new Error("Unauthorized");
  }

  let verifiedPurchase = false;

  if (data.type === "VERIFIED_CUSTOMER_REVIEW") {
    const eligible = await canReviewProduct(data.userId, data.productId);
    if (!eligible) {
      throw new Error("User has not purchased this product, cannot add as verified customer review.");
    }
    verifiedPurchase = true;
  }

  await prisma.review.create({
    data: {
      productId: data.productId,
      userId: data.userId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      type: data.type,
      verifiedPurchase,
      status: "APPROVED", // Admin added reviews are auto-approved
      avatarSeed: data.avatarSeed || Math.random().toString(36).substring(7),
    },
  });

  await trackActivityEvent("REVIEW_APPROVED", data.productId, "Review approved");

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (product) {
    revalidatePath(`/product/${product.slug}`);
    revalidatePath(`/product/[slug]`, "page");
  }
  revalidatePath("/admin/reviews");

  return { success: true };
}
