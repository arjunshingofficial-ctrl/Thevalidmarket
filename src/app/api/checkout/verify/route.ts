import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { queryBladePayOrder } from "@/lib/payments/bladepay";
import { fulfillOrder } from "@/lib/fulfillment";
import { trackPurchaseCompleted } from "@/lib/analytics";
import { processReferralCommission } from "@/lib/referrals";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, message: "Order already paid and fulfilled" });
    }

    const bladePayment = order.payments.find(p => p.method === "UPI" || p.mode === "BLADEPAY");

    if (!bladePayment) {
      return NextResponse.json({
        error: "This order requires manual administrator review or an official payment gateway callback."
      }, { status: 400 });
    }

    // Query live BladePay API server directly
    const bladeCheck = await queryBladePayOrder(order.id);

    if (bladeCheck.success && bladeCheck.isPaid) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: bladePayment.id },
          data: {
            status: "PAID",
            transactionId: bladeCheck.utr || bladeCheck.gatewayOrderNo || bladePayment.transactionId,
            verifiedAt: new Date(),
          }
        });
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            orderStatus: "PROCESSING",
          }
        });

        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorEmail: session.user.email,
            action: "BLADEPAY_DIRECT_VERIFIED",
            entity: "Order",
            entityId: orderId,
            metadata: JSON.stringify({ utr: bladeCheck.utr, gatewayOrderNo: bladeCheck.gatewayOrderNo })
          }
        });
      });

      // TRIGGER FULFILLMENT ENGINE
      try {
        await fulfillOrder(orderId);
        await processReferralCommission(orderId);
        await trackPurchaseCompleted(orderId, session.user.id);
      } catch (fulfillErr) {
        console.error("[Verify Route] Fulfillment error:", fulfillErr);
      }

      return NextResponse.json({ success: true, isPaid: true });
    } else {
      return NextResponse.json({
        error: "Payment has not yet settled at the gateway. Please wait or check your bank account.",
        isPaid: false,
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
