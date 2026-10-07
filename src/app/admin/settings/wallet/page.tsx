import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import WalletSettingsClient from "./WalletSettingsClient";

export const dynamic = "force-dynamic";

export default async function WalletSettingsPage() {
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { role: true }
  });

  if (user?.role?.name !== "ADMIN") redirect("/login");

  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  
  const walletConfig = settings?.walletConfig ? JSON.parse(settings.walletConfig) : {
    depositEnabled: true,
    bonusEnabled: true,
    bonusRate: 100, // 100%
    minDeposit: 10,
    maxDeposit: 1000,
    maxBonus: 100
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Wallet Settings</h1>
      </div>
      
      <p className="text-slate-500">Configure global settings for customer wallets, deposits, and promotional bonuses.</p>

      <WalletSettingsClient initialConfig={walletConfig} />
    </div>
  );
}
