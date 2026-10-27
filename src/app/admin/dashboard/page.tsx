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
import AdminSectionsHub from "./AdminSectionsHub";
import { getUsdToInrRate } from "@/lib/fx";
import ClientDateTime from "@/components/common/ClientDateTime";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const currentRange = range || "30d";

  const t0 = performance.now();
  
  // Real database analytics query with accurate order status & revenue distinctions
  const statsResult: any = await prisma.$queryRaw`
    SELECT 
      (SELECT COUNT(*) FROM "Order") as "totalOrders",
      (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = 'FULFILLED') as "fulfilledOrders",
      (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = 'PENDING') as "pendingOrders",
      (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = 'CANCELLED') as "cancelledOrders",
      (SELECT COUNT(*) FROM "Order" WHERE "orderStatus" = 'REFUNDED') as "refundedOrders",
      (SELECT COUNT(*) FROM "Order" WHERE "paymentStatus" = 'FAILED') as "failedOrders",
      (SELECT COUNT(*) FROM "User" u JOIN "Role" r ON u."roleId" = r.id WHERE r.name = 'CUSTOMER') as "totalCustomers",
      (SELECT COUNT(*) FROM "User") as "totalUsers",
      (SELECT COUNT(*) FROM "Product") as "totalProducts",
      (SELECT COALESCE(SUM(total), 0) FROM "Order" WHERE "paymentStatus" = 'PAID' AND "orderStatus" NOT IN ('CANCELLED', 'REFUNDED')) as "activeRevenue",
      (SELECT COALESCE(SUM(total), 0) FROM "Order" WHERE "paymentStatus" = 'PAID' AND "orderStatus" = 'FULFILLED') as "fulfilledRevenue",
      (SELECT COALESCE(SUM(total), 0) FROM "Order" WHERE "orderStatus" = 'CANCELLED') as "cancelledRevenue",
      (SELECT COALESCE(SUM(total), 0) FROM "Order" WHERE "paymentStatus" = 'PAID') as "grossRevenue"
  `;

  const totalOrders = Number(statsResult[0]?.totalOrders || 0);
  const fulfilledOrders = Number(statsResult[0]?.fulfilledOrders || 0);
  const pendingOrders = Number(statsResult[0]?.pendingOrders || 0);
  const cancelledOrders = Number(statsResult[0]?.cancelledOrders || 0);
  const refundedOrders = Number(statsResult[0]?.refundedOrders || 0);
  const totalCustomers = Number(statsResult[0]?.totalCustomers || 0);
  const totalUsers = Number(statsResult[0]?.totalUsers || 0);
  const totalProducts = Number(statsResult[0]?.totalProducts || 0);
  const activeRevenue = Number(statsResult[0]?.activeRevenue || 0);
  const fulfilledRevenue = Number(statsResult[0]?.fulfilledRevenue || 0);
  const cancelledRevenue = Number(statsResult[0]?.cancelledRevenue || 0);

  const recentOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { user: true }
  });

  const t1 = performance.now();
  console.log(`[Perf] /admin/dashboard real metrics query took ${(t1 - t0).toFixed(2)}ms`);

  const rate = await getUsdToInrRate();
  const revenueInr = activeRevenue * rate;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your store's live performance & order status.</p>
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
          { label: "Homepage", href: "/admin/appearance/homepage", color: "bg-sky-50 text-sky-700 border-sky-100 hover:bg-sky-100" },
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
            label: "Net Active Revenue", 
            value: (
              <div className="flex flex-col">
                <span>${activeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-sm font-normal text-slate-500 mt-1">≈ ₹{revenueInr.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
            ), 
            sub: (
              <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                <span>
                  <strong className="text-emerald-600 font-semibold">${fulfilledRevenue.toFixed(2)}</strong> fulfilled
                  {activeRevenue > fulfilledRevenue && (
                    <> • <strong className="text-amber-600 font-semibold">${(activeRevenue - fulfilledRevenue).toFixed(2)}</strong> paid pending</>
                  )}
                </span>
                {cancelledRevenue > 0 && (
                  <span className="text-slate-400 text-[11px]">
                    Excludes ${cancelledRevenue.toLocaleString()} in cancelled orders
                  </span>
                )}
              </div>
            ),
            href: "/admin/orders?status=paid",
            icon: DollarSign, 
            color: "text-emerald-600", 
            bg: "bg-emerald-100" 
          },
          { 
            label: "Orders", 
            value: totalOrders, 
            sub: (
              <span className="text-xs text-slate-500 font-medium">
                <span className="text-emerald-600 font-semibold">{fulfilledOrders} fulfilled</span> • <span className="text-amber-600 font-semibold">{pendingOrders} pending</span> • <span className="text-rose-600 font-semibold">{cancelledOrders} cancelled</span>
                {refundedOrders > 0 && (
                  <> • <span className="text-purple-600 font-semibold">{refundedOrders} refunded</span></>
                )}
              </span>
            ),
            href: "/admin/orders",
            icon: ShoppingCart, 
            color: "text-blue-600", 
            bg: "bg-blue-100" 
          },
          { 
            label: "Customers", 
            value: totalCustomers, 
            sub: (
              <span className="text-xs text-slate-500 font-medium">
                {totalUsers} total registered accounts
              </span>
            ),
            href: "/admin/customers",
            icon: Users, 
            color: "text-indigo-600", 
            bg: "bg-indigo-100" 
          },
          { 
            label: "Products", 
            value: totalProducts, 
            href: "/admin/products",
            icon: Package, 
            color: "text-orange-600", 
            bg: "bg-orange-100" 
          },
        ].map((stat, i) => {
          const cardContent = (
            <div className="bg-white rounded-xl border shadow-sm p-6 flex flex-col justify-between h-full hover:shadow-md hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center text-emerald-600 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Live
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-medium text-slate-500">{stat.label}</div>
                <div className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</div>
                {stat.sub && (
                  <div className="mt-2 pt-2 border-t border-slate-100">{stat.sub}</div>
                )}
              </div>
            </div>
          );

          return stat.href ? (
            <Link key={i} href={stat.href} className="block">
              {cardContent}
            </Link>
          ) : (
            <div key={i}>{cardContent}</div>
          );
        })}
      </div>

      {/* Complete Admin Sections & Modules Hub */}
      <AdminSectionsHub />

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
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <Link 
                          href={`/admin/orders/${order.id}`} 
                          className="font-bold text-primary hover:underline"
                          title="View order details"
                        >
                          #{order.id.slice(0, 8).toUpperCase()}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          <ClientDateTime date={order.createdAt} format="time" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-[180px]">
                        {order.user.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            order.orderStatus === 'FULFILLED' ? 'bg-blue-100 text-blue-700' : 
                            order.orderStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                            order.orderStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-700 font-bold' :
                            order.orderStatus === 'REFUNDED' ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {order.orderStatus}
                          </span>
                          <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium border ${
                            order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            order.paymentStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            Payment: {order.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        <div className="font-bold text-slate-900">${order.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
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
            <h2 className="font-semibold text-lg text-slate-900">Revenue (Active Orders)</h2>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center items-center">
            <RevenueChart range={currentRange} />
          </div>
        </div>
      </div>
    </div>
  );
}
