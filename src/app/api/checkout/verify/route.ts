import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getPaymentProvider } from "@/lib/payments";
import { fulfillOrder } from "@/lib/fulfillment";
import { trackPurchaseCompleted } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, transactionId } = await req.json();

    if (!orderId || !transactionId) {
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

    const paymentRecord = order.payments.find(p => p.transactionId === transactionId);
    if (!paymentRecord) {
      return NextResponse.json({ error: "Transaction not found for this order" }, { status: 404 });
    }

    // Verify payment with provider
    const provider = getPaymentProvider(paymentRecord.method);
    const verification = await provider.verifyPayment(transactionId);

    if (verification.success && verification.status === "PAID") {
      // Update Payment and Order state using a transaction
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentRecord.id },
          data: { status: "PAID" }
        });
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PAID" }
        });
        
        // Log event
        await tx.auditLog.create({
          data: {
            actorId: session.user.id,
            actorEmail: session.user.email,
            action: "PAYMENT_VERIFIED",
            entity: "Order",
            entityId: orderId,
            metadata: JSON.stringify({ transactionId })
          }
        });
      });

      // TRIGGER FULFILLMENT ENGINE
      await fulfillOrder(orderId);
      
      // Track Analytics
      await trackPurchaseCompleted(orderId, session.user.id);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
