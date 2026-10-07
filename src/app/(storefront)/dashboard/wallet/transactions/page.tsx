import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatUsd } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function WalletTransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const transactions = await prisma.walletTransaction.findMany({
    where: { wallet: { userId: session.user.id } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Wallet Transactions</h1>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Cash</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Bonus</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-700">
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-medium">
                      {tx.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tx.cashAmount !== 0 ? (
                        <span className={`font-semibold ${tx.cashAmount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.cashAmount > 0 ? '+' : ''}{formatUsd(tx.cashAmount)}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tx.bonusAmount !== 0 ? (
                        <span className={`font-semibold ${tx.bonusAmount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.bonusAmount > 0 ? '+' : ''}{formatUsd(tx.bonusAmount)}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                      {tx.referenceId ? tx.referenceId.slice(0,8).toUpperCase() : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
