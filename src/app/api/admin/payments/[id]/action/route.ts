import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/fulfillment";
import { createAuditLog } from "@/lib/actions/admin";
import { trackPurchaseCompleted } from "@/lib/analytics";
import { processReferralCommission } from "@/lib/referrals";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const paymentId = resolvedParams.id;
    const { action, reason } = await req.json();

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "PAYMENT_REVIEW") {
      return NextResponse.json({ error: "Payment is not in review state" }, { status: 400 });
    }

    if (action === "APPROVE") {
      // Idempotency: Make sure order isn't already paid
      if (payment.order.paymentStatus === "PAID") {
        return NextResponse.json({ error: "Order is already paid" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "PAID",
            verifiedAt: new Date(),
            verifiedById: session.user.id
          }
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "PAID",
            orderStatus: "PROCESSING" // Fulfillment engine sets to FULFILLED
          }
        })
      ]);

      await createAuditLog({
        action: "PAYMENT_APPROVED",
        entity: "Payment",
        entityId: paymentId,
        metadata: { actorEmail: session.user.email, amount: payment.amount }
      });

      // TRIGGER EXACTLY ONCE FULFILLMENT
      await fulfillOrder(payment.orderId);
      
      // Process Referral Commission
      await processReferralCommission(payment.orderId);
      
      // Track Analytics
      await trackPurchaseCompleted(payment.orderId, payment.order.userId);

      return NextResponse.json({ success: true });

    } else if (action === "REJECT") {
      if (!reason) {
        return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: "REJECTED",
            rejectionReason: reason,
            verifiedAt: new Date(),
            verifiedById: session.user.id
          }
        }),
        prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "FAILED"
          }
        })
      ]);

      await createAuditLog({
        action: "PAYMENT_REJECTED",
        entity: "Payment",
        entityId: paymentId,
        metadata: { reason, actorEmail: session.user.email }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err: any) {
    console.error("Payment action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
