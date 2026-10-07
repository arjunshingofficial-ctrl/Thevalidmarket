"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Check if user is eligible to review a product
 */
export async function canReviewProduct(userId: string, productId: string) {
  // Check if they bought it
  // Orders -> OrderItem -> productId
  const hasPurchasedThroughOrder = await prisma.order.findFirst({
    where: {
      userId,
      paymentStatus: "PAID",
      items: {
        some: {
          productId,
        },
      },
    },
  });

  if (hasPurchasedThroughOrder) {
    return true;
  }

  // Check entitlements directly
  const hasEntitlement = await prisma.entitlement.findFirst({
    where: {
      userId,
      productId,
      status: "ACTIVE",
    },
  });

  return !!hasEntitlement;
}

/**
 * Submit or update a review from the customer
 */
export async function submitReview(data: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  avatarSeed?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { productId, rating, title, comment, avatarSeed } = data;
  if (rating < 1 || rating > 5) throw new Error("Invalid rating");

  // Verify eligibility
  const eligible = await canReviewProduct(session.user.id, productId);
  if (!eligible) {
    throw new Error("You must purchase this product to leave a review.");
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId: session.user.id,
        productId,
      },
    },
  });

  if (existingReview) {
    // Update existing
    await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        title,
        comment,
        status: "PENDING", // Back to pending if updated
        ...(avatarSeed && { avatarSeed }),
      },
    });
  } else {
    // Create new
    await prisma.review.create({
      data: {
        userId: session.user.id,
        productId,
        rating,
        title,
        comment,
        status: "PENDING",
        type: "VERIFIED_CUSTOMER_REVIEW",
        verifiedPurchase: true,
        avatarSeed: avatarSeed || Math.random().toString(36).substring(7),
      },
    });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product) {
    revalidatePath(`/product/${product.slug}`);
  }
  revalidatePath(`/product/[slug]`, "page");
  revalidatePath("/dashboard/reviews");

  return { success: true };
}

/**
 * Delete own review
 */
export async function deleteReview(reviewId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) throw new Error("Not found");
  if (review.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  const product = await prisma.product.findUnique({ where: { id: review.productId } });
  if (product) {
    revalidatePath(`/product/${product.slug}`);
  }
  revalidatePath(`/product/[slug]`, "page");
  revalidatePath("/dashboard/reviews");

  return { success: true };
}
