import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/fulfillment";
import { createUserNotification } from "@/lib/notifications";
import { trackPurchaseCompleted } from "@/lib/analytics";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = (await getServerSession(authOptions)) as any;

    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const orderId = resolvedParams.id;
    const body = await req.json().catch(() => ({}));
    const action = (body.action || "").toUpperCase();
    const reason = body.reason?.trim() || "Manual action by administrator";

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        payments: true,
        entitlements: true,
        licenses: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ----------------------------------------------------
    // ACTION: CANCEL ORDER
    // ----------------------------------------------------
    if (action === "CANCEL") {
      if (order.orderStatus === "CANCELLED") {
        return NextResponse.json(
          { error: "This order is already cancelled" },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Mark order as CANCELLED
        await tx.order.update({
          where: { id: orderId },
          data: {
            orderStatus: "CANCELLED",
            paymentStatus: order.paymentStatus === "PENDING" ? "FAILED" : order.paymentStatus,
          },
        });

        // 2. Cancel any pending or in-review payments
        await tx.payment.updateMany({
          where: {
            orderId: orderId,
            status: { in: ["PENDING", "PAYMENT_REVIEW"] },
          },
          data: {
            status: "CANCELLED",
          },
        });

        // 3. Revoke any active entitlements granted by this order
        await tx.entitlement.updateMany({
          where: {
            orderId: orderId,
            status: "ACTIVE",
          },
          data: {
            status: "REVOKED",
          },
        });

        // 4. Revoke any active licenses issued for this order
        await tx.license.updateMany({
          where: {
            orderId: orderId,
            status: "ACTIVE",
          },
          data: {
            status: "REVOKED",
          },
        });

        // 5. Cancel any pending referral commissions
        await tx.referralCommission.updateMany({
          where: {
            orderId: orderId,
            status: "PENDING",
          },
          data: {
            status: "REJECTED",
          },
        });

        // 6. Record audit log
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorEmail: session.user.email,
            action: "ORDER_CANCELLED",
            entity: "Order",
            entityId: orderId,
            metadata: JSON.stringify({
              reason,
              previousOrderStatus: order.orderStatus,
              previousPaymentStatus: order.paymentStatus,
              orderTotal: order.total,
              customerEmail: order.user?.email,
            }),
          },
        });
      });

      // 7. Notify customer
      if (order.userId) {
        await createUserNotification({
          userId: order.userId,
          type: "ORDER",
          title: "Order Cancelled",
          message: `Your order #${order.id.slice(0, 8).toUpperCase()} has been cancelled.`,
          actionUrl: `/dashboard/orders/${order.id}`,
          priority: "NORMAL",
          entityType: "Order",
          entityId: order.id,
        }).catch((err) => console.error("Failed to notify user:", err));
      }

      return NextResponse.json({
        success: true,
        message: `Order #${order.id.slice(0, 8).toUpperCase()} cancelled successfully.`,
      });
    }

    // ----------------------------------------------------
    // ACTION: FORCE FULFILL ORDER
    // ----------------------------------------------------
    if (action === "FULFILL") {
      if (order.orderStatus === "FULFILLED") {
        return NextResponse.json(
          { error: "This order is already fulfilled" },
          { status: 400 }
        );
      }

      // Update to processing first
      await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "PROCESSING",
        },
      });

      // Execute fulfillment engine
      await fulfillOrder(orderId);

      // Audit log
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "ORDER_MANUALLY_FULFILLED",
          entity: "Order",
          entityId: orderId,
          metadata: JSON.stringify({
            reason: "Admin force fulfillment",
            orderTotal: order.total,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Order #${order.id.slice(0, 8).toUpperCase()} fulfilled successfully.`,
      });
    }

    // ----------------------------------------------------
    // ACTION: MARK ORDER AS PAID
    // ----------------------------------------------------
    if (action === "MARK_PAID") {
      if (order.paymentStatus === "PAID") {
        return NextResponse.json(
          { error: "This order is already marked as paid." },
          { status: 400 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // 1. Mark order paymentStatus as PAID and orderStatus as PROCESSING
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            orderStatus: "PROCESSING",
          },
        });

        // 2. Update existing payment(s) or create a verified payment entry
        const existingPayments = await tx.payment.findMany({
          where: { orderId },
        });

        if (existingPayments.length > 0) {
          await tx.payment.updateMany({
            where: {
              orderId,
              status: { notIn: ["CANCELLED"] },
            },
            data: {
              status: "PAID",
              verifiedAt: new Date(),
              verifiedById: session.user.id,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              method: order.paymentCurrency === "INR" ? "UPI" : (order.paymentCurrency || "MANUAL"),
              mode: "MANUAL",
              status: "PAID",
              amount: order.paymentAmount || order.total,
              currency: order.paymentCurrency || order.baseCurrency || "USD",
              baseAmount: order.total,
              baseCurrency: order.baseCurrency || "USD",
              fxRate: order.fxRate || 1.0,
              verifiedAt: new Date(),
              verifiedById: session.user.id,
              metadata: JSON.stringify({
                source: "ADMIN_ORDER_HISTORY_MARK_PAID",
                markedBy: session.user.email,
                reason,
              }),
            },
          });
        }

        // 3. Update payment link stats if linked to custom payment page
        if (order.paymentLinkId) {
          await tx.paymentLink.update({
            where: { id: order.paymentLinkId },
            data: {
              paymentsCount: { increment: 1 },
              totalCollected: { increment: order.total },
              lastPaidAt: new Date(),
            },
          });
        }

        // 4. Audit Log
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorEmail: session.user.email,
            action: "ORDER_MARKED_PAID",
            entity: "Order",
            entityId: orderId,
            metadata: JSON.stringify({
              reason,
              orderTotal: order.total,
              previousPaymentStatus: order.paymentStatus,
              previousOrderStatus: order.orderStatus,
              customerEmail: order.user?.email,
            }),
          },
        });
      });

      // 5. Trigger fulfillment (creates licenses, downloads, enrollment & customer notification)
      await fulfillOrder(orderId);

      // 6. Track Purchase Analytics
      if (order.userId) {
        await trackPurchaseCompleted(orderId, order.userId).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Order #${order.id.slice(0, 8).toUpperCase()} marked as PAID and fulfilled successfully.`,
      });
    }

    return NextResponse.json(
      { error: `Unsupported action '${action}'. Valid actions are CANCEL, FULFILL, and MARK_PAID.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[Order Action Error]:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
