import { DownloadCloud, File, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default async function DownloadsPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const entitlements = await prisma.entitlement.findMany({
    where: { 
      userId: session.user.id,
      type: "DOWNLOAD",
      status: "ACTIVE"
    },
    include: {
      product: {
        include: {
          files: {
            where: { isActive: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const downloadRecords = await prisma.download.findMany({
    where: { userId: session.user.id }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
        <p className="text-muted-foreground mt-1">Access your purchased digital files and software.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {entitlements.length === 0 ? (
          <div className="p-12 text-center">
            <DownloadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No downloads available</h3>
            <p className="text-muted-foreground mb-4">You haven't purchased any downloadable products yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {entitlements.map(ent => {
              const meta = ent.metadata ? JSON.parse(ent.metadata) : {};
              const targetFile = ent.product.files.find(f => f.id === meta.fileId) || ent.product.files[0];
              const downloadStats = targetFile ? downloadRecords.find(d => d.productFileId === targetFile.id && d.orderId === ent.orderId) : null;
              
              return (
                <li key={ent.id} className="p-6 flex flex-col sm:flex-row gap-4 items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4 text-left w-full sm:w-auto">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <File className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-900">{ent.product.name}</h4>
                      <div className="text-sm text-slate-500 flex items-center flex-wrap gap-2">
                        <span>Order #{ent.orderId.slice(0,8).toUpperCase()}</span>
                        {targetFile && (
                          <>
                            <span>•</span>
                            <span>v{targetFile.version}</span>
                            <span>•</span>
                            <span>{formatBytes(targetFile.fileSize)}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {downloadStats ? (
                          <>
                            Downloaded {downloadStats.downloadCount} time(s) • Last: {downloadStats.lastDownload ? new Date(downloadStats.lastDownload).toLocaleDateString() : 'Never'}
                          </>
                        ) : (
                          <>Never downloaded</>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2 items-center">
                    {targetFile ? (
                      <a 
                        href={`/api/download/${targetFile.id}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors"
                        download
                      >
                        <DownloadCloud className="h-4 w-4" /> Download File
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md font-medium border border-amber-200">
                        <Info className="w-4 h-4" /> File currently unavailable
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
