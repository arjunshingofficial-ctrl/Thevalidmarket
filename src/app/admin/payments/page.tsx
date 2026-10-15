import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreditCard, Search } from "lucide-react";
import ClientDateTime from "@/components/common/ClientDateTime";

export const dynamic = "force-dynamic";

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const payments = await prisma.payment.findMany({
    where: q ? {
      OR: [
        { transactionId: { contains: q } },
        { order: { user: { email: { contains: q } } } }
      ]
    } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      order: {
        include: { user: true }
      }
    }
  });

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    PAID: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-red-100 text-red-700",
    EXPIRED: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-red-50 text-red-600",
    REFUNDED: "bg-violet-100 text-violet-700",
    PROCESSING: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">Track all payment transactions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <form className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by transaction ID or email..."
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Payment ID</th>
                <th className="px-6 py-3 font-semibold">Order</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Gateway</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CreditCard className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-900">No payments found</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {payment.id.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/admin/orders/${payment.orderId}`} className="text-primary hover:underline">
                        #{payment.orderId.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{payment.order.user.name || "Customer"}</div>
                      <div className="text-xs text-slate-400">{payment.order.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      ${payment.baseAmount ? payment.baseAmount.toLocaleString() : payment.amount.toLocaleString()} USD
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status] || "bg-slate-100 text-slate-600"}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      <ClientDateTime date={payment.createdAt} format="compact" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
          <span className="text-sm text-slate-500">Showing {payments.length} payments</span>
        </div>
      </div>
    </div>
  );
}
