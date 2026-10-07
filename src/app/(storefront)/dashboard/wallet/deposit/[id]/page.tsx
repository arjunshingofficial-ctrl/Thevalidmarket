import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import DepositInstructionClient from "./DepositInstructionClient";

export const dynamic = "force-dynamic";

export default async function DepositInstructionPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const deposit = await prisma.walletDeposit.findFirst({
    where: { id, wallet: { userId: session.user.id } }
  });

  if (!deposit) notFound();

  const methodConfig = await prisma.paymentMethodConfig.findUnique({
    where: { code: deposit.paymentMethod }
  });

  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  let paymentSettings = {};
  if (deposit.metadata) {
    try { paymentSettings = JSON.parse(deposit.metadata); } catch(e) {}
  } else if (methodConfig?.settings) {
    try { paymentSettings = JSON.parse(methodConfig.settings); } catch (e) {}
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <DepositInstructionClient deposit={deposit} methodConfig={methodConfig} settings={paymentSettings} />
    </div>
  );
}
