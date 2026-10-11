import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
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

      <AdminProductsManager
        products={products}
        totalProducts={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        categories={categories}
        initialQuery={query}
        currentCategory={categoryId}
        currentStatus={status}
      />
    </div>
  );
}
