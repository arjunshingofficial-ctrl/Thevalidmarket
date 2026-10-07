import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Plus, Search, Filter, HardDrive, Download
} from "lucide-react";
import ProductFileRowActions from "./ProductFileRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProductFiles() {
  const files = await prisma.productFile.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      product: true
    }
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Product Files</h1>
          <p className="text-slate-500 mt-1">Manage downloadable files attached to your products.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search files..." 
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm bg-white hover:bg-slate-50 text-slate-600 font-medium">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">File Name</th>
                <th className="px-6 py-3 font-semibold">Product</th>
                <th className="px-6 py-3 font-semibold">Version</th>
                <th className="px-6 py-3 font-semibold">Size</th>
                <th className="px-6 py-3 font-semibold">Uploaded</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <HardDrive className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-lg font-medium text-slate-900">No files found</p>
                    <p>Files are uploaded through the product editor.</p>
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                          <HardDrive className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 max-w-[250px] truncate" title={file.originalName}>
                            {file.originalName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">{file.mimeType || "Unknown type"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {file.product ? (
                        <Link href={`/admin/products/${file.product.id}/edit`} className="hover:text-primary transition-colors">
                          {file.product.name}
                        </Link>
                      ) : (
                        <span className="text-red-400">Orphaned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        v{file.version}
                      </span>
                      {file.isLatest && <span className="ml-2 text-[10px] uppercase text-emerald-600 font-bold tracking-wider">Latest</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {formatBytes(file.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {file.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ProductFileRowActions file={file} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t flex justify-between items-center bg-slate-50">
          <span className="text-sm text-slate-500">Showing {files.length} files</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Previous</button>
            <button className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
