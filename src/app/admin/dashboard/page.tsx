import { prisma } from "@/lib/prisma";
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import DashboardFilters from "./DashboardFilters";
import RevenueChart from "@/components/admin/RevenueChart";
import { getUsdToInrRate } from "@/lib/fx";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const currentRange = range || "30d";

  // Real database analytics
  const t0 = performance.now();
  const totalOrders = await prisma.order.count();
  const totalCustomers = await prisma.user.count({ where: { role: { name: "CUSTOMER" } } });
  const totalProducts = await prisma.product.count();
  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  // Calculate total revenue from paid orders
  const totalRevenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: "PAID" }
  });
  const t1 = performance.now();
  console.log(`[Perf] /admin/dashboard all sequential queries took ${(t1 - t0).toFixed(2)}ms`);

  const revenue = totalRevenue._sum.total || 0;
  const rate = await getUsdToInrRate();
  const revenueInr = revenue * rate;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your store's performance.</p>
        </div>
        <DashboardFilters currentRange={currentRange} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "Add Product", href: "/admin/products/new", color: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100" },
          { label: "Write Post", href: "/admin/blog/new", color: "bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100" },
          { label: "Add Category", href: "/admin/categories/new", color: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
          { label: "View Orders", href: "/admin/orders", color: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100" },
          { label: "Payments", href: "/admin/settings/payments", color: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100" },
          { label: "Homepage", href: "/admin/settings/homepage", color: "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100" },
          { label: "Add Page", href: "/admin/pages/new", color: "bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100" },
          { label: "Add Coupon", href: "/admin/coupons/new", color: "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100" },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center justify-center text-center px-2 py-3 rounded-lg border text-xs font-semibold transition-colors ${action.color}`}
          >
            {action.label}
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Total Revenue", 
            value: (
              <div className="flex flex-col">
                <span>${revenue.toLocaleString()}</span>
                <span className="text-sm font-normal text-slate-500 mt-1">≈ ₹{revenueInr.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            ), 
            icon: DollarSign, 
            color: "text-emerald-600", 
            bg: "bg-emerald-100" 
          },
          { label: "Orders", value: totalOrders, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Customers", value: totalCustomers, icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Products", value: totalProducts, icon: Package, color: "text-orange-600", bg: "bg-orange-100" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border shadow-sm p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center text-emerald-600 text-sm font-medium">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12%
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl border shadow-sm flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-semibold text-lg text-slate-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No recent orders found.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-slate-600">{order.user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                          order.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        ${order.total.toLocaleString()}
                        <div className="text-xs font-normal text-slate-500">≈ ₹{(order.total * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products / Charts */}
        <div className="bg-white rounded-xl border shadow-sm flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="font-semibold text-lg text-slate-900">Revenue</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center items-center">
            <RevenueChart range={currentRange} />
          </div>
        </div>
      </div>
    </div>
  );
}
