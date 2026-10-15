import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Filter, Eye, Edit3, Package } from "lucide-react";
import OrderActionsDropdown from "@/components/admin/OrderActionsDropdown";

export const dynamic = "force-dynamic";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const limit = 10;
  const skip = (page - 1) * limit;

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, items: { include: { product: true } } },
    skip,
    take: limit,
  });
  const totalOrders = await prisma.order.count();

  const totalPages = Math.ceil(totalOrders / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Orders</h1>
          <p className="text-slate-500 mt-1">Manage and fulfill customer orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search orders by ID or customer..." 
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm bg-white hover:bg-slate-50 text-slate-600 font-medium">
              <Filter className="h-4 w-4" /> Filter
            </button>
            <select className="h-[38px] rounded-md border bg-white px-3 py-2 text-sm text-slate-600 font-medium focus:outline-none">
              <option>Bulk Actions</option>
              <option>Mark as Paid</option>
              <option>Fulfill</option>
              <option>Cancel</option>
            </select>
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
                    <p className="text-xs text-slate-500 mt-1">Orders placed by customers will appear here.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                    </td>
                    
                    {/* Order & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-slate-900 hover:text-primary hover:underline block"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <span className="text-xs text-slate-500">
                        {order.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-[160px]">
                        <div className="font-medium text-slate-900 truncate" title={order.user.name || "Customer"}>
                          {order.user.name || "Customer"}
                        </div>
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
        
        {/* Pagination */}
        <div className="p-4 border-t flex justify-between items-center bg-slate-50">
          <span className="text-sm text-slate-500">Showing {orders.length} orders (Page {page} of {totalPages || 1})</span>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link href={`/admin/orders?page=${page - 1}`} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50">
                Previous
              </Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Previous</button>
            )}
            
            {hasNext ? (
              <Link href={`/admin/orders?page=${page + 1}`} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50">
                Next
              </Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
