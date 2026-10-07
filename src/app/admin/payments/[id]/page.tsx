import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PaymentReviewClient from "./PaymentReviewClient";

export const dynamic = "force-dynamic";

export default async function PaymentReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const payment = await prisma.payment.findUnique({
    where: { id: resolvedParams.id },
    include: {
      order: {
        include: {
          user: true,
          items: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!payment) return notFound();

  // Get method config to display expected address/destination
  const methodConfig = await prisma.paymentMethodConfig.findUnique({
    where: { code: payment.method }
  });
  
  const settings = methodConfig?.settings ? JSON.parse(methodConfig.settings) : {};

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Review Payment</h1>
        <p className="text-slate-500 mt-1">Manual payment verification for Order #{payment.orderId.slice(0,8).toUpperCase()}</p>
      </div>

      <PaymentReviewClient payment={payment} settings={settings} />
    </div>
  );
}
