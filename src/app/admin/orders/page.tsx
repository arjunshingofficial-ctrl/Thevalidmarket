import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, Filter, Eye } from "lucide-react";
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
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-6 py-3 font-semibold">Order</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Payment Status</th>
                <th className="px-6 py-3 font-semibold">Fulfillment</th>
                <th className="px-6 py-3 font-semibold text-right">Total</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-lg font-medium text-slate-900">No orders found</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium text-slate-900">{order.user.name || "Customer"}</div>
                      <div className="text-xs text-slate-500">{order.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                        order.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.orderStatus === 'FULFILLED' ? 'bg-blue-100 text-blue-700' : 
                        order.orderStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      ${order.total}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/orders/${order.id}`} className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-100" title="View Details">
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
