import { Eye, Download, Edit3 } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

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
        <p className="text-muted-foreground mt-1">View and manage your purchase history.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
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
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const paymentMethod = order.payments?.[0]?.method || (order.paymentStatus === 'PAID' && order.payments.length === 0 ? 'WALLET' : 'N/A');
                  const actualPaymentStatus = order.payments?.[0]?.status || order.paymentStatus;
                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
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
                          <Link href={`/dashboard/orders/${order.id}`} className="p-2 bg-secondary/10 text-secondary rounded hover:bg-secondary hover:text-secondary-foreground transition-colors" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Link>
                          {order.paymentStatus === 'PAID' && order.entitlements && order.entitlements.filter(e => e.type === 'DOWNLOAD' && e.status === 'ACTIVE').map((ent) => {
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
          {orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No orders found.
            </div>
          ) : (
            orders.map((order) => {
              const paymentMethod = order.payments?.[0]?.method || (order.paymentStatus === 'PAID' && order.payments.length === 0 ? 'WALLET' : 'N/A');
              const actualPaymentStatus = order.payments?.[0]?.status || order.paymentStatus;
              
              return (
                <div key={order.id} className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-base">#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
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
                  
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <span className={`px-2.5 py-1 rounded-full font-medium ${getPaymentStatusColor(actualPaymentStatus)}`}>
                      {formatStatus(actualPaymentStatus)}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full font-medium ${getOrderStatusColor(order.orderStatus)}`}>
                      {formatStatus(order.orderStatus)}
                    </span>
                    <span className="text-muted-foreground font-semibold ml-auto bg-muted/50 px-2 py-1 rounded-md">{paymentMethod}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Link href={`/dashboard/orders/${order.id}`} className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-colors font-semibold text-sm">
                      <Eye className="h-4 w-4" /> View Details
                    </Link>
                    
                    {order.paymentStatus === 'PAID' && order.entitlements && order.entitlements.filter(e => e.type === 'DOWNLOAD' && e.status === 'ACTIVE').map((ent) => {
                      const meta = ent.metadata ? JSON.parse(ent.metadata) : {};
                      if (!meta.fileId) return null;
                      return (
                        <a 
                          key={ent.id}
                          href={`/api/download/${meta.fileId}`} 
                          download
                          className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors font-semibold text-sm" 
                        >
                          <Download className="h-4 w-4" /> Download
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="p-4 border-t flex justify-between items-center bg-muted/20">
          <span className="text-sm text-muted-foreground">Showing {orders.length} orders</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border rounded-md text-sm bg-background hover:bg-muted" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
