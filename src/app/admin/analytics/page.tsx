import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  BarChart3, TrendingUp, ShoppingCart, Users, Package, CreditCard, DollarSign
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAnalytics() {
  const totalRevenue = await prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } });
  
  const orderCounts = await prisma.order.groupBy({ by: ["paymentStatus"], _count: true });
  const paidOrders = orderCounts.find(o => o.paymentStatus === "PAID")?._count || 0;
  const pendingOrders = orderCounts.find(o => o.paymentStatus === "PENDING")?._count || 0;
  const failedOrders = orderCounts.find(o => o.paymentStatus === "FAILED")?._count || 0;

  const totalCustomers = await prisma.user.count({ where: { role: { name: "CUSTOMER" } } });
  
  const productCounts = await prisma.product.groupBy({ by: ["status"], _count: true });
  const totalProducts = productCounts.reduce((acc, p) => acc + p._count, 0);
  const publishedProducts = productCounts.find(p => p.status === "PUBLISHED")?._count || 0;

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true, price: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  });

  const revenueByMethod = await prisma.payment.groupBy({
    by: ["method"],
    _sum: { amount: true },
    _count: true,
    where: { status: "PAID" },
  });

  const eventCounts = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    _count: true,
    where: { eventType: { in: ["PRODUCT_VIEW", "ADD_TO_CART"] } }
  });
  const productViews = eventCounts.find(e => e.eventType === "PRODUCT_VIEW")?._count || 0;
  const addToCarts = eventCounts.find(e => e.eventType === "ADD_TO_CART")?._count || 0;

  // Fetch product names for top products
  const productIds = topProducts.map(p => p.productId);
  const products = productIds.length > 0 ? await prisma.product.findMany({ where: { id: { in: productIds } } }) : [];
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  const revenue = totalRevenue._sum.total || 0;
  const avgOrderValue = paidOrders > 0 ? revenue / paidOrders : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Real-time store performance metrics from your database.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: `$${revenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
          { label: "Paid Orders", value: paidOrders, icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
          { label: "Customers", value: totalCustomers, icon: Users, color: "text-indigo-600 bg-indigo-50" },
          { label: "Avg Order Value", value: `$${avgOrderValue.toFixed(0)}`, icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
          { label: "Product Views", value: productViews, icon: BarChart3, color: "text-purple-600 bg-purple-50" },
          { label: "Added to Cart", value: addToCarts, icon: ShoppingCart, color: "text-pink-600 bg-pink-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border shadow-sm p-5">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Order Status Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "Paid", count: paidOrders, color: "bg-emerald-500" },
              { label: "Pending", count: pendingOrders, color: "bg-amber-500" },
              { label: "Failed", count: failedOrders, color: "bg-red-500" },
            ].map((item) => {
              const total = paidOrders + pendingOrders + failedOrders || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-900">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Revenue by Payment Method</h2>
          <div className="space-y-3">
            {revenueByMethod.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No paid transactions yet</p>
            ) : (
              revenueByMethod.map((m) => (
                <div key={m.method} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-slate-800">{m.method}</span>
                    <span className="ml-2 text-xs text-slate-400">{m._count} transactions</span>
                  </div>
                  <span className="font-semibold text-slate-900">${(m._sum.amount || 0).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg text-slate-900">Top Selling Products</h2>
            <Link href="/admin/products" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No sales data yet</p>
            ) : (
              topProducts.map((item, i) => {
                const prod = productMap[item.productId];
                return (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{prod?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-400">{item._sum.quantity} units sold</div>
                    </div>
                    <div className="font-semibold text-slate-900 shrink-0">
                      ${(item._sum.price || 0).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Products overview */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Catalog Overview</h2>
          <div className="space-y-4">
            {[
              { label: "Total Products", value: totalProducts, icon: Package },
              { label: "Published", value: publishedProducts, icon: Package },
              { label: "Draft", value: totalProducts - publishedProducts, icon: Package },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
