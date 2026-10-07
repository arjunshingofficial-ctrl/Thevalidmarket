import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PaymentClient from "./PaymentClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function PaymentPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) {
    redirect("/login?callbackUrl=" + encodeURIComponent(`/payment/${resolvedParams.paymentId}`));
  }

  const payment = await prisma.payment.findUnique({
    where: { id: resolvedParams.paymentId },
    include: {
      order: {
        include: {
          items: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!payment) return notFound();

  // Enforce customer isolation
  if (payment.order.userId !== session.user.id) {
    return notFound();
  }

  // Fetch the method config to get the settings (VPA, addresses, etc)
  const methodConfig = await prisma.paymentMethodConfig.findUnique({
    where: { code: payment.method }
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountId: true }
  });

  // Prefer snapshotted settings if available, else fallback to current method config
  let settings = {};
  if (payment.metadata) {
    try { settings = JSON.parse(payment.metadata); } catch(e) {}
  } else if (methodConfig?.settings) {
    try { settings = JSON.parse(methodConfig.settings); } catch (e) {}
  }

  // Auto-expire server side if needed
  if (payment.status === "PAYMENT_REQUIRED" && payment.expiresAt && new Date() > payment.expiresAt) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "EXPIRED" }
    });
    payment.status = "EXPIRED";
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <PaymentClient 
          payment={payment} 
          order={payment.order}
          methodConfig={methodConfig}
          settings={settings}
          accountId={currentUser?.accountId}
        />
      </div>
    </div>
  );
}
