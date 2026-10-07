import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock, XCircle, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PaymentReviewPage() {
  const pendingOrderPayments = await prisma.payment.findMany({
    where: { 
      status: "PAYMENT_REVIEW",
      mode: "MANUAL" 
    },
    include: {
      order: {
        include: { user: true }
      }
    },
    orderBy: { submittedAt: 'asc' }
  });

  const pendingWalletDeposits = await prisma.walletDeposit.findMany({
    where: {
      status: "PAYMENT_REVIEW"
    },
    include: {
      wallet: {
        include: { user: true }
      }
    },
    orderBy: { submittedAt: 'asc' }
  });

  // Combine and sort
  const combinedItems = [
    ...pendingOrderPayments.map(p => ({
      id: p.id,
      type: "ORDER" as const,
      referenceId: p.order.id,
      user: p.order.user,
      method: p.method,
      amount: p.baseAmount || p.amount,
      submittedAt: p.submittedAt,
      url: `/admin/payments/${p.id}`
    })),
    ...pendingWalletDeposits.map(d => ({
      id: d.id,
      type: "WALLET_DEPOSIT" as const,
      referenceId: d.id,
      user: d.wallet.user,
      method: d.paymentMethod,
      amount: d.amountUsd,
      submittedAt: d.submittedAt,
      url: `/admin/wallets/deposits/${d.id}`
    }))
  ].sort((a, b) => {
    const timeA = a.submittedAt ? a.submittedAt.getTime() : 0;
    const timeB = b.submittedAt ? b.submittedAt.getTime() : 0;
    return timeA - timeB;
  });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "PAYMENT_REVIEW": return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "PAID": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "REJECTED": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Reviews</h1>
          <p className="text-slate-500 mt-1">Review and approve manual payments.</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {combinedItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400 mb-4 opacity-50" />
            <p>No manual payments currently pending review.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Type / Ref ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedItems.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {item.type === "ORDER" ? "Order Payment" : "Wallet Deposit"}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">{item.referenceId.slice(0,8).toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{item.user.name || "Customer"}</div>
                    <div className="text-xs text-slate-500">{item.user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {item.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    ${item.amount.toLocaleString()} USD
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={item.url} className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium text-xs transition-colors">
                      <Search className="w-3.5 h-3.5" />
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
