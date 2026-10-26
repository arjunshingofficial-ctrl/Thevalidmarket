import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package, CheckCircle2, Clock, ShoppingCart } from "lucide-react";
import AdminProductsManager from "./AdminProductsManager";

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

  const [
    totalProductsCount,
    publishedCount,
    draftCount,
    archivedCount,
    totalSalesCount,
    totalProducts,
    products,
    categories,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { status: "ARCHIVED" } }),
    prisma.orderItem.count(),
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

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* KPI Counters: Total Products, Published, Draft, Total Sales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Products */}
        <Link
          href="/admin/products"
          className={`bg-white rounded-xl border p-4 shadow-xs transition-all hover:shadow-sm ${
            !status ? "ring-2 ring-primary border-primary bg-primary/[0.02]" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalProductsCount.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">All catalog items</p>
          </div>
        </Link>

        {/* Published Products */}
        <Link
          href="/admin/products?status=PUBLISHED"
          className={`bg-white rounded-xl border p-4 shadow-xs transition-all hover:shadow-sm ${
            status === "PUBLISHED" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20" : "border-slate-200 hover:border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Published</span>
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600">{publishedCount.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Active & live in store</p>
          </div>
        </Link>

        {/* Draft Products */}
        <Link
          href="/admin/products?status=DRAFT"
          className={`bg-white rounded-xl border p-4 shadow-xs transition-all hover:shadow-sm ${
            status === "DRAFT" ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/30" : "border-slate-200 hover:border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Drafts</span>
            <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600">{draftCount.toLocaleString()}</div>
            <p className="text-[11px] text-amber-600/80 mt-0.5 font-medium">Unpublished items</p>
          </div>
        </Link>

        {/* Total Product Sales */}
        <Link
          href="/admin/orders"
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition-all hover:shadow-sm hover:border-indigo-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 group-hover:underline">Total Sales</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-indigo-600">{totalSalesCount.toLocaleString()}</div>
            <p className="text-[11px] text-indigo-600/80 mt-0.5 font-medium flex items-center gap-1">
              <span>View all orders</span>
              <span>→</span>
            </p>
          </div>
        </Link>
      </div>

      <AdminProductsManager
        products={products}
        totalProducts={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        categories={categories}
        initialQuery={query}
        currentCategory={categoryId}
        currentStatus={status}
        stats={{
          total: totalProductsCount,
          published: publishedCount,
          draft: draftCount,
          archived: archivedCount,
          totalSales: totalSalesCount,
        }}
      />
    </div>
  );
}
