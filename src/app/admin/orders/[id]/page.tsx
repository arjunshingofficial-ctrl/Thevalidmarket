import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { ReconcileButton } from "./ReconcileButton";
import { OrderDownloadsManager } from "./OrderDownloadsManager";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      user: true,
      items: { include: { product: true } },
      entitlements: true
    }
  });

  if (!order) {
    redirect("/admin/orders");
  }

  // Fetch all active product files in the system so the admin can assign any file
  const availableFiles = await prisma.productFile.findMany({
    where: { isActive: true },
    include: { product: true },
    orderBy: [
      { product: { name: "asc" } },
      { createdAt: "desc" }
    ]
  });

  // Collect download entitlements and resolve their files
  const downloadEntitlements = order.entitlements.filter(e => e.type === "DOWNLOAD");
  const fileIds = downloadEntitlements
    .map(e => {
      try { return JSON.parse(e.metadata || "{}")?.fileId; } catch { return null; }
    })
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const referencedFiles = fileIds.length > 0
    ? await prisma.productFile.findMany({
        where: { id: { in: fileIds } },
        include: { product: true }
      })
    : [];

  const downloadStats = await prisma.download.findMany({
    where: { orderId: order.id }
  });

  const formattedAssignedDownloads = downloadEntitlements.map(ent => {
    const meta = ent.metadata ? JSON.parse(ent.metadata) : {};
    const targetFile = referencedFiles.find(f => f.id === meta.fileId);
    const stats = targetFile
      ? downloadStats.find(d => d.productFileId === targetFile.id)
      : null;

    return {
      id: ent.id,
      productId: ent.productId,
      status: ent.status,
      metadata: ent.metadata,
      createdAt: ent.createdAt.toISOString(),
      targetFile: targetFile ? {
        id: targetFile.id,
        originalName: targetFile.originalName,
        fileSize: targetFile.fileSize,
        version: targetFile.version,
        productName: targetFile.product.name
      } : null,
      downloadStats: stats ? {
        downloadCount: stats.downloadCount,
        lastDownload: stats.lastDownload ? stats.lastDownload.toISOString() : null
      } : null
    };
  });

  const formattedAvailableFiles = availableFiles.map(f => ({
    id: f.id,
    filename: f.filename,
    originalName: f.originalName,
    fileSize: f.fileSize,
    version: f.version,
    product: {
      id: f.product.id,
      name: f.product.name,
      type: f.product.type
    }
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 border rounded-md hover:bg-slate-50 transition-colors bg-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-slate-500 mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.paymentStatus === "PAID" && (
             <ReconcileButton orderId={order.id} />
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="font-semibold text-lg text-slate-900">Order Items</h2>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Product</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{item.product.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] uppercase font-bold tracking-wider">
                          {item.product.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">${item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assigned Download Files Manager */}
          <OrderDownloadsManager
            orderId={order.id}
            orderNumber={order.id.slice(0, 8).toUpperCase()}
            customerEmail={order.user.email}
            availableFiles={formattedAvailableFiles}
            initialAssignedDownloads={formattedAssignedDownloads}
          />
          
          {/* All Entitlements Overview */}
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-6 border-b">
              <h2 className="font-semibold text-lg text-slate-900">All Order Entitlements</h2>
            </div>
            <div className="p-6">
              {order.entitlements.length === 0 ? (
                <p className="text-sm text-slate-500">No entitlements found for this order.</p>
              ) : (
                <div className="space-y-4">
                  {order.entitlements.map(ent => (
                    <div key={ent.id} className="flex flex-col gap-1 p-4 border rounded-lg bg-slate-50">
                      <div className="flex justify-between">
                        <span className="font-semibold text-sm">Type: {ent.type}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{ent.status}</span>
                      </div>
                      <span className="text-xs text-slate-500">Product ID: {ent.productId}</span>
                      <span className="text-xs text-slate-400 font-mono break-all">{ent.metadata}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="font-semibold text-lg border-b pb-4 mb-4 text-slate-900">Customer Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-slate-500 text-xs mb-1">Name</div>
                <div className="font-medium text-slate-900">{order.user.name || "N/A"}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-1">Email</div>
                <div className="font-medium text-slate-900">{order.user.email}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="font-semibold text-lg border-b pb-4 mb-4 text-slate-900">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${order.subtotal}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-slate-900 border-t pt-3 mt-3">
                <span>Total</span>
                <span>${order.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
