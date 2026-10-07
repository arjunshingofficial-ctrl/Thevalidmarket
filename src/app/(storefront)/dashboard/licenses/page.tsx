import { Key, Copy, CheckCircle2, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LicenseKeyDisplay from "@/components/checkout/LicenseKeyDisplay"; // will create this

export const dynamic = "force-dynamic";

export default async function LicensesPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const licenses = await prisma.licenseKey.findMany({
    where: { 
      assignedToId: session.user.id
    },
    include: {
      product: {
        include: {
          files: {
            where: { isActive: true, isLatest: true },
            take: 1
          }
        }
      },
      order: true
    },
    orderBy: { activatedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
        <p className="text-muted-foreground mt-1">Manage your software license keys and activations.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {licenses.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No active licenses</h3>
            <p className="text-muted-foreground mb-4">You don't have any active software licenses.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {licenses.map(license => (
              <div key={license.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{license.product.name}</h3>
                    <p className="text-sm text-slate-500">Order #{license.order?.id?.slice(0,8).toUpperCase()} • Activated {license.activatedAt ? new Date(license.activatedAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      license.status === "ASSIGNED" || license.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      license.status === "EXPIRED" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {license.status}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">License Key</p>
                      <LicenseKeyDisplay licenseKey={license.licenseKey} />
                    </div>
                    <div className="flex gap-6 text-sm flex-wrap">
                      <div>
                        <p className="text-slate-500">Platform</p>
                        <p className="font-medium text-slate-900">
                          {license.product.metadata ? (JSON.parse(license.product.metadata as string).platform || "Universal") : "Universal"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Activations</p>
                        <p className="font-medium text-slate-900">{license.activations} / {license.deviceLimit}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Expires</p>
                        <p className="font-medium text-slate-900">{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : "Lifetime"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {license.product.files?.[0] ? (
                          <a 
                            href={`/api/download/${license.product.files[0].id}`}
                            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors"
                          >
                            <Download className="h-4 w-4" /> Download Now
                          </a>
                        ) : (
                          <span className="text-slate-400 text-sm italic">No download available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
