import { prisma } from "@/lib/prisma";
import { RefreshCcw } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptions() {
  await requireAdmin("Subscriptions", "View");

  const subscriptions = await prisma.subscription.findMany({
    include: {
      product: true,
      user: true,
      order: true
    },
    orderBy: { startsAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
        <p className="text-slate-500 mt-1">Manage active recurring and term-based subscriptions.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Product</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <RefreshCcw className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No subscriptions found</p>
                </td>
              </tr>
            ) : (
              subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{sub.user.name || "N/A"}</div>
                    <div className="text-xs text-slate-500">{sub.user.email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{sub.product.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      sub.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                      sub.status === "EXPIRED" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="text-xs">Starts: {sub.startsAt.toLocaleDateString()}</div>
                    <div className="text-xs">Expires: {sub.expiresAt ? sub.expiresAt.toLocaleDateString() : "Lifetime"}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
