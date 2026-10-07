import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions) as any;
  if (!session?.user?.id) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: {
        include: { product: true }
      },
      entitlements: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!order || order.userId !== session.user.id) {
    redirect("/dashboard/orders");
  }

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

  const paymentMethod = order.payments?.[0]?.method || (order.paymentStatus === 'PAID' && order.payments?.length === 0 ? 'WALLET' : 'N/A');
  const actualPaymentStatus = order.payments?.[0]?.status || order.paymentStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 border rounded-md hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="font-semibold text-lg">Order Items</h2>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Order Status</th>
                    <th className="px-6 py-4 font-medium">Available Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => {
                    const isDownloadable = item.product.type === "DIGITAL" || item.product.type === "SOFTWARE" || item.product.type === "DIGITAL_DOWNLOAD";
                    let actionElement = <span className="text-muted-foreground text-xs">No Action</span>;

                    if (order.paymentStatus === "PAID") {
                      if (isDownloadable) {
                        const entitlement = order.entitlements.find(e => e.productId === item.productId && e.type === "DOWNLOAD" && e.status === "ACTIVE");
                        const meta = entitlement?.metadata ? JSON.parse(entitlement.metadata) : null;
                        
                        if (entitlement && meta?.fileId) {
                          actionElement = (
                            <a 
                              href={`/api/download/${meta.fileId}`}
                              download
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary hover:text-primary-foreground transition-colors font-medium text-xs"
                              title="Download product"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          );
                        } else {
                          actionElement = <span className="text-muted-foreground text-xs">File unavailable</span>;
                        }
                      } else if (item.product.type === "COURSE") {
                        actionElement = <Link href={`/dashboard/courses/${item.product.id}`} className="text-primary hover:underline text-xs font-medium">Open Course</Link>;
                      } else if (item.product.type === "LICENSE") {
                        actionElement = <Link href={`/dashboard/licenses`} className="text-primary hover:underline text-xs font-medium">View License</Link>;
                      } else if (item.product.type === "SUBSCRIPTION") {
                        actionElement = <Link href={`/dashboard/subscriptions`} className="text-primary hover:underline text-xs font-medium">Manage Subscription</Link>;
                      } else if (item.product.type === "VPN" || item.product.type === "PROXY") {
                        actionElement = <span className="text-primary hover:underline text-xs font-medium cursor-pointer">Manage Access</span>;
                      } else {
                        actionElement = <span className="text-primary hover:underline text-xs font-medium cursor-pointer">View Order</span>;
                      }
                    }

                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">
                          {item.product.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] uppercase font-bold tracking-wider">
                            {item.product.type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">
                          ${item.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.orderStatus)}`}>
                            {formatStatus(order.orderStatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {actionElement}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h2 className="font-semibold text-lg border-b pb-4 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-muted-foreground pb-2 border-b">
                <span>Payment Method</span>
                <span className="font-medium">{paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground pb-2 border-b">
                <span>Payment Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(actualPaymentStatus)}`}>
                  {formatStatus(actualPaymentStatus)}
                </span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground pb-2 border-b">
                <span>Order Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.orderStatus)}`}>
                  {formatStatus(order.orderStatus)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-2">
                <span>Subtotal</span>
                <span>${order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span className="text-red-500">-${order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>${order.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-3 mt-3">
                <span>Total</span>
                <span>${order.total.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t flex flex-col gap-3">
              <Link href={`/dashboard/orders/${order.id}/invoice`} className="flex items-center justify-center gap-2 w-full p-2 bg-secondary/10 text-secondary rounded-md hover:bg-secondary hover:text-secondary-foreground transition-colors text-sm font-medium">
                <Receipt className="h-4 w-4" /> View Invoice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
