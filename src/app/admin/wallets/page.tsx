import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatUsd } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function AdminWalletsPage() {
  // We can join wallet and user and fetch sum of completed transactions for accurate balances
  // But for listing we could just display raw numbers by calculating it on the fly or fetching all transactions.
  // Since Prisma aggregate per-user is tricky in a single query, we'll fetch wallets with transactions and map.

  const wallets = await prisma.wallet.findMany({
    include: {
      user: true,
      transactions: {
        where: { status: "COMPLETED" }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const walletData = wallets.map(wallet => {
    let cash = 0;
    let bonus = 0;
    for (const tx of wallet.transactions) {
      cash += tx.cashAmount;
      bonus += tx.bonusAmount;
    }
    return { ...wallet, cash, bonus, total: cash + bonus };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Customer Wallets</h1>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-700">Customer</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Total Balance</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Cash</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Bonus</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {walletData.map(wallet => (
              <tr key={wallet.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{wallet.user.name || "N/A"}</div>
                  <div className="text-xs text-slate-500">{wallet.user.email}</div>
                </td>
                <td className="px-4 py-3 font-bold text-slate-900">{formatUsd(wallet.total)}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{formatUsd(wallet.cash)}</td>
                <td className="px-4 py-3 font-medium text-emerald-600">{formatUsd(wallet.bonus)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    wallet.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {wallet.status}
                  </span>
                </td>
              </tr>
            ))}
            {walletData.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No wallets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
