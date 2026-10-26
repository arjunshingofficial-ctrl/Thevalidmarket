import { Eye, Download, Edit3, ShoppingCart, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientDateTime from "@/components/common/ClientDateTime";

export const dynamic = "force-dynamic";

interface OrdersPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : {};
  const filterStatus = (resolvedSearchParams.status || "all").toLowerCase();

  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true }
      },
      entitlements: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Calculate order stats
  const totalOrdersCount = orders.length;
  const fulfilledCount = orders.filter(o => o.orderStatus === "FULFILLED").length;
  const pendingCount = orders.filter(o => o.orderStatus === "PENDING" || o.paymentStatus === "PENDING").length;
  const failedCount = orders.filter(o => o.orderStatus === "CANCELLED" || o.paymentStatus === "FAILED" || o.paymentStatus === "REJECTED").length;

  // Filter orders according to active tab
  const displayedOrders = orders.filter(order => {
    if (filterStatus === "fulfilled") return order.orderStatus === "FULFILLED";
    if (filterStatus === "pending") return order.orderStatus === "PENDING" || order.paymentStatus === "PENDING";
    if (filterStatus === "failed") return order.orderStatus === "CANCELLED" || order.paymentStatus === "FAILED" || order.paymentStatus === "REJECTED";
    return true;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'PAYMENT_REVIEW': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'FAILED':
      case 'REJECTED': return 'bg-red-100 text-red-700';
      case 'REFUNDED': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'FULFILLED': return 'bg-green-100 text-green-700';
      case 'PROCESSING': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatStatus = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">View and manage your purchase history and order statuses.</p>
      </div>

      {/* KPI Counters: Total, Fulfilled, Pending, Failed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Link
          href="/dashboard/orders"
          className={`rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm ${
            filterStatus === "all" ? "ring-2 ring-primary border-primary" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Orders</span>
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold">{totalOrdersCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">All purchases</p>
        </Link>

        {/* Fulfilled */}
        <Link
          href="/dashboard/orders?status=fulfilled"
          className={`rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm ${
            filterStatus === "fulfilled" ? "ring-2 ring-emerald-500 border-emerald-500" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Fulfilled</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{fulfilledCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Delivered to you</p>
        </Link>

        {/* Pending */}
        <Link
          href="/dashboard/orders?status=pending"
          className={`rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm ${
            filterStatus === "pending" ? "ring-2 ring-amber-500 border-amber-500" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">Pending</span>
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{pendingCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Processing / payment</p>
        </Link>

        {/* Failed / Cancelled */}
        <Link
          href="/dashboard/orders?status=failed"
          className={`rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-sm ${
            filterStatus === "failed" ? "ring-2 ring-rose-500 border-rose-500" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase">Failed</span>
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{failedCount}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Cancelled / failed</p>
        </Link>
      </div>

      {/* Orders Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="border-b bg-muted/40 px-4 pt-3 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Orders", count: totalOrdersCount },
            { id: "fulfilled", label: "Fulfilled", count: fulfilledCount, badgeColor: "bg-emerald-100 text-emerald-700" },
            { id: "pending", label: "Pending", count: pendingCount, badgeColor: "bg-amber-100 text-amber-700" },
            { id: "failed", label: "Failed / Cancelled", count: failedCount, badgeColor: "bg-rose-100 text-rose-700" },
          ].map((tab) => {
            const isActive = filterStatus === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.id === "all" ? "/dashboard/orders" : `/dashboard/orders?status=${tab.id}`}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary text-primary bg-card"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab.badgeColor || "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Order ID</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Method</th>
                <th className="px-6 py-4 font-medium">Payment Status</th>
                <th className="px-6 py-4 font-medium">Order Status</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    <p className="font-semibold text-foreground">No orders found</p>
                    <p className="text-xs mt-1">
                      {filterStatus !== "all" 
                        ? "No orders match this status." 
                        : "You haven't placed any orders yet."}
                    </p>
                    {filterStatus !== "all" && (
                      <Link
                        href="/dashboard/orders"
                        className="inline-block mt-3 px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20"
                      >
                        View All Orders ({totalOrdersCount})
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                displayedOrders.map((order) => {
                  const paymentMethod = order.payments?.[0]?.method || (order.paymentStatus === 'PAID' && order.payments.length === 0 ? 'WALLET' : 'N/A');
                  const actualPaymentStatus = order.payments?.[0]?.status || order.paymentStatus;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <ClientDateTime date={order.createdAt} format="stacked" />
                      </td>
                      <td className="px-6 py-4">
                        {order.items.length === 0 ? (
                          <span className="text-muted-foreground">Unknown</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 min-w-[180px] max-w-[260px]">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-2">
                                <Link
                                  href={`/product/${item.product.slug}`}
                                  className="font-medium text-slate-800 hover:text-primary hover:underline truncate"
                                  title={item.product.name}
                                >
                                  {item.product.name}
                                </Link>
                                {isAdmin && (
                                  <Link
                                    href={`/admin/products/${item.product.id}/edit`}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors shrink-0"
                                    title={`Edit product: ${item.product.name}`}
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                    <span>Edit</span>
                                  </Link>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium">${order.total.toFixed(2)}</td>
                      <td className="px-6 py-4 font-medium">{paymentMethod}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(actualPaymentStatus)}`}>
                          {formatStatus(actualPaymentStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.orderStatus)}`}>
                          {formatStatus(order.orderStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/payment/success?orderId=${order.id}`}
                            className="p-2 bg-muted rounded hover:bg-muted/80 text-muted-foreground transition-colors"
                            title="View Receipt"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {order.entitlements.map((ent) => {
                            const meta = ent.metadata ? JSON.parse(ent.metadata) : {};
                            if (!meta.fileId) return null;
                            const product = order.items.find(i => i.productId === ent.productId)?.product;
                            return (
                              <a 
                                key={ent.id}
                                href={`/api/download/${meta.fileId}`} 
                                download
                                className="p-2 bg-primary/10 text-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors" 
                                title={`Download ${product?.name || 'File'}`}
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden divide-y divide-border">
          {displayedOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="font-semibold text-foreground">No orders found</p>
              <p className="text-xs mt-1">No orders matching this status.</p>
            </div>
          ) : (
            displayedOrders.map((order) => {
              const paymentMethod = order.payments?.[0]?.method || (order.paymentStatus === 'PAID' && order.payments.length === 0 ? 'WALLET' : 'N/A');
              const actualPaymentStatus = order.payments?.[0]?.status || order.paymentStatus;
              
              return (
                <div key={order.id} className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-base">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        <ClientDateTime date={order.createdAt} format="compact" />
                      </div>
                    </div>
                    <div className="text-right font-bold text-lg text-primary">${order.total.toFixed(2)}</div>
                  </div>
                  
                  <div className="text-sm font-medium p-3 bg-muted/30 rounded-lg flex flex-col gap-2">
                    {order.items.length === 0 ? (
                      <span className="text-muted-foreground">Unknown</span>
                    ) : (
                      order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <Link
                            href={`/product/${item.product.slug}`}
                            className="font-medium text-slate-800 hover:text-primary hover:underline truncate"
                          >
                            {item.product.name}
                          </Link>
                          {isAdmin && (
                            <Link
                              href={`/admin/products/${item.product.id}/edit`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 shrink-0"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div>Method: <span className="font-semibold text-foreground">{paymentMethod}</span></div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getPaymentStatusColor(actualPaymentStatus)}`}>
                        {formatStatus(actualPaymentStatus)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getOrderStatusColor(order.orderStatus)}`}>
                        {formatStatus(order.orderStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <Link
                      href={`/payment/success?orderId=${order.id}`}
                      className="px-3 py-1.5 border rounded-md text-xs font-semibold hover:bg-muted flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Receipt
                    </Link>
                    {order.entitlements.map((ent) => {
                      const meta = ent.metadata ? JSON.parse(ent.metadata) : {};
                      if (!meta.fileId) return null;
                      return (
                        <a 
                          key={ent.id}
                          href={`/api/download/${meta.fileId}`} 
                          download
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold flex items-center gap-1.5 shadow"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
