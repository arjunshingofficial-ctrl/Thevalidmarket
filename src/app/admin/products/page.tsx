import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import ProductRowActions from "./ProductRowActions";
import ProductSearchToolbar from "./ProductSearchToolbar";

export const dynamic = "force-dynamic";

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; categoryId?: string }>;
}) {
  const { page, q, status, categoryId } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const limit = 20;
  const query = q?.trim() || "";

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      { shortDesc: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { category: { name: { contains: query, mode: "insensitive" } } },
    ];
  }

  const [totalProducts, products, categories] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (currentPage - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: {
          select: {
            orderItems: true,
            licenses: true,
            subscriptions: true,
            reviews: true,
            entitlements: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  // Helper to build pagination URL preserving search & filters
  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams();
    if (targetPage > 1) p.set("page", targetPage.toString());
    if (query) p.set("q", query);
    if (status) p.set("status", status);
    if (categoryId) p.set("categoryId", categoryId);
    const qs = p.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

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
        {/* Toolbar with live & debounced search, clear button, and category/status filters */}
        <ProductSearchToolbar
          initialQuery={query}
          categories={categories}
          currentCategory={categoryId}
          currentStatus={status}
        />

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
          <span className="text-sm text-slate-500">Showing {products.length} of {totalProducts} products</span>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link href={buildPageUrl(currentPage - 1)} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50">Previous</Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Previous</button>
            )}
            {currentPage < totalPages ? (
              <Link href={buildPageUrl(currentPage + 1)} className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50">Next</Link>
            ) : (
              <button className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm" disabled>Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
