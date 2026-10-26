import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Package, 
  ShoppingCart, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  X,
  User as UserIcon,
  RotateCcw
} from "lucide-react";
import OrderActionsDropdown from "@/components/admin/OrderActionsDropdown";
import ClientDateTime from "@/components/common/ClientDateTime";

export const dynamic = "force-dynamic";

interface AdminOrdersProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    q?: string;
    userId?: string;
  }>;
}

export default async function AdminOrders({ searchParams }: AdminOrdersProps) {
  const resolvedSearchParams = (await Promise.resolve(searchParams)) || {};
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const status = (resolvedSearchParams.status || "all").toLowerCase();
  const q = (resolvedSearchParams.q || "").trim();
  const userId = (resolvedSearchParams.userId || "").trim();
  const limit = 10;
  const skip = (page - 1) * limit;

  // Base scope if filtered by specific user
  const userFilter = userId ? { userId } : {};

  // Build search filter
  let searchFilter: any = {};
  if (q) {
    const cleanQ = q.replace(/^#/, "").trim();
    searchFilter = {
      OR: [
        { id: { contains: cleanQ, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
      ],
    };
  }

  // Fetch count metrics in parallel
  const [
    totalOrdersCount,
    pendingOrdersCount,
    fulfilledOrdersCount,
    failedOrdersCount,
    paidOrdersCount,
    targetUser,
  ] = await Promise.all([
    prisma.order.count({ where: userFilter }),
    prisma.order.count({
      where: {
        ...userFilter,
        OR: [{ orderStatus: "PENDING" }, { paymentStatus: "PENDING" }],
      },
    }),
    prisma.order.count({
      where: {
        ...userFilter,
        orderStatus: "FULFILLED",
      },
    }),
    prisma.order.count({
      where: {
        ...userFilter,
        OR: [
          { paymentStatus: "FAILED" },
          { paymentStatus: "REJECTED" },
          { orderStatus: "CANCELLED" },
        ],
      },
    }),
    prisma.order.count({
      where: {
        ...userFilter,
        paymentStatus: "PAID",
      },
    }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        })
      : null,
  ]);

  // Construct status filter for list query
  let statusWhere: any = {};
  if (status === "pending") {
    statusWhere = {
      OR: [{ orderStatus: "PENDING" }, { paymentStatus: "PENDING" }],
    };
  } else if (status === "fulfilled") {
    statusWhere = {
      orderStatus: "FULFILLED",
    };
  } else if (status === "failed") {
    statusWhere = {
      OR: [
        { paymentStatus: "FAILED" },
        { paymentStatus: "REJECTED" },
        { orderStatus: "CANCELLED" },
      ],
    };
  } else if (status === "paid") {
    statusWhere = {
      paymentStatus: "PAID",
    };
  }

  const listWhere = {
    ...userFilter,
    ...searchFilter,
    ...statusWhere,
  };

  const [orders, filteredOrdersCount] = await Promise.all([
    prisma.order.findMany({
      where: listWhere,
      orderBy: { createdAt: "desc" },
      include: { user: true, items: { include: { product: true } } },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: listWhere }),
  ]);

  const totalPages = Math.ceil(filteredOrdersCount / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  // Helper to build status links
  const buildFilterUrl = (newStatus: string) => {
    const params = new URLSearchParams();
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (q) params.set("q", q);
    if (userId) params.set("userId", userId);
    params.set("page", "1");
    const qs = params.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  // Helper to build pagination links
  const buildPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    if (q) params.set("q", q);
    if (userId) params.set("userId", userId);
    params.set("page", targetPage.toString());
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">
            Real-time order fulfillment, customer purchases, and payment statuses.
          </p>
        </div>
      </div>

      {/* KPI Counters: Total Orders, Pending, Fulfilled, Failed, Paid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Orders */}
        <Link
          href={buildFilterUrl("all")}
          className={`rounded-xl border p-4 bg-white transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${
            status === "all"
              ? "ring-2 ring-primary border-primary bg-primary/[0.03]"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Orders</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalOrdersCount.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">All-time store orders</p>
          </div>
        </Link>

        {/* Pending Orders */}
        <Link
          href={buildFilterUrl("pending")}
          className={`rounded-xl border p-4 bg-white transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${
            status === "pending"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/30"
              : "border-slate-200 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending</span>
            <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600">{pendingOrdersCount.toLocaleString()}</div>
            <p className="text-[11px] text-amber-600/80 mt-0.5 font-medium">Awaiting fulfill / payment</p>
          </div>
        </Link>

        {/* Fulfilled Orders */}
        <Link
          href={buildFilterUrl("fulfilled")}
          className={`rounded-xl border p-4 bg-white transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${
            status === "fulfilled"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20"
              : "border-slate-200 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Fulfilled</span>
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600">{fulfilledOrdersCount.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Delivered to customers</p>
          </div>
        </Link>

        {/* Failed / Cancelled Orders */}
        <Link
          href={buildFilterUrl("failed")}
          className={`rounded-xl border p-4 bg-white transition-all shadow-xs hover:shadow-sm flex flex-col justify-between ${
            status === "failed"
              ? "ring-2 ring-rose-500 border-rose-500 bg-rose-50/20"
              : "border-slate-200 hover:border-rose-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Failed / Cancelled</span>
            <span className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600">{failedOrdersCount.toLocaleString()}</div>
            <p className="text-[11px] text-rose-600/80 mt-0.5 font-medium">Declined or cancelled</p>
          </div>
        </Link>

        {/* Paid Orders */}
        <Link
          href={buildFilterUrl("paid")}
          className={`rounded-xl border p-4 bg-white transition-all shadow-xs hover:shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1 ${
            status === "paid"
              ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20"
              : "border-slate-200 hover:border-indigo-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Paid Orders</span>
            <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-indigo-600">{paidOrdersCount.toLocaleString()}</div>
            <p className="text-[11px] text-indigo-600/80 mt-0.5 font-medium">Settled & confirmed</p>
          </div>
        </Link>
      </div>

      {/* Active User Filter Notification Banner */}
      {targetUser && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-900">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Showing orders for customer: <strong>{targetUser.name || "Customer"}</strong> ({targetUser.email}) — <strong>{totalOrdersCount}</strong> {totalOrdersCount === 1 ? 'order' : 'orders'} found
            </span>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 shadow-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filter
          </Link>
        </div>
      )}

      {/* Orders Container */}
      <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="border-b bg-slate-50/70 px-4 pt-3 flex items-center gap-2 overflow-x-auto">
          {[
            { id: "all", label: "All Orders", count: totalOrdersCount },
            { id: "pending", label: "Pending", count: pendingOrdersCount, badgeColor: "bg-amber-100 text-amber-700" },
            { id: "fulfilled", label: "Fulfilled", count: fulfilledOrdersCount, badgeColor: "bg-emerald-100 text-emerald-700" },
            { id: "failed", label: "Failed / Cancelled", count: failedOrdersCount, badgeColor: "bg-rose-100 text-rose-700" },
            { id: "paid", label: "Paid", count: paidOrdersCount, badgeColor: "bg-indigo-100 text-indigo-700" },
          ].map((tab) => {
            const isActive = status === tab.id;
            return (
              <Link
                key={tab.id}
                href={buildFilterUrl(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary text-primary bg-white shadow-xs"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tab.badgeColor || "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <form method="GET" action="/admin/orders" className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              name="q"
              defaultValue={q}
              placeholder="Search by order ID, customer name, email..." 
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {status !== "all" && <input type="hidden" name="status" value={status} />}
            {userId && <input type="hidden" name="userId" value={userId} />}
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {q && (
              <Link
                href={buildFilterUrl(status)}
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-md text-sm bg-white hover:bg-slate-50 text-slate-600 font-medium"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Search
              </Link>
            )}
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              Found <strong>{filteredOrdersCount}</strong> {filteredOrdersCount === 1 ? 'order' : 'orders'}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                </th>
                <th className="py-3 px-4 font-semibold">Order</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold min-w-[190px]">Products</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Total</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-base font-semibold text-slate-900">No orders found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {q || status !== "all" || userId
                        ? "No orders match the selected filter. Try switching tabs or clearing filters."
                        : "Orders placed by customers will appear here."}
                    </p>
                    {(q || status !== "all" || userId) && (
                      <Link
                        href="/admin/orders"
                        className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                      >
                        View All Orders ({totalOrdersCount})
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                    </td>
                    
                    {/* Order & Date/Timing */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-slate-900 hover:text-primary hover:underline block"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <div className="mt-0.5">
                        <ClientDateTime date={order.createdAt} format="stacked" />
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[170px]">
                        <Link
                          href={`/admin/orders?userId=${order.user.id}`}
                          className="font-medium text-slate-900 truncate hover:text-primary hover:underline block"
                          title={`View all orders for ${order.user.name || order.user.email}`}
                        >
                          {order.user.name || "Customer"}
                        </Link>
                        <div className="text-xs text-slate-500 truncate" title={order.user.email}>
                          {order.user.email}
                        </div>
                      </div>
                    </td>

                    {/* Products & Direct Edit */}
                    <td className="py-3.5 px-4">
                      {order.items.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No products</span>
                      ) : (
                        <div className="flex flex-col gap-1 max-w-[230px]">
                          <div className="flex items-center justify-between gap-1.5 p-1 rounded bg-slate-50 border border-slate-100">
                            <span
                              className="font-medium text-xs text-slate-900 truncate"
                              title={order.items[0].product.name}
                            >
                              {order.items[0].product.name}
                            </span>
                            <Link
                              href={`/admin/products/${order.items[0].product.id}/edit`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 transition-colors"
                              title={`Edit product: ${order.items[0].product.name}`}
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </Link>
                          </div>

                          {order.items.length > 1 && (
                            <details className="group text-xs">
                              <summary className="cursor-pointer text-[11px] font-semibold text-primary hover:text-primary/80 select-none flex items-center gap-1 list-none mt-0.5">
                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">
                                  +{order.items.length - 1} more {order.items.length - 1 === 1 ? 'item' : 'items'}
                                </span>
                                <span className="text-slate-400 text-[10px] group-open:rotate-180 transition-transform">▼</span>
                              </summary>
                              <div className="mt-1 space-y-1 pl-1 border-l-2 border-primary/20 py-1">
                                {order.items.slice(1).map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-1.5 p-1 rounded bg-slate-50 border border-slate-100"
                                  >
                                    <span
                                      className="text-xs text-slate-800 truncate"
                                      title={item.product.name}
                                    >
                                      {item.product.name}
                                    </span>
                                    <Link
                                      href={`/admin/products/${item.product.id}/edit`}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 transition-colors"
                                      title={`Edit product: ${item.product.name}`}
                                    >
                                      <Edit3 className="w-2.5 h-2.5" />
                                      <span>Edit</span>
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                          order.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          order.orderStatus === 'FULFILLED' ? 'bg-blue-100 text-blue-700' : 
                          order.orderStatus === 'PENDING' ? 'bg-slate-100 text-slate-600' : 
                          order.orderStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-slate-900">${order.total}</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/admin/orders/${order.id}`} 
                          className="p-1.5 text-slate-500 hover:text-primary rounded-md hover:bg-slate-100 transition-colors" 
                          title="View Order Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <OrderActionsDropdown 
                          orderId={order.id} 
                          orderStatus={order.orderStatus} 
                          paymentStatus={order.paymentStatus} 
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination & Summary */}
        <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50">
          <div className="text-sm text-slate-500">
            Showing <strong className="text-slate-800">{orders.length}</strong> of <strong className="text-slate-800">{filteredOrdersCount}</strong> {filteredOrdersCount === 1 ? 'order' : 'orders'} 
            {totalPages > 1 && ` (Page ${page} of ${totalPages})`}
          </div>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link href={buildPageUrl(page - 1)} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50 text-slate-700 font-medium">
                Previous
              </Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm text-slate-400" disabled>Previous</button>
            )}
            
            {hasNext ? (
              <Link href={buildPageUrl(page + 1)} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50 text-slate-700 font-medium">
                Next
              </Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm text-slate-400" disabled>Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
