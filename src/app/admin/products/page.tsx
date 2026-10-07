import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Plus, Search, Filter, Package
} from "lucide-react";
import ProductRowActions from "./ProductRowActions";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      category: true,
      _count: {
        select: {
          orderItems: true,
          licenses: true,
          subscriptions: true,
          reviews: true,
          entitlements: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Products</h1>
          <p className="text-slate-500 mt-1">Manage your digital products, software, and courses.</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="search" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm bg-white hover:bg-slate-50 text-slate-600 font-medium">
              <Filter className="h-4 w-4" /> Filter
            </button>
            <select className="h-[38px] rounded-md border bg-white px-3 py-2 text-sm text-slate-600 font-medium focus:outline-none">
              <option>Bulk Actions</option>
              <option>Publish</option>
              <option>Unpublish</option>
              <option>Archive</option>
              <option>Delete</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Type</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-lg font-medium text-slate-900">No products found</p>
                    <p>Get started by creating your first product.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-slate-100 hidden sm:flex items-center justify-center shrink-0 border">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="min-w-0 max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px]">
                          <div className="font-medium text-slate-900 truncate" title={product.name}>{product.name}</div>
                          <div className="text-xs text-slate-500 truncate" title={product.sku || product.slug}>{product.sku || product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                      {product.category?.name || "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {product.type}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      ${product.salePrice || product.price}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        product.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 
                        product.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductRowActions product={product} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t flex justify-between items-center bg-slate-50">
          <span className="text-sm text-slate-500">Showing {products.length} products</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Previous</button>
            <button className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
