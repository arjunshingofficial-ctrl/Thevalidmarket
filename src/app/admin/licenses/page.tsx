import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Key } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminLicenses({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin("Licenses", "View");

  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const limit = 50;
  const skip = (page - 1) * limit;

  const licenseKeys = await prisma.licenseKey.findMany({
    include: {
      product: true,
      assignedTo: true
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });
  const totalKeys = await prisma.licenseKey.count();

  const totalPages = Math.ceil(totalKeys / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">License Keys</h1>
          <p className="text-slate-500 mt-1">Manage the pool of software licenses.</p>
        </div>
        <Link href="/admin/licenses/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Generate / Import
        </Link>
      </div>

      <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Key (Masked)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {licenseKeys.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Key className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-900">No license keys found</p>
                  </td>
                </tr>
              ) : (
                licenseKeys.map(lk => (
                  <tr key={lk.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{lk.product.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                      {lk.licenseKey.replace(/.(?=.{4})/g, "•")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        lk.status === "AVAILABLE" ? "bg-blue-50 text-blue-700" :
                        lk.status === "ASSIGNED" || lk.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {lk.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {lk.assignedTo ? lk.assignedTo.email : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t flex justify-between items-center bg-slate-50">
          <span className="text-sm text-slate-500">Showing {licenseKeys.length} keys (Page {page} of {totalPages || 1})</span>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link href={`/admin/licenses?page=${page - 1}`} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50">
                Previous
              </Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Previous</button>
            )}
            
            {hasNext ? (
              <Link href={`/admin/licenses?page=${page + 1}`} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50">
                Next
              </Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
