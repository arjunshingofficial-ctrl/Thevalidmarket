import { prisma } from "@/lib/prisma";
import { Download, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDownloads({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  const downloads = await prisma.download.findMany({
    where: q ? {
      OR: [
        { user: { email: { contains: q } } },
        { file: { originalName: { contains: q } } }
      ]
    } : undefined,
    include: {
      user: true,
      file: { include: { product: true } },
      order: true,
    },
    orderBy: { lastDownload: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Downloads</h1>
        <p className="text-slate-500 mt-1">Track customer file download activity.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <form className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="search" name="q" defaultValue={q} placeholder="Search by customer or file..."
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Product / File</th>
                <th className="px-6 py-3 font-semibold">Order</th>
                <th className="px-6 py-3 font-semibold text-center">Downloads</th>
                <th className="px-6 py-3 font-semibold">Last Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {downloads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Download className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-900">No downloads recorded</p>
                  </td>
                </tr>
              ) : (
                downloads.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{d.user.name || "Customer"}</div>
                      <div className="text-xs text-slate-400">{d.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{d.file.product.name}</div>
                      <div className="text-xs text-slate-400">{d.file.originalName}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      #{d.orderId.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{d.downloadCount}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {d.lastDownload ? new Date(d.lastDownload).toLocaleString() : "Never"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t bg-slate-50">
          <span className="text-sm text-slate-500">Showing {downloads.length} download records</span>
        </div>
      </div>
    </div>
  );
}
