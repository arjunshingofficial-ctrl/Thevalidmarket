import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addWalletFunds } from "@/lib/wallet";
import { createUserNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = (await getServerSession(authOptions)) as any;

    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const orderId = resolvedParams.id;
    const body = await req.json().catch(() => ({}));
    const refundType = body.refundType || "WALLET"; // "WALLET" | "MANUAL"
    const reason = body.reason?.trim() || "Customer requested refund";
    const note = body.note?.trim() || "";
    const revokeAccess = body.revokeAccess !== false; // default true

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

    if (order.paymentStatus === "REFUNDED" || order.orderStatus === "REFUNDED") {
      return NextResponse.json(
        { error: "This order has already been refunded" },
        { status: 400 }
      );
    }

    const amount =
      typeof body.amount === "number" && body.amount > 0 ? body.amount : order.total;

    if (amount > order.total) {
      return NextResponse.json(
        { error: `Refund amount cannot exceed order total ($${order.total.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Process refund in a database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "REFUNDED",
          orderStatus: "REFUNDED",
        },
      });

      // 2. Update payment records
      await tx.payment.updateMany({
        where: { orderId },
        data: {
          status: "REFUNDED",
        },
      });

      // 3. Revoke access to files, licenses, and subscriptions if requested
      if (revokeAccess) {
        await tx.entitlement.updateMany({
          where: { orderId },
          data: { status: "REVOKED" },
        });

        await tx.license.updateMany({
          where: { orderId },
          data: { status: "REVOKED" },
        });

        await tx.subscription.updateMany({
          where: { orderId },
          data: { status: "CANCELLED" },
        });
      }

      // 4. Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "ORDER_REFUNDED",
          entity: "Order",
          entityId: orderId,
          metadata: JSON.stringify({
            amount,
            refundType,
            reason,
            note,
            revokeAccess,
            customerEmail: order.user.email,
          }),
        },
      });
    });

    // 5. If WALLET refund selected, credit the customer's on-site wallet
    if (refundType === "WALLET") {
      const fullReason = note ? `${reason}: ${note}` : reason;
      await addWalletFunds(
        order.userId,
        amount,
        0,
        "ORDER_REFUND",
        orderId,
        `Refund for Order #${orderId.slice(0, 8).toUpperCase()}: ${fullReason}`
      );
    }

    // 6. Dispatch in-app customer notification
    await createUserNotification({
      userId: order.userId,
      type: "ORDER",
      title: "Order Refund Processed",
      message: `Your Order #${orderId.slice(0, 8).toUpperCase()} has been refunded ($${amount.toFixed(
        2
      )})${
        refundType === "WALLET" ? " to your wallet balance." : "."
      } Reason: ${reason}${note ? ` (${note})` : ""}`,
      actionUrl: `/dashboard/orders/${orderId}`,
      entityType: "ORDER",
      entityId: orderId,
    });

    return NextResponse.json({
      success: true,
      message: `Order #${orderId.slice(0, 8).toUpperCase()} refunded successfully.`,
      amount,
      refundType,
    });
  } catch (err: any) {
    console.error("Refund error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
