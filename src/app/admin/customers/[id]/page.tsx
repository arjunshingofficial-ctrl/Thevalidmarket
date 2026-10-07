import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShoppingBag, Download, Key, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      orders: { include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
      licenses: { include: { product: true }, take: 10 },
      downloads: { include: { file: { include: { product: true } } }, take: 10 },
    }
  });

  if (!customer) notFound();

  const totalSpent = customer.orders
    .filter(o => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customer Detail</h1>
        <p className="text-slate-500 mt-1">Full account overview for {customer.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: customer.orders.length, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Downloads", value: customer.downloads.length, icon: Download, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Licenses", value: customer.licenses.length, icon: Key, color: "text-orange-600", bg: "bg-orange-100" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${s.bg} ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Profile</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="font-medium">{customer.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Role</p>
              <p className="font-medium">{customer.role?.name || "CUSTOMER"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                customer.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {customer.emailVerified ? "Active" : "Unverified"}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">Joined</p>
              <p className="font-medium">{customer.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Admin Actions</p>
            <p className="text-xs text-amber-600">⚠ Actions are permission-controlled and audit-logged.</p>
          </div>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b font-semibold text-slate-900">Recent Orders</div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b text-xs">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Order ID</th>
                <th className="px-4 py-2 text-left font-medium">Date</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customer.orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-slate-500">{order.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>{order.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">${order.total}</td>
                </tr>
              ))}
              {customer.orders.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400 text-xs">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
