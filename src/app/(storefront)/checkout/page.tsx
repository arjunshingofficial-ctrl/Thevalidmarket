import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";
import { redirect } from "next/navigation";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout | The Valid Market",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  // Load configured payment methods
  const paymentMethods = await prisma.paymentMethodConfig.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" }
  });

  // Get current FX rates (with 20% UPI tax silently included)
  const { getUpiEffectiveInrRate, getUsdToBtcRate } = await import("@/lib/fx");
  const inrRate = await getUpiEffectiveInrRate();
  const btcRate = await getUsdToBtcRate();

  const fxRates = {
    INR: inrRate,
    UPI: inrRate,
    SILKPAY: inrRate,
    BLADEPAY: inrRate,
    BTC: btcRate,
    USDT: 1 // usually 1:1 with USD
  };

  const { getWalletBalance } = await import("@/lib/wallet");
  const walletBalance = await getWalletBalance(session.user.id);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Checkout</h1>
          <p className="text-slate-500 mt-1">Complete your purchase securely.</p>
        </div>

        <CheckoutFlow user={session.user} paymentMethods={paymentMethods} fxRates={fxRates} walletBalance={walletBalance} />
      </div>
    </div>
  );
}
