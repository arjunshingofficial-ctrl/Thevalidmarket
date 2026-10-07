import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { RotateCcw, AlertTriangle, CheckCircle2, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRefunds() {
  const refundOrders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ["REFUNDED", "FAILED"] }
    },
    take: 20,
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Refunds & Dispute Management</h1>
          <p className="text-slate-500 mt-1">Review refund requests, payment chargebacks, and return ledgers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-sm">Pending Review</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">0 Requests</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Processed Refunds</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{refundOrders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <RotateCcw className="w-5 h-5" />
            <span className="font-semibold text-sm">Dispute Rate</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">0.02%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Refund History</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {refundOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No refunded orders on record.</div>
          ) : (
            refundOrders.map((order) => (
              <div key={order.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <p className="font-semibold text-slate-900">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">{order.user.name || order.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-600">৳ {order.total.toLocaleString()}</p>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 rounded-full">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
