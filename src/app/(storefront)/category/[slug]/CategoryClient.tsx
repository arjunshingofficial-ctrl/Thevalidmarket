"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, ChevronLeft, ChevronRight, Check, Filter, PackageSearch } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { addToCart } from "@/lib/cart";
import CategoryMobileNav from "@/components/layout/CategoryMobileNav";
import { formatUsd } from "@/lib/currency";

function BuyButton({ product }: { product: any }) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const price = product.salePrice ?? product.price ?? 0;
    const metadata = product.metadata ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata) : {};
    
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: metadata.image
    });
    
    setAdded(true);
    router.push("/checkout");
  };

  return (
    <button 
      onClick={handleAddToCart}
      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm ${
        added ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 hover:-translate-y-0.5"
      }`}
    >
      {added ? "Added!" : "Buy Now"}
    </button>
  );
}

export default function CategoryClient({ category, categories, products, total, page, limit, searchQuery, currentSort }: any) {
  const router = useRouter();
  const displayMode = category.displayMode || "GRID";
  
  let tableColumns = [];
  try {
    tableColumns = category.tableColumns ? JSON.parse(category.tableColumns) : [
      { label: "Product Name", source: "product.name" },
      { label: "Price", source: "product.price" },
      { label: "Buy Now", source: "system.buy_button" }
    ];
  } catch(e) {}

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q");
    updateParams({ q: q as string, page: 1 });
  };

  const updateParams = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams();
    if (searchQuery || newParams.q) params.set("q", String(newParams.q ?? searchQuery));
    if (currentSort !== "default" || newParams.sort) params.set("sort", String(newParams.sort ?? currentSort));
    if (page !== 1 || newParams.page) params.set("page", String(newParams.page ?? page));
    
    router.push(`/category/${category.slug}?${params.toString()}`);
  };

  const resolveFieldValue = (product: any, source: string) => {
    if (source === "product.name") {
      const metadata = product.metadata ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata) : {};
      const image = metadata.image;
      return (
        <Link href={`/product/${product.slug}`} className="flex items-center gap-4 group">
          {image ? (
            <img src={image} alt={product.name} className="w-12 h-12 object-cover rounded-xl border shadow-sm group-hover:shadow-md transition-all" />
          ) : (
            <div className="w-12 h-12 bg-slate-50 border rounded-xl flex items-center justify-center text-[10px] text-slate-400 font-medium">IMG</div>
          )}
          <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </span>
        </Link>
      );
    }
    if (source === "product.price") {
      const price = product.salePrice ?? product.price ?? 0;
      return (
        <div className="flex flex-col">
          {product.salePrice && <span className="text-xs text-slate-400 line-through mb-0.5">{formatUsd(product.price)}</span>}
          <span className={`font-black text-[15px] ${product.salePrice ? "text-rose-600" : "text-slate-900"}`}>{formatUsd(price)}</span>
        </div>
      );
    }
    if (source === "system.buy_button") {
      return <BuyButton product={product} />;
    }
    
    if (source.startsWith("custom_field.")) {
      const fieldSlug = source.replace("custom_field.", "").toLowerCase();
      const match = product.fieldValues?.find((fv: any) => fv.field?.slug?.toLowerCase() === fieldSlug || fv.field?.name?.toLowerCase() === fieldSlug);
      return <span className="text-sm font-medium text-slate-600">{match ? match.value : "-"}</span>;
    }

    return <span className="text-sm text-slate-600">-</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* Header Banner */}
      <div className="bg-slate-950 text-white py-12 md:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-slate-400 text-lg max-w-xl">
                {category.description}
              </p>
            )}
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
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  <span>All Products</span>
                </Link>

                {categories.map((cat: any) => {
                  const isActive = category.slug === cat.slug;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-8 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-slate-500 w-full lg:w-auto">
                Showing <strong className="text-slate-900">{total}</strong> results
              </div>
              
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full md:hidden">
                  <CategoryMobileNav categories={categories} currentCategory={category.slug} />
                </div>
                
                <form onSubmit={handleSearch} className="relative w-full sm:w-64 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="search" 
                    name="q" 
                    defaultValue={searchQuery}
                    placeholder={`Search ${category.name}...`} 
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                  />
                </form>

                <select 
                  value={currentSort || "default"}
                  onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
                  className="h-10 w-full sm:w-48 border border-slate-200 bg-slate-50 rounded-xl text-sm px-3 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all appearance-none"
                >
                  <option value="default">Sort: Default</option>
                  <option value="name">Product Name (A-Z)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Content */}
            {products.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-16 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <PackageSearch className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No {category.name} products available yet.</h3>
                <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                  Check back later or try adjusting your search filters to find what you're looking for.
                </p>
                <Link
                  href="/store"
                  className="mt-6 inline-flex items-center justify-center px-6 py-3 font-semibold bg-slate-900 text-white rounded-xl hover:bg-primary transition-colors shadow-sm hover:shadow-primary/20"
                >
                  Browse All Products
                </Link>
              </div>
            ) : (
              <>
                {displayMode === "TABLE" || displayMode === "LIST" ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200/60">
                            {tableColumns.map((col: any, idx: number) => (
                              <th key={idx} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {products.map((product: any) => (
                            <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                              {tableColumns.map((col: any, idx: number) => (
                                <td key={idx} className="px-6 py-4 align-middle">
                                  {resolveFieldValue(product, col.source)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 min-[1440px]:grid-cols-5 gap-4 md:gap-5 min-[1440px]:gap-6">
                    {products.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Link 
                      href={`/category/${category.slug}?page=${Math.max(1, page - 1)}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className={`p-2.5 rounded-xl border transition-all ${page === 1 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700">
                      Page {page} <span className="text-slate-400 font-medium">of {totalPages}</span>
                    </div>
                    <Link 
                      href={`/category/${category.slug}?page=${Math.min(totalPages, page + 1)}${searchQuery ? `&q=${searchQuery}` : ''}`}
                      className={`p-2.5 rounded-xl border transition-all ${page === totalPages ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
