import { Search, Filter, SlidersHorizontal, BookOpen, ChevronRight, PackageSearch, Sparkles } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import RDPProductCard from "@/components/product/RDPProductCard";
import VipBuyButton from "@/components/product/VipBuyButton";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CategoryMobileNav from "@/components/layout/CategoryMobileNav";
import CCProductTable from "@/components/product/CCProductTable";
import IBProductTable from "@/components/product/IBProductTable";
import StoreFilterToolbar from "./StoreFilterToolbar";
import { shuffleHourly, shuffleWithSeed } from "@/lib/utils/shuffle";

import { unstable_cache } from "next/cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store - Browse Digital Products, Software & Tools",
  description: "Explore our complete digital catalog: Software licenses, verified tools, courses, proxies, and digital assets with instant automatic delivery.",
  alternates: {
    canonical: "/store",
  },
  openGraph: {
    title: "Store - Browse Digital Products, Software & Tools | The Valid Market",
    description: "Explore our complete digital catalog with instant delivery and secure payment.",
    url: "/store",
  },
};

const getCachedProducts = unstable_cache(
  async (category: string | undefined, q: string | undefined, needsFieldValues: boolean, whereClause: any) => {
    return prisma.product.findMany({
      where: whereClause,
      omit: { description: true, shortDesc: true },
      include: { 
        category: true,
        ...(needsFieldValues && { fieldValues: { include: { field: true } } })
      },
      orderBy: { createdAt: "desc" },
    });
  },
  ["store-products-list-v3"],
  { revalidate: 300, tags: ["products", "products-v3"] }
);

const getCachedCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  },
  ["store-categories-list-v3"],
  { revalidate: 3600, tags: ["categories", "categories-v3"] }
);

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; seed?: string }>;
}) {
  const { category, q, sort, seed } = (await searchParams) || {};

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
      { metadata: { contains: q.trim() } },
    ];
  }

  const needsFieldValues = true;

  const t0 = performance.now();
  const [productsData, categories] = await Promise.all([
    getCachedProducts(category, q, needsFieldValues, whereClause),
    getCachedCategories()
  ]);
  const t1 = performance.now();
  console.log(`[Perf] /store queries took ${(t1 - t0).toFixed(2)}ms`);

  let finalProductsData = [...productsData];

  // Sorting and Shuffling logic
  if (sort === "shuffle") {
    const seedNum = seed ? parseInt(seed, 10) : Math.floor(Math.random() * 1000000);
    finalProductsData = shuffleWithSeed(finalProductsData, seedNum);
  } else if (sort === "price_asc") {
    finalProductsData.sort((a, b) => a.price - b.price);
  } else if (sort === "price_desc") {
    finalProductsData.sort((a, b) => b.price - a.price);
  } else if (sort === "worth_asc") {
    finalProductsData.sort((a: any, b: any) => {
      const wa = parseFloat(a.fieldValues?.find((fv: any) => ["worth", "balance"].includes(fv.field?.slug?.toLowerCase()) || ["worth", "balance"].includes(fv.field?.name?.toLowerCase()))?.value || "0") || 0;
      const wb = parseFloat(b.fieldValues?.find((fv: any) => ["worth", "balance"].includes(fv.field?.slug?.toLowerCase()) || ["worth", "balance"].includes(fv.field?.name?.toLowerCase()))?.value || "0") || 0;
      return wa - wb;
    });
  } else if (sort === "worth_desc") {
    finalProductsData.sort((a: any, b: any) => {
      const wa = parseFloat(a.fieldValues?.find((fv: any) => ["worth", "balance"].includes(fv.field?.slug?.toLowerCase()) || ["worth", "balance"].includes(fv.field?.name?.toLowerCase()))?.value || "0") || 0;
      const wb = parseFloat(b.fieldValues?.find((fv: any) => ["worth", "balance"].includes(fv.field?.slug?.toLowerCase()) || ["worth", "balance"].includes(fv.field?.name?.toLowerCase()))?.value || "0") || 0;
      return wb - wa;
    });
  } else if (sort === "name") {
    finalProductsData.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "newest") {
    finalProductsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default sorting
    if (category?.toLowerCase() === "rdp") {
      finalProductsData.sort((a, b) => a.price - b.price);
    } else if (category?.toLowerCase() === "cc" && (!q || !q.trim())) {
      // Automatic hourly shuffle for CC category
      finalProductsData = shuffleHourly(finalProductsData);
    }
  }

  const formattedProducts = finalProductsData.map((p) => ({
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
      <div className="bg-slate-950 text-white py-6 md:py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">{categoryName}</h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl">
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
                  prefetch={true}
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
                      prefetch={true}
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
            
            {/* Top Toolbar with Filter & Shuffle */}
            <StoreFilterToolbar
              categories={categories}
              currentCategory={currentCategory}
              totalResults={formattedProducts.length}
              currentSort={sort || "default"}
              searchQuery={q || ""}
            />



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
            ) : currentCategory === "cc" ? (
              <CCProductTable products={finalProductsData} />
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
