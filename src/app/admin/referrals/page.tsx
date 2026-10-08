import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";
import { DollarSign, Users, Wallet, Activity } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminReferrals() {
  await requireAdmin("Referrals", "View");

  const totalReferrals = await prisma.referral.count();
  const commissions = await prisma.referralCommission.findMany({
    include: { referrer: { select: { id: true, name: true, email: true } }, referred: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  const withdrawals = await prisma.withdrawalRequest.findMany({
    include: { user: { select: { name: true, email: true } } },
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" }
  });

  let totalCommissionsPaid = 0;
  let totalPendingCommissions = 0;

  const allCommissions = await prisma.referralCommission.findMany();
  
  allCommissions.forEach(c => {
    if (c.status === "PAID") {
      totalCommissionsPaid += c.amount * c.rate;
    } else if (c.status === "PENDING" || c.status === "AVAILABLE") {
      totalPendingCommissions += c.amount * c.rate;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Affiliate & Referral System</h1>
        <p className="text-slate-500 mt-1">Manage affiliate codes, referral commissions, and payout ledger.</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-600">Total Referrals</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalReferrals}</p>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-600">Total Unpaid Commissions</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">${totalPendingCommissions.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-slate-600">Total Paid</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">${totalCommissionsPaid.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENDING WITHDRAWALS */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Pending Withdrawals</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">{withdrawals.length}</span>
          </div>
          <div className="divide-y">
            {withdrawals.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No pending requests</div>
            ) : (
              withdrawals.map(w => (
                <div key={w.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{w.user.name || w.user.email}</p>
                    <p className="text-sm text-slate-500">{w.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">${w.amount.toFixed(2)}</p>
                    <Link href={`/admin/referrals/withdrawals/${w.id}`} className="text-sm text-primary hover:underline">
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT COMMISSIONS */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold text-slate-900">Recent Commissions</h3>
          </div>
          <div className="divide-y">
            {commissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No commissions yet</div>
            ) : (
              commissions.map(c => (
                <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-slate-900">{c.referrer.name || c.referrer.email}</p>
                    <p className="text-xs text-slate-500">Referred: {c.referred.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">${(c.amount * c.rate).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{c.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
