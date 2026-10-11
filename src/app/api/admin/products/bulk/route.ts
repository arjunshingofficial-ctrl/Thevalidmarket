import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

function requireAdminSession(session: Session | null) {
  if (!session?.user) return false;
  return ["ADMIN", "STAFF", "MANAGER"].includes(session.user.role as string);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdminSession(session as Session | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "No products selected" }, { status: 400 });
    }

    const validActions = ["publish", "unpublish", "archive", "delete"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "delete") {
      // Deleting products in bulk
      await prisma.$transaction([
        prisma.productFieldValue.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.productFile.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.productVariant.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.licenseKey.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.course.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.subscription.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.review.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.entitlement.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.orderItem.deleteMany({ where: { productId: { in: productIds } } }),
        prisma.product.deleteMany({ where: { id: { in: productIds } } }),
      ]);

      await createAuditLog({
        action: "PRODUCTS_BULK_DELETED",
        entity: "Product",
        entityId: "bulk",
        metadata: {
          count: productIds.length,
          productIds,
          actorEmail: session?.user?.email,
        },
      });
    } else {
      let targetStatus = "PUBLISHED";
      if (action === "unpublish") targetStatus = "DRAFT";
      if (action === "archive") targetStatus = "ARCHIVED";

      await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { status: targetStatus },
      });

      await createAuditLog({
        action: `PRODUCTS_BULK_${action.toUpperCase()}`,
        entity: "Product",
        entityId: "bulk",
        metadata: {
          count: productIds.length,
          targetStatus,
          productIds,
          actorEmail: session?.user?.email,
        },
      });
    }

    // Revalidate storefront and admin paths
    revalidatePath("/");
    revalidatePath("/store");
    revalidatePath("/admin/products");

    return NextResponse.json({
      success: true,
      count: productIds.length,
      action,
    });
  } catch (error: any) {
    console.error("Bulk action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute bulk action" },
      { status: 500 }
    );
  }
}
