import { Search, Filter, SlidersHorizontal, BookOpen, ChevronRight, PackageSearch, Sparkles } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import RDPProductCard from "@/components/product/RDPProductCard";
import VipBuyButton from "@/components/product/VipBuyButton";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CategoryMobileNav from "@/components/layout/CategoryMobileNav";
import BBProductTable from "@/components/product/BBProductTable";
import IBProductTable from "@/components/product/IBProductTable";

export const dynamic = "force-dynamic";

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = (await searchParams) || {};

  const whereClause: any = {
    status: "PUBLISHED",
  };

  if (category && category.toLowerCase() !== "all") {
    whereClause.category = {
      slug: category.toLowerCase(),
    };
  }

  if (q && q.trim()) {
    whereClause.OR = [
      { name: { contains: q.trim() } },
      { shortDesc: { contains: q.trim() } },
      { description: { contains: q.trim() } },
    ];
  }

  const [productsData, categories] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: { 
        category: true,
        fieldValues: { include: { field: true } }
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  // Force RDP items to sort by price
  if (category?.toLowerCase() === "rdp") {
    productsData.sort((a, b) => a.price - b.price);
  }

  const formattedProducts = productsData.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category.name,
    price: p.price,
    salePrice: p.salePrice,
    metadata: p.metadata,
    rating: 5,
  }));

  const currentCategory = category?.toLowerCase() || "all";
  const categoryName = currentCategory === "all" ? "Complete Catalog" : categories.find((c) => c.slug.toLowerCase() === currentCategory)?.name || "Store";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-950 text-white py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{categoryName}</h1>
            <p className="text-slate-400 text-lg max-w-xl">
              Discover our handpicked collection of {formattedProducts.length} premium digital products, courses, and software solutions designed to elevate your workflow.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 -mt-6">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <aside className="hidden md:block w-72 flex-shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
              <h3 className="font-bold text-slate-900 mb-5 flex items-center uppercase tracking-wider text-xs">
                <Filter className="mr-2 h-4 w-4 text-primary" /> Browse Categories
              </h3>

              <div className="space-y-1.5">
                <Link
                  href="/store"
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentCategory === "all"
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>All Products</span>
                  {currentCategory === "all" && <ChevronRight className="w-4 h-4" />}
                </Link>

                {categories.map((cat) => {
                  const isActive = currentCategory === cat.slug.toLowerCase();
                  return (
                    <Link
                      key={cat.id}
                      href={`/store?category=${cat.slug}`}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full">
            
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-slate-500 w-full sm:w-auto">
                Showing <strong className="text-slate-900">{formattedProducts.length}</strong> results
              </div>
              
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full md:hidden">
                  <CategoryMobileNav categories={categories} currentCategory={currentCategory} />
                </div>
                
                <form method="GET" action="/store" className="relative w-full sm:w-72 group">
                  {category && <input type="hidden" name="category" value={category} />}
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={q || ""}
                    placeholder="Search in store..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                  />
                </form>
              </div>
            </div>

            {/* VIP Promo Banner */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-lg p-6 mb-8 text-white relative overflow-hidden group border border-violet-500/50">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-yellow-300" />
                    Daily Free Drops - VIP Access
                  </h3>
                  <p className="text-indigo-100 mt-2 text-sm md:text-base max-w-xl">
                    Get instant access to daily free exclusive products, software, and tools for just <strong>$10/month</strong>. Never pay full price again.
                  </p>
                </div>
                <VipBuyButton />
              </div>
            </div>

            {/* Product Grid */}
            {formattedProducts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <PackageSearch className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                  We couldn't find any products matching your search criteria. Try adjusting your filters or search term.
                </p>
                <Link
                  href="/store"
                  className="mt-6 inline-flex items-center justify-center px-6 py-3 font-semibold bg-slate-900 text-white rounded-xl hover:bg-primary transition-colors shadow-sm hover:shadow-primary/20"
                >
                  Clear Filters
                </Link>
              </div>
            ) : currentCategory === "bb" ? (
              <BBProductTable products={productsData} />
            ) : currentCategory === "ib" ? (
              <IBProductTable products={productsData} />
            ) : currentCategory === "rdp" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-[1440px]:grid-cols-5 gap-5 mt-6">
                {formattedProducts.map((product) => (
                  <RDPProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1440px]:grid-cols-5 gap-4 md:gap-5 min-[1440px]:gap-6 mt-6">
                {formattedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
