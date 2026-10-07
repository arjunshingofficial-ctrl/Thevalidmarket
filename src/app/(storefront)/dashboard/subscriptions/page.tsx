import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RefreshCcw } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: { product: true },
    orderBy: { startsAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Manage your active plans and services.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Service</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Started</th>
              <th className="px-6 py-4 font-semibold">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <RefreshCcw className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900">No active subscriptions</h3>
                  <p className="mt-1">You don't have any recurring services.</p>
                </td>
              </tr>
            ) : (
              subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{sub.product.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      sub.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                      sub.status === "EXPIRED" || sub.status === "CANCELLED" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {new Date(sub.startsAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "Lifetime"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
