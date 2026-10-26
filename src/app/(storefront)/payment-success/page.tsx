import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PaymentSuccessClient from "./PaymentSuccessClient";
import { queryBladePayOrder } from "@/lib/payments/bladepay";
import { fulfillOrder } from "@/lib/fulfillment";
import { processReferralCommission } from "@/lib/referrals";
import { trackPurchaseCompleted } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Payment Confirmation | The Valid Market",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const session = (await getServerSession(authOptions)) as any;

  const rawOrderId = resolvedParams.orderId || resolvedParams.merchantOrderNo || resolvedParams.id;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;

  if (!orderId) {
    redirect("/dashboard/orders");
  }

  // Fetch Order
  let order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: orderId },
        { id: orderId.replace(/^ORD-/, "") },
        { payments: { some: { transactionId: orderId } } },
      ],
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payments: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!order) {
    redirect("/dashboard/orders");
  }

  // Active validation if order is not marked PAID yet
  if (order.paymentStatus !== "PAID") {
    try {
      const queryRes = await queryBladePayOrder(order.id);
      if (queryRes.success && queryRes.isPaid) {
        // Instant verification & fulfillment
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            orderStatus: "PROCESSING",
          },
        });

        const bladePayment = order.payments.find((p) => p.method === "UPI" || p.mode === "BLADEPAY");
        if (bladePayment) {
          await prisma.payment.update({
            where: { id: bladePayment.id },
            data: {
              status: "PAID",
              transactionId: queryRes.utr || queryRes.gatewayOrderNo || bladePayment.transactionId,
              verifiedAt: new Date(),
            },
          });
        }

        try {
          await fulfillOrder(order.id);
          await processReferralCommission(order.id);
          await trackPurchaseCompleted(order.id, order.userId);
        } catch (e) {
          console.error("[PaymentSuccess] Auto-fulfillment error:", e);
        }

        // Reload updated order
        order = await prisma.order.findUnique({
          where: { id: order.id },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            payments: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });
      }
    } catch (err) {
      console.error("[PaymentSuccess] Direct verification query error:", err);
    }
  }

  const latestPayment = order?.payments?.[order.payments.length - 1];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <PaymentSuccessClient
        order={order}
        initialPayment={latestPayment}
        isGuest={!session?.user}
      />
    </div>
  );
}
