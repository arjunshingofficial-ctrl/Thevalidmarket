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
 * Submit or update a review from a customer or guest
 */
export async function submitReview(data: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  avatarSeed?: string;
  authorName?: string;
  authorEmail?: string;
}) {
  const { productId, rating, title, comment, avatarSeed, authorName, authorEmail } = data;

  if (!productId) throw new Error("Product ID is required.");
  if (!rating || rating < 1 || rating > 5) throw new Error("Invalid rating. Please select 1-5 stars.");
  if (!comment || comment.trim().length < 3) throw new Error("Review comment must be at least 3 characters long.");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, slug: true },
  });
  if (!product) throw new Error("Product not found.");

  const session = (await getServerSession(authOptions)) as any;
  let userId: string;
  let verifiedPurchase = false;
  let finalAuthorName = "";

  if (session?.user?.id) {
    userId = session.user.id;
    finalAuthorName = authorName?.trim() || session.user.name || "Customer";
    verifiedPurchase = await canReviewProduct(userId, productId);

    if (authorName?.trim() && (!session.user.name || session.user.name !== authorName.trim())) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { name: authorName.trim() },
        });
      } catch (e) {
        console.error("Could not update user name:", e);
      }
    }
  } else {
    // Guest submission
    finalAuthorName = authorName?.trim() || "";
    if (!finalAuthorName || finalAuthorName.length < 2) {
      throw new Error("Please enter your name.");
    }

    const email = authorEmail?.trim();
    if (email) {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: finalAuthorName,
          },
        });
      } else {
        verifiedPurchase = await canReviewProduct(user.id, productId);
      }
      userId = user.id;
    } else {
      // Create guest user record
      const guestEmail = `guest_${Math.random().toString(36).substring(2, 8)}_${Date.now()}@thevalidmarket.local`;
      const user = await prisma.user.create({
        data: {
          email: guestEmail,
          name: finalAuthorName,
        },
      });
      userId = user.id;
      verifiedPurchase = false;
    }
  }

  const existingReview = await prisma.review.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  const reviewType = verifiedPurchase ? "VERIFIED_CUSTOMER_REVIEW" : "CUSTOMER_REVIEW";

  if (existingReview) {
    await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating: Math.round(rating),
        title: title?.trim() || null,
        comment: comment.trim(),
        status: "PENDING", // Always PENDING for admin approval
        type: reviewType,
        verifiedPurchase,
        ...(avatarSeed && { avatarSeed }),
      },
    });
  } else {
    await prisma.review.create({
      data: {
        userId,
        productId,
        rating: Math.round(rating),
        title: title?.trim() || null,
        comment: comment.trim(),
        status: "PENDING", // Always PENDING for admin approval
        type: reviewType,
        verifiedPurchase,
        avatarSeed: avatarSeed || Math.random().toString(36).substring(7),
      },
    });
  }

  // Notify administrator of new review awaiting approval
  try {
    const { createAdminNotification } = await import("@/lib/notifications");
    await createAdminNotification({
      type: "REVIEW",
      title: "New Review Awaiting Approval",
      message: `${finalAuthorName} submitted a ${rating}★ review for "${product.name}". Admin approval required.`,
      priority: "NORMAL",
      actionUrl: `/admin/reviews?q=${encodeURIComponent(product.name)}`,
      entityType: "REVIEW",
      entityId: productId,
    });
  } catch (notifErr) {
    console.error("Failed to notify admin of new review:", notifErr);
  }

  revalidatePath(`/product/${product.slug}`);
  revalidatePath(`/courses/${product.slug}`);
  revalidatePath(`/product/[slug]`, "page");
  revalidatePath("/admin/reviews");
  revalidatePath("/dashboard/reviews");

  return { 
    success: true,
    message: "Thank you for your review! It has been submitted and will appear once approved by an administrator."
  };
}

/**
 * Delete own review
 */
export async function deleteReview(reviewId: string) {
  const session = (await getServerSession(authOptions)) as any;
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
