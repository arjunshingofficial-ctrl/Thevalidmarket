import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import WalletDepositReviewClient from "./WalletDepositReviewClient";

export const dynamic = "force-dynamic";

export default async function AdminDepositReviewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { role: true }
  });

  if (user?.role?.name !== "ADMIN") redirect("/login");

  const { id } = await params;

  const deposit = await prisma.walletDeposit.findUnique({
    where: { id },
    include: {
      wallet: {
        include: { user: true }
      }
    }
  });

  if (!deposit) notFound();

  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  
  const methodConfig = await prisma.paymentMethodConfig.findUnique({
    where: { code: deposit.paymentMethod }
  });

  let paymentSettings = {};
  if (methodConfig?.settings) {
    try { paymentSettings = JSON.parse(methodConfig.settings); } catch (e) {}
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Review Wallet Deposit</h1>
      </div>

      <WalletDepositReviewClient deposit={deposit} settings={paymentSettings} />
    </div>
  );
}
