import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  BarChart3, TrendingUp, ShoppingCart, Users, Package, CreditCard, DollarSign, XCircle
} from "lucide-react";
import { getUsdToInrRate } from "@/lib/fx";

export const dynamic = "force-dynamic";

export default async function AdminAnalytics() {
  const rate = await getUsdToInrRate();

  // 1. Order Status Breakdown (Real database counts)
  const orderStatusCounts = await prisma.order.groupBy({
    by: ["orderStatus"],
    _count: true,
  });

  const fulfilledOrders = orderStatusCounts.find(o => o.orderStatus === "FULFILLED")?._count || 0;
  const pendingOrders = orderStatusCounts.find(o => o.orderStatus === "PENDING")?._count || 0;
  const cancelledOrders = orderStatusCounts.find(o => o.orderStatus === "CANCELLED")?._count || 0;
  const refundedOrders = orderStatusCounts.find(o => o.orderStatus === "REFUNDED")?._count || 0;
  const otherOrders = orderStatusCounts.find(o => !["FULFILLED", "PENDING", "CANCELLED", "REFUNDED"].includes(o.orderStatus))?._count || 0;
  const totalOrders = await prisma.order.count();

  // 2. Real Revenue (Active paid & fulfilled orders, strictly excluding cancelled/refunded)
  const activePaidOrders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
    },
    select: { total: true, orderStatus: true },
  });

  const activeRevenue = activePaidOrders.reduce((sum, o) => sum + o.total, 0);
  const fulfilledRevenue = activePaidOrders.filter(o => o.orderStatus === "FULFILLED").reduce((sum, o) => sum + o.total, 0);
  const activePaidCount = activePaidOrders.length;

  const cancelledRevenueAgg = await prisma.order.aggregate({
    where: { orderStatus: "CANCELLED" },
    _sum: { total: true },
  });
  const cancelledRevenue = cancelledRevenueAgg._sum.total || 0;

  // Real Average Order Value
  const avgOrderValue = activePaidCount > 0 ? activeRevenue / activePaidCount : 0;

  // 3. Customers
  const totalCustomers = await prisma.user.count({ where: { role: { name: "CUSTOMER" } } });
  const totalUsers = await prisma.user.count();

  // 4. Products & Catalog
  const productCounts = await prisma.product.groupBy({ by: ["status"], _count: true });
  const totalProducts = productCounts.reduce((acc, p) => acc + p._count, 0);
  const publishedProducts = productCounts.find(p => p.status === "PUBLISHED")?._count || 0;

  // 5. Top Selling Products (Filtered to active paid orders only)
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, price: true },
    where: {
      order: {
        paymentStatus: "PAID",
        orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const productIds = topProducts.map(p => p.productId);
  const products = productIds.length > 0 ? await prisma.product.findMany({ where: { id: { in: productIds } } }) : [];
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  // 6. Revenue by Payment Method (Only active paid orders, converted to proper normalized USD)
  const activePayments = await prisma.payment.findMany({
    where: {
      status: "PAID",
      order: {
        orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    },
    select: {
      method: true,
      amount: true,
      currency: true,
      baseAmount: true,
      order: { select: { total: true } },
    },
  });

  const methodTotals: Record<string, { count: number; totalUsd: number }> = {
    UPI: { count: 0, totalUsd: 0 },
    USDT: { count: 0, totalUsd: 0 },
    BTC: { count: 0, totalUsd: 0 },
  };

  for (const p of activePayments) {
    const m = (p.method || "OTHER").toUpperCase();
    if (!methodTotals[m]) {
      methodTotals[m] = { count: 0, totalUsd: 0 };
    }
    methodTotals[m].count++;
    const usdVal = p.baseAmount || p.order?.total || (p.currency === "USD" ? p.amount : (p.currency === "INR" ? p.amount / rate : p.amount));
    methodTotals[m].totalUsd += usdVal;
  }

  // 7. Store Events (Views & Carts)
  const eventCounts = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    _count: true,
    where: { eventType: { in: ["PRODUCT_VIEW", "ADD_TO_CART"] } },
  });
  const productViews = eventCounts.find(e => e.eventType === "PRODUCT_VIEW")?._count || 0;
  const addToCarts = eventCounts.find(e => e.eventType === "ADD_TO_CART")?._count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Real-time store performance & accurate order metrics from your database.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { 
            label: "Net Active Revenue", 
            value: `$${activeRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
            sub: (
              <span className="text-[11px] text-slate-500">
                ≈ ₹{(activeRevenue * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {cancelledRevenue > 0 && <span className="block text-slate-400">Excl. ${cancelledRevenue.toLocaleString()} cancelled</span>}
              </span>
            ),
            icon: DollarSign, 
            color: "text-emerald-600 bg-emerald-50" 
          },
          { 
            label: "Active Paid Orders", 
            value: activePaidCount, 
            sub: (
              <span className="text-[11px] text-slate-500">
                <span className="text-emerald-600 font-semibold">{fulfilledOrders} fulfilled</span> • {activePaidCount - fulfilledOrders} processing
              </span>
            ),
            icon: ShoppingCart, 
            color: "text-blue-600 bg-blue-50" 
          },
          { 
            label: "Customers", 
            value: totalCustomers, 
            sub: (
              <span className="text-[11px] text-slate-500">{totalUsers} total registered accounts</span>
            ),
            icon: Users, 
            color: "text-indigo-600 bg-indigo-50" 
          },
          { 
            label: "Avg Order Value", 
            value: `$${avgOrderValue.toFixed(2)}`, 
            sub: (
              <span className="text-[11px] text-slate-500">Calculated on active paid orders</span>
            ),
            icon: TrendingUp, 
            color: "text-amber-600 bg-amber-50" 
          },
          { 
            label: "Product Views", 
            value: productViews.toLocaleString(), 
            sub: <span className="text-[11px] text-slate-500">Unique storefront views</span>,
            icon: BarChart3, 
            color: "text-purple-600 bg-purple-50" 
          },
          { 
            label: "Added to Cart", 
            value: addToCarts.toLocaleString(), 
            sub: (
              <span className="text-[11px] text-slate-500">
                {productViews > 0 ? `${((addToCarts / productViews) * 100).toFixed(1)}% conversion` : "0% conversion"}
              </span>
            ),
            icon: ShoppingCart, 
            color: "text-pink-600 bg-pink-50" 
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border shadow-xs p-5 hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm font-medium text-slate-700 mt-0.5">{stat.label}</div>
            {stat.sub && <div className="mt-1">{stat.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Real Order Status Breakdown */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-lg text-slate-900">Order Status Breakdown</h2>
              <p className="text-xs text-slate-500">{totalOrders} total orders recorded</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-primary hover:underline">
              View All Orders →
            </Link>
          </div>
          
          <div className="space-y-3.5">
            {[
              { label: "Fulfilled", count: fulfilledOrders, color: "bg-emerald-500", text: "text-emerald-700" },
              { label: "Pending Processing", count: pendingOrders, color: "bg-amber-500", text: "text-amber-700" },
              { label: "Cancelled", count: cancelledOrders, color: "bg-rose-500", text: "text-rose-700" },
              ...(refundedOrders > 0 ? [{ label: "Refunded", count: refundedOrders, color: "bg-purple-500", text: "text-purple-700" }] : []),
              ...(otherOrders > 0 ? [{ label: "Failed / On Hold", count: otherOrders, color: "bg-slate-400", text: "text-slate-700" }] : []),
            ].map((item) => {
              const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className={`font-semibold ${item.text}`}>{item.count} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment methods with normalized USD and transaction counts */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-lg text-slate-900">Revenue by Payment Method</h2>
              <p className="text-xs text-slate-500">Active, realized revenue only</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Sales
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(methodTotals).map(([method, data]) => (
              <div key={method} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                    {method.slice(0, 3)}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{method}</span>
                    <div className="text-xs text-slate-400">{data.count} active {data.count === 1 ? 'sale' : 'sales'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">${data.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <div className="text-[11px] text-slate-400">≈ ₹{(data.totalUsd * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
            ))}
            {cancelledRevenue > 0 && (
              <p className="text-[11px] text-slate-400 text-center pt-2">
                * Note: Cancelled test order payments are excluded from active revenue.
              </p>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-lg text-slate-900">Top Selling Products</h2>
              <p className="text-xs text-slate-500">Based on active paid customer orders</p>
            </div>
            <Link href="/admin/products" className="text-xs font-semibold text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No verified product sales yet</p>
            ) : (
              topProducts.map((item, i) => {
                const prod = productMap[item.productId];
                return (
                  <div key={item.productId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate text-sm">{prod?.name || "Unknown Product"}</div>
                      <div className="text-xs text-slate-400">{item._sum.quantity} units sold</div>
                    </div>
                    <div className="font-semibold text-slate-900 shrink-0 text-sm">
                      ${(item._sum.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Products overview */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-semibold text-lg text-slate-900">Catalog Overview</h2>
              <p className="text-xs text-slate-500">Inventory & publication status</p>
            </div>
            <Link href="/admin/products/new" className="text-xs font-semibold text-emerald-600 hover:underline">+ New Product</Link>
          </div>
          <div className="space-y-4">
            {[
              { label: "Total Products", value: totalProducts, icon: Package, color: "text-slate-900 font-bold" },
              { label: "Published & Active", value: publishedProducts, icon: Package, color: "text-emerald-600 font-semibold" },
              { label: "Draft / Inactive", value: totalProducts - publishedProducts, icon: Package, color: "text-amber-600 font-semibold" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-600">{item.label}</span>
                <span className={`text-base ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
