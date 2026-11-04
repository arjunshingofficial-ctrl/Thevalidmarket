import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Search, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  RotateCcw,
  CheckCircle2,
  Eye
} from "lucide-react";

export const dynamic = "force-dynamic";

interface AdminCustomersProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCustomers({ searchParams }: AdminCustomersProps) {
  const resolvedSearchParams = (await Promise.resolve(searchParams)) || {};
  const q = (resolvedSearchParams.q || "").trim();

  // Search filter
  const searchFilter = q ? {
    OR: [
      { email: { contains: q, mode: "insensitive" as const } },
      { name: { contains: q, mode: "insensitive" as const } },
    ]
  } : {};

  const customerRoleCondition = {
    AND: [
      {
        OR: [
          { role: { name: "CUSTOMER" } },
          { roleId: null },
        ],
      },
      {
        email: {
          not: {
            endsWith: "@thevalidmarket.local",
          },
        },
      },
    ],
  };

  // Fetch overview KPI metrics
  const [
    totalCustomersCount,
    customersWithOrdersCount,
    totalCustomerOrdersCount,
    revenueAggregate,
    customers,
  ] = await Promise.all([
    prisma.user.count({ where: customerRoleCondition }),
    prisma.user.count({
      where: {
        ...customerRoleCondition,
        orders: { some: {} },
      },
    }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.user.findMany({
      where: {
        ...customerRoleCondition,
        ...searchFilter,
      },
      include: {
        role: true,
        _count: { select: { orders: true } },
        orders: {
          where: { paymentStatus: "PAID" },
          select: { total: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const totalRevenue = revenueAggregate._sum.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">
            View customer accounts, their order counts, and lifetime purchase value.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards: Total Customers, Customers with Orders, Total Orders, Total Revenue */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Customers</span>
            <span className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalCustomersCount.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-0.5">Registered customer base</p>
          </div>
        </div>

        {/* Customers with Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Active Buyers</span>
            <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600">{customersWithOrdersCount.toLocaleString()}</div>
            <p className="text-xs text-emerald-600/80 mt-0.5 font-medium">Placed at least 1 order</p>
          </div>
        </div>

        {/* Total Orders Placed */}
        <Link 
          href="/admin/orders" 
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 group-hover:underline">Total Orders</span>
            <span className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-blue-600">{totalCustomerOrdersCount.toLocaleString()}</div>
            <p className="text-xs text-blue-600/80 mt-0.5 font-medium flex items-center gap-1">
              <span>View all orders</span>
              <span>→</span>
            </p>
          </div>
        </Link>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer Spend</span>
            <span className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500 mt-0.5">Paid lifetime purchases</p>
          </div>
        </div>
      </div>

      {/* Main Customers Table Container */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <form method="GET" action="/admin/customers" className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search customers by name or email..."
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            />
          </form>

          <div className="flex items-center gap-2">
            {q && (
              <Link
                href="/admin/customers"
                className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs bg-white text-slate-600 hover:bg-slate-50 font-medium"
              >
                <RotateCcw className="h-3 w-3" /> Clear Search
              </Link>
            )}
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong>{customers.length}</strong> of <strong>{totalCustomersCount}</strong> customers
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Orders Placed</th>
                <th className="px-6 py-4 font-semibold text-right">Total Spent</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => {
                const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0);
                const isVerified = customer.emailVerified !== null;
                const orderCount = customer._count.orders;

                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Customer Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link 
                            href={`/admin/customers/${customer.id}`}
                            className="font-medium text-slate-900 hover:text-primary hover:underline block"
                          >
                            {customer.name || "Anonymous Customer"}
                          </Link>
                          <div className="text-xs text-slate-500">{customer.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {isVerified ? "Active" : "Unverified"}
                      </span>
                    </td>

                    {/* Orders Placed Count Badge (Clickable) */}
                    <td className="px-6 py-4 text-center">
                      {orderCount > 0 ? (
                        <Link
                          href={`/admin/orders?userId=${customer.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs"
                          title={`Click to view all ${orderCount} orders placed by ${customer.name || customer.email}`}
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{orderCount} {orderCount === 1 ? 'order' : 'orders'}</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs text-slate-400 bg-slate-50 border border-slate-100">
                          0 orders
                        </span>
                      )}
                    </td>

                    {/* Total Spent */}
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ${totalSpent.toFixed(2)}
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {customer.createdAt.toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {orderCount > 0 && (
                          <Link 
                            href={`/admin/orders?userId=${customer.id}`}
                            className="px-2.5 py-1 text-xs border rounded-md bg-white hover:bg-blue-50 text-blue-700 font-semibold inline-flex items-center gap-1 transition-colors border-blue-200"
                            title="View all orders for this customer"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Orders ({orderCount})</span>
                          </Link>
                        )}
                        <Link 
                          href={`/admin/customers/${customer.id}`}
                          className="px-2.5 py-1 text-xs border rounded-md bg-white hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Users className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="text-base font-semibold text-slate-900">No customers found</p>
                    {q && <p className="text-xs text-slate-500 mt-1">No results matching "{q}"</p>}
                    {q && (
                      <Link 
                        href="/admin/customers"
                        className="inline-block mt-3 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
                      >
                        Clear Search
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-between items-center text-sm text-slate-500">
          <span>Showing <strong>{customers.length}</strong> of <strong>{totalCustomersCount}</strong> customers</span>
          <span className="text-xs text-slate-400">Total {totalCustomerOrdersCount} orders placed across all customers</span>
        </div>
      </div>
    </div>
  );
}
