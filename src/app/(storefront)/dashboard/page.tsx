import { ShoppingBag, DownloadCloud, Key, Repeat, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
import { redirect } from "next/navigation";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) {
    redirect("/login");
  }
  
  const t0 = performance.now();
  
  // Combine all simple counts/aggregates into one raw query to avoid pool overhead
  const statsResult: any = await prisma.$queryRaw`
    SELECT 
      (SELECT COALESCE(SUM(total), 0) FROM "Order" WHERE "userId" = ${session.user.id} AND "paymentStatus" = 'PAID') as "totalSpent",
      (SELECT COUNT(*) FROM "License" WHERE "userId" = ${session.user.id} AND "status" = 'ACTIVE') as "activeLicenses",
      (SELECT COUNT(*) FROM "Subscription" WHERE "userId" = ${session.user.id} AND "status" = 'ACTIVE') as "activeSubscriptions",
      (SELECT COUNT(*) FROM "Entitlement" WHERE "userId" = ${session.user.id} AND "type" = 'DOWNLOAD' AND "status" = 'ACTIVE') as "totalDownloads"
  `;

  const totalSpent = Number(statsResult[0]?.totalSpent || 0);
  const activeLicenses = Number(statsResult[0]?.activeLicenses || 0);
  const activeSubscriptions = Number(statsResult[0]?.activeSubscriptions || 0);
  const totalDownloads = Number(statsResult[0]?.totalDownloads || 0);

  const recentOrders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  const recentDownloads = await prisma.entitlement.findMany({
    where: { userId: session.user.id, type: "DOWNLOAD", status: "ACTIVE" },
    include: { product: { include: { files: { where: { isActive: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 3
  });

  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  const t1 = performance.now();
  console.log(`[Perf] /dashboard all sequential queries took ${(t1 - t0).toFixed(2)}ms`);

  let telegramUrl = "https://t.me/asiadmarket";
  if (settings?.footerConfig) {
    try { 
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.telegramUrl) telegramUrl = parsed.telegramUrl;
    } catch(e) {}
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        {telegramUrl && (
          <a 
            href={telegramUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-lg bg-[#0088cc] px-4 py-2 text-sm font-bold text-white shadow hover:bg-[#0077b3] transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.48-.01-1.39-.27-2.07-.49-.84-.28-1.51-.42-1.45-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.66 1.76-.01 2.19-.11z"/></svg>
            Join Telegram
          </a>
        )}
      </div>
      
      {telegramUrl && (
        <a 
          href={telegramUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="sm:hidden flex items-center justify-center gap-2 rounded-lg bg-[#0088cc] px-4 py-3 text-sm font-bold text-white shadow hover:bg-[#0077b3] transition-colors"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.99 1.26-5.61 3.71-.53.36-1.01.54-1.44.53-.48-.01-1.39-.27-2.07-.49-.84-.28-1.51-.42-1.45-.89.03-.25.38-.51 1.07-.78 4.2-1.82 7-3.03 8.4-3.61 4-.1.66 1.76-.01 2.19-.11z"/></svg>
          Join Our Telegram Channel
        </a>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Spent", value: `$${totalSpent.toLocaleString()}`, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Downloads", value: totalDownloads.toString(), icon: DownloadCloud, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Active Licenses", value: activeLicenses.toString(), icon: Key, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Subscriptions", value: activeSubscriptions.toString(), icon: Repeat, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="font-semibold text-lg">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-sm font-medium text-primary hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="p-0">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">No orders yet.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Order ID</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium uppercase">#{order.id.slice(0,8)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                          order.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">${order.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Downloads */}
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="font-semibold text-lg">Recent Downloads</h2>
            <Link href="/dashboard/downloads" className="text-sm font-medium text-primary hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="p-6 space-y-4">
            {recentDownloads.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">No recent downloads.</div>
            ) : (
              recentDownloads.map((ent) => {
                const meta = ent.metadata ? JSON.parse(ent.metadata) : {};
                const file = ent.product.files.find(f => f.id === meta.fileId) || ent.product.files[0];
                return (
                  <div key={ent.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                        <DownloadCloud className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium line-clamp-1">{ent.product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {file ? `v${file.version} • ${formatBytes(file.fileSize)}` : 'File unavailable'}
                        </div>
                      </div>
                    </div>
                    {file ? (
                      <a href={`/api/download/${file.id}`} download className="p-2 bg-primary/10 text-primary rounded hover:bg-primary hover:text-primary-foreground transition-colors shrink-0">
                        <DownloadCloud className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="p-2 bg-amber-50 text-amber-600 rounded border border-amber-200 shrink-0">
                        <Info className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
