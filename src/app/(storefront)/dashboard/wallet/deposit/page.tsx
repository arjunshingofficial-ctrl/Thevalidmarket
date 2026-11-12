import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WalletDepositClient from "./WalletDepositClient";
import { getWalletBalance } from "@/lib/wallet";

export const dynamic = "force-dynamic";

export default async function DepositPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const wallet = await getWalletBalance(session.user.id);
  if (wallet.status === "SUSPENDED") {
    redirect("/dashboard/wallet");
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  const walletConfig = settings?.walletConfig ? JSON.parse(settings.walletConfig) : {
    depositEnabled: true,
    bonusEnabled: true,
    bonusRate: 100,
    minDeposit: 10,
    maxDeposit: 1000,
    maxBonus: 100
  };

  if (!walletConfig.depositEnabled) {
    redirect("/dashboard/wallet");
  }

  const paymentMethods = await prisma.paymentMethodConfig.findMany({
    where: { isEnabled: true },
    orderBy: { sortOrder: "asc" }
  });

  const { getUpiEffectiveInrRate, getUsdToBtcRate } = await import("@/lib/fx");
  const inrRate = await getUpiEffectiveInrRate();
  const btcRate = await getUsdToBtcRate();

  const fxRates = { INR: inrRate, UPI: inrRate, SILKPAY: inrRate, BLADEPAY: inrRate, BTC: btcRate, USDT: 1 };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Add Funds</h1>
      <WalletDepositClient 
        user={session.user} 
        config={walletConfig} 
        paymentMethods={paymentMethods.filter(m => m.code !== "WALLET")} 
        fxRates={fxRates} 
      />
    </div>
  );
}
