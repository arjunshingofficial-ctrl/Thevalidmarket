import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatUsd } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function AdminWalletDepositsPage() {
  const deposits = await prisma.walletDeposit.findMany({
    where: { status: { in: ["PENDING", "PAYMENT_REVIEW", "APPROVED", "REJECTED"] } },
    orderBy: { createdAt: "desc" },
    include: { wallet: { include: { user: true } } },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Wallet Deposits</h1>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">ID / Date</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Customer</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Amount (USD)</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Bonus (USD)</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Method</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 font-semibold text-slate-700 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {deposits.map(deposit => (
              <tr key={deposit.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs">{deposit.id.slice(0, 8).toUpperCase()}</div>
                  <div className="text-xs text-slate-500">{new Date(deposit.createdAt).toLocaleDateString()}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{deposit.wallet.user.name || "N/A"}</div>
                  <div className="text-xs text-slate-500">{deposit.wallet.user.email}</div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{formatUsd(deposit.amountUsd)}</td>
                <td className="px-4 py-3 text-emerald-600 font-medium">{formatUsd(deposit.bonusAmountUsd)}</td>
                <td className="px-4 py-3 text-slate-600">{deposit.paymentMethod}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    deposit.status === 'PAYMENT_REVIEW' ? 'bg-blue-100 text-blue-700' :
                    deposit.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    deposit.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {deposit.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/wallets/deposits/${deposit.id}`} className="text-primary font-medium hover:underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {deposits.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No deposits found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
