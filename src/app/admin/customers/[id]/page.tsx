import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Download, Key, Shield, ChevronLeft, ExternalLink, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      _count: {
        select: {
          orders: true,
          licenses: true,
          downloads: true,
        },
      },
      orders: {
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      licenses: { include: { product: true }, take: 10 },
      downloads: { include: { file: { include: { product: true } } }, take: 10 },
    },
  });

  if (!customer) notFound();

  // Breakdown of customer orders
  const [pendingOrdersCount, fulfilledOrdersCount, failedOrdersCount, totalSpentAgg] = await Promise.all([
    prisma.order.count({
      where: {
        userId: customer.id,
        OR: [{ orderStatus: "PENDING" }, { paymentStatus: "PENDING" }],
      },
    }),
    prisma.order.count({
      where: {
        userId: customer.id,
        orderStatus: "FULFILLED",
      },
    }),
    prisma.order.count({
      where: {
        userId: customer.id,
        OR: [{ paymentStatus: "FAILED" }, { paymentStatus: "REJECTED" }, { orderStatus: "CANCELLED" }],
      },
    }),
    prisma.order.aggregate({
      where: {
        userId: customer.id,
        paymentStatus: "PAID",
      },
      _sum: { total: true },
    }),
  ]);

  const totalSpent = totalSpentAgg._sum.total || 0;
  const totalOrders = customer._count.orders;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/customers"
          className="p-2 hover:bg-slate-200/60 rounded-md transition-colors text-slate-500"
          title="Back to Customers"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customer Detail</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Full account overview, order activity, and assets for <strong>{customer.email}</strong>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: totalOrders.toLocaleString(), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100", href: `/admin/orders?userId=${customer.id}` },
          { label: "Total Spent", value: `$${totalSpent.toFixed(2)}`, icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Downloads", value: customer._count.downloads.toLocaleString(), icon: Download, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Licenses", value: customer._count.licenses.toLocaleString(), icon: Key, color: "text-orange-600", bg: "bg-orange-100" },
        ].map((s) => {
          const Content = (
            <div className="bg-white rounded-xl border shadow-xs p-5 flex items-center gap-4 transition-all hover:shadow-sm">
              <div className={`p-2.5 rounded-lg ${s.bg} ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
              </div>
            </div>
          );

          return s.href ? (
            <Link key={s.label} href={s.href} className="block">
              {Content}
            </Link>
          ) : (
            <div key={s.label}>{Content}</div>
          );
        })}
      </div>

      {/* Orders Summary Badges */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Customer Order Statuses:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Total: {totalOrders}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Fulfilled: {fulfilledOrdersCount}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3" /> Pending: {pendingOrdersCount}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3" /> Failed / Cancelled: {failedOrdersCount}
            </span>
          </div>
        </div>

        <Link
          href={`/admin/orders?userId=${customer.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <span>Open in Order Manager</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
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

        {/* Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
              <span className="font-semibold text-slate-900">Recent Customer Orders</span>
              <Link
                href={`/admin/orders?userId=${customer.id}`}
                className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>View all ({totalOrders})</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b text-xs">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Order ID</th>
                  <th className="px-4 py-2.5 text-left font-medium">Date</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-primary hover:underline">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{order.createdAt.toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        order.paymentStatus === "PAID" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : order.paymentStatus === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">${order.total}</td>
                  </tr>
                ))}
                {customer.orders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No orders placed by this customer yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {customer.orders.length > 0 && (
            <div className="p-3 bg-slate-50 border-t text-right">
              <Link
                href={`/admin/orders?userId=${customer.id}`}
                className="text-xs font-bold text-primary hover:underline"
              >
                Manage all {totalOrders} orders in Orders Panel →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
