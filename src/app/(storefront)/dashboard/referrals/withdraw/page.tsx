import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import WithdrawalClient from "@/components/referrals/WithdrawalClient";

export const dynamic = "force-dynamic";

export default async function WithdrawalPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Calculate available balance
  const commissions = await prisma.referralCommission.findMany({
    where: { referrerId: userId }
  });

  const now = new Date();
  let available = 0;

  // Real ledger logic: Available = sum of all available commissions - sum of all withdrawals (pending/approved/processing/paid)
  
  // 1. Sum up all available commissions
  commissions.forEach(c => {
    if (c.status === "AVAILABLE" || (c.status === "PENDING" && c.availableAt && c.availableAt <= now)) {
      available += (c.amount * c.rate);
    }
  });

  // 2. Subtract withdrawals that are not rejected/cancelled
  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { 
      userId,
      status: { notIn: ["REJECTED", "CANCELLED"] }
    }
  });

  withdrawals.forEach(w => {
    available -= w.amount;
  });

  // Fallback to 0 if negative due to rounding
  available = Math.max(0, available);

  return <WithdrawalClient availableAmount={available} />;
}
