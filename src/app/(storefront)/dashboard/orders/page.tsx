import { Eye, Download } from "lucide-react";
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
        <div className="overflow-x-auto">
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
                      <td className="px-6 py-4 max-w-[200px] truncate">
                        {order.items.length > 0 ? order.items[0].product.name : "Unknown"}
                        {order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}
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
