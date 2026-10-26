import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queryBladePayOrder } from "@/lib/payments/bladepay";
import { fulfillOrder } from "@/lib/fulfillment";
import { processReferralCommission } from "@/lib/referrals";
import { trackPurchaseCompleted } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({
        isPaid: true,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      });
    }

    // Actively query BladePay API to check if customer finished payment
    try {
      const bladeCheck = await queryBladePayOrder(order.id);
      if (bladeCheck.success && bladeCheck.isPaid) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            orderStatus: "PROCESSING",
          },
        });

        const payment = order.payments.find((p) => p.method === "UPI" || p.mode === "BLADEPAY");
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              transactionId: bladeCheck.utr || bladeCheck.gatewayOrderNo || payment.transactionId,
              verifiedAt: new Date(),
            },
          });
        }

        try {
          await fulfillOrder(order.id);
          await processReferralCommission(order.id);
          await trackPurchaseCompleted(order.id, order.userId);
        } catch (fulfillErr) {
          console.error("[VerifyStatus] Fulfillment error:", fulfillErr);
        }

        return NextResponse.json({
          isPaid: true,
          orderStatus: "PROCESSING",
          paymentStatus: "PAID",
          utr: bladeCheck.utr,
        });
      }
    } catch (e) {
      console.error("[VerifyStatus] BladePay query error:", e);
    }

    return NextResponse.json({
      isPaid: false,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
