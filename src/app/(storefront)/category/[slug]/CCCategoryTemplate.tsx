"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search, ShoppingCart, ChevronLeft, ChevronRight, Filter,
  X, ArrowUpDown, Globe, TrendingUp, Package, DollarSign,
  Shield, Headphones, CheckCircle, Star, ChevronDown, SlidersHorizontal
} from "lucide-react";
import { addToCart } from "@/lib/cart";
import { normalizeImageUrl } from "@/lib/storage/client";
import CategoryMobileNav from "@/components/layout/CategoryMobileNav";
import CCProductTable from "@/components/product/CCProductTable";
import IBProductTable from "@/components/product/IBProductTable";

// ─── Buy Now Button ────────────────────────────────────────────────────────────
function BuyButton({ product }: { product: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    const price = product.salePrice ?? product.price ?? 0;
    let image = "";
    try { image = product.metadata ? JSON.parse(product.metadata).image || "" : ""; } catch {}
    addToCart({ id: product.id, name: product.name, slug: product.slug, price, image });
    router.push("/checkout");
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      aria-label={`Buy ${product.name} now`}
      className="inline-flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-amber-400 text-amber-950 hover:bg-amber-500 transition-all hover:shadow-md hover:shadow-amber-500/20 active:translate-y-0 disabled:opacity-70 whitespace-nowrap"
    >
      <ShoppingCart className="h-4 w-4" />
      <span>Buy Now</span>
    </button>
  );
}

// ─── Product Rating ────────────────────────────────────────────────────────────
function ProductRating({ reviews }: { reviews?: Array<{ rating: number }> }) {
  if (!reviews || reviews.length === 0) {
    return <span className="text-xs text-slate-400">No reviews</span>;
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {avg.toFixed(1)}
      <span className="text-slate-400 font-normal">({reviews.length})</span>
    </span>
  );
}

// ─── Field Value Helper ────────────────────────────────────────────────────────
function getFieldValue(product: any, fieldName: string): string {
  if (!product.fieldValues) return "";
  const lower = fieldName.toLowerCase();
  const match = product.fieldValues.find(
    (fv: any) =>
      fv.field?.slug?.toLowerCase() === lower ||
      fv.field?.name?.toLowerCase() === lower
  );
  return match?.value || "";
}

// ─── Country Badge ─────────────────────────────────────────────────────────────
function CountryBadge({ country }: { country: string }) {
  if (!country) return <span className="text-slate-400 text-[10px] md:text-sm">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-sm md:rounded-md bg-slate-100 text-slate-700 text-[10px] md:text-xs font-medium border border-slate-200">
      <Globe className="hidden sm:block h-3 w-3 text-slate-400" />
      <span className="max-w-[45px] sm:max-w-none truncate">{country}</span>
    </span>
  );
}

// ─── Price Display ─────────────────────────────────────────────────────────────
function PriceDisplay({ product }: { product: any }) {
  const price = product.salePrice ?? product.price;
  return (
    <div className="flex flex-col items-end leading-tight">
      {product.salePrice && (
        <span className="text-[9px] md:text-xs text-slate-400 line-through">${Number(product.price).toLocaleString("en-US")}</span>
      )}
      <span className="font-bold text-slate-900 text-[11px] md:text-base">${Number(price).toLocaleString("en-US")}</span>
    </div>
  );
}

// ─── CC Product Row (Desktop) ──────────────────────────────────────────────────
function CCProductRow({ product, index }: { product: any; index: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const country = getFieldValue(product, "country");
  const worth = getFieldValue(product, "worth") || getFieldValue(product, "balance");
  let image = "";
  try { image = product.metadata ? JSON.parse(product.metadata).image || "" : ""; } catch {}

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // let the BuyButton handle it

    e.preventDefault();
    setLoading(true);
    const price = product.salePrice ?? product.price ?? 0;
    addToCart({ id: product.id, name: product.name, slug: product.slug, price, image });
    router.push("/checkout");
  };

  return (
    <tr onClick={handleRowClick} className={`group transition-all duration-200 cursor-pointer ${loading ? 'opacity-75 pointer-events-none' : ''}`}>
      <td className="px-2 md:px-5 py-3 md:py-4 bg-white border-y border-l border-slate-200 rounded-l-xl group-hover:border-blue-300 group-hover:bg-blue-50/50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3 group/link">
          <div className="shrink-0 w-16 md:w-24 aspect-video rounded-md md:rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm relative" style={{ aspectRatio: "16 / 9" }}>
            {image ? (
              <Image
                src={normalizeImageUrl(image)}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 64px, 96px"
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors line-clamp-2 md:line-clamp-1 text-[11px] md:text-sm leading-tight">
              {product.name}
            </div>
            <div className="hidden sm:block">
              {product.reviews && <ProductRating reviews={product.reviews} />}
            </div>
          </div>
        </div>
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 shadow-sm">
        <CountryBadge country={country} />
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 shadow-sm">
        {worth ? (
          <span className="font-mono text-[11px] md:text-sm font-bold text-slate-800">
            ${Number(worth).toLocaleString("en-IN")}
          </span>
        ) : (
          <span className="text-slate-400 text-[11px] md:text-sm">—</span>
        )}
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 text-right shadow-sm">
        <PriceDisplay product={product} />
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-r border-slate-200 rounded-r-xl group-hover:border-blue-300 group-hover:bg-blue-50/50 text-right shadow-sm">
        <BuyButton product={product} />
      </td>
    </tr>
  );
}


// ─── Main CC Category Template ─────────────────────────────────────────────────
interface CCProps {
  category: any;
  categories: any[];
  products: any[];
  total: number;
  page: number;
  limit: number;
  searchQuery: string;
  currentSort: string;
  countryFilter: string;
  stats: {
    productCount: number;
    countryCount: number;
    avgPrice: number;
    maxWorth: number;
  };
  countries: string[];
}

export default function CCCategoryTemplate({
  category,
  categories,
  products,
  total,
  page,
  limit,
  searchQuery,
  currentSort,
  countryFilter,
  stats,
  countries,
}: CCProps) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(searchQuery);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const totalPages = Math.ceil(total / limit);

  const buildUrl = useCallback((overrides: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const q = overrides.q !== undefined ? String(overrides.q) : searchQuery;
    const sort = overrides.sort !== undefined ? String(overrides.sort) : currentSort;
    const pg = overrides.page !== undefined ? String(overrides.page) : String(page);
    const country = overrides.country !== undefined ? String(overrides.country) : countryFilter;
    if (q) p.set("q", q);
    if (sort && sort !== "default") p.set("sort", sort);
    if (pg && pg !== "1") p.set("page", pg);
    if (country) p.set("country", country);
    return `/category/${category.slug}?${p.toString()}`;
  }, [category.slug, searchQuery, currentSort, page, countryFilter]);

  const navigate = (overrides: Record<string, string | number>) => {
    router.push(buildUrl(overrides));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ q: searchVal, page: 1 });
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── CC HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {category.slug.toLowerCase() === "ib" ? (
            <>
              <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
              <div className="absolute top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-400/5 blur-[100px]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-violet-500/20 via-transparent to-transparent" />
              <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-cyan-400/15 via-transparent to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
              <div className="absolute top-1/2 -right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/6 blur-[100px]" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
              <div className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-primary/20 via-transparent to-transparent" />
              <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-blue-500/15 via-transparent to-transparent" />
            </>
          )}
        </div>

        <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 relative z-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/store" className="hover:text-white transition-colors">Store</Link>
            <span>/</span>
            <span className="text-slate-300 font-medium">{category.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300 mb-3">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                {stats.productCount} Products Available
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-2">
                {category.name}
                <span className="text-primary">.</span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                {category.description || `Premium ${category.name} products, clearly organized and ready to purchase.`}
              </p>
            </div>

            {/* Hero Search */}
            <div className="w-full lg:w-auto lg:min-w-[360px]">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="search"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder={`Search ${category.name} products...`}
                  aria-label={`Search ${category.name} products`}
                  className="w-full h-14 pl-12 pr-16 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/8 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Stats Row */}
          {(stats.productCount > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xl font-bold text-white">{stats.productCount}</div>
                  <div className="text-xs text-slate-400 font-medium">Products</div>
                </div>
              </div>
              {stats.countryCount > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{stats.countryCount}</div>
                    <div className="text-xs text-slate-400 font-medium">Countries</div>
                  </div>
                </div>
              )}
              {stats.avgPrice > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">${Math.round(stats.avgPrice).toLocaleString("en-US")}</div>
                    <div className="text-xs text-slate-400 font-medium">Avg Price</div>
                  </div>
                </div>
              )}
              {stats.maxWorth > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">${Number(stats.maxWorth).toLocaleString("en-IN")}</div>
                    <div className="text-xs text-slate-400 font-medium">Highest Balance</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Categories</h3>
                <nav className="space-y-0.5">
                  <Link
                    href="/store"
                    className="flex items-center px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    All Products
                  </Link>
                  {categories.map((cat: any) => {
                    const isActive = category.slug === cat.slug;
                    return (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-primary/8 text-primary font-semibold border border-primary/20"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {cat.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Country Filter */}
              {countries.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Filter by Country</h3>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => navigate({ country: "", page: 1 })}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                        !countryFilter ? "bg-primary/8 text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      All Countries
                    </button>
                    {countries.map(c => (
                      <button
                        key={c}
                        onClick={() => navigate({ country: c, page: 1 })}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          countryFilter === c ? "bg-primary/8 text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Globe className="h-3 w-3" />
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── PRODUCT LISTING ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-slate-700">
                  {category.name} Products
                </span>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                  {total} total
                </span>
                {(searchQuery || countryFilter) && (
                  <button
                    onClick={() => navigate({ q: "", country: "", page: 1 })}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <SlidersHorizontal className="h-4 w-4" /> Filter
                </button>
                {/* Sort */}
                <div className="relative flex-1 sm:flex-none">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={currentSort || "default"}
                    onChange={e => navigate({ sort: e.target.value, page: 1 })}
                    aria-label="Sort products"
                    className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                  >
                    <option value="default">Default Order</option>
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                    <option value="worth_asc">Balance: Low → High</option>
                    <option value="worth_desc">Balance: High → Low</option>
                    <option value="country_asc">Country: A → Z</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Country quick filter pills */}
            {countries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate({ country: "", page: 1 })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    !countryFilter ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  All
                </button>
                {countries.map(c => (
                  <button
                    key={c}
                    onClick={() => navigate({ country: c, page: 1 })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      countryFilter === c ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Product count info */}
            {total > 0 && (
              <p className="text-xs text-slate-500">
                Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} {category.name} products
                {countryFilter && ` in ${countryFilter}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            )}

            {/* Product List */}
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-24 text-center">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 mb-2">
                  {searchQuery || countryFilter ? "No matching products" : `No ${category.name} products yet`}
                </h3>
                <p className="text-slate-500 mb-6 text-sm">
                  {searchQuery || countryFilter
                    ? `No ${category.name} products match your current filters.`
                    : `Check back later — new products are added regularly.`}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {(searchQuery || countryFilter) && (
                    <button
                      onClick={() => navigate({ q: "", country: "", page: 1 })}
                      className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                  <Link href="/store" className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                    Browse All Products
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Responsive Table */}
                {category.slug.toLowerCase() === "ib" ? (
                  <IBProductTable products={products} />
                ) : (
                  <CCProductTable products={products} />
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Link
                      href={buildUrl({ page: Math.max(1, page - 1) })}
                      aria-label="Previous page"
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        page === 1 ? "text-slate-300 border-slate-100 pointer-events-none" : "text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" /> Prev
                    </Link>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const pg = i + 1;
                        return (
                          <Link
                            key={pg}
                            href={buildUrl({ page: pg })}
                            aria-label={`Page ${pg}`}
                            aria-current={pg === page ? "page" : undefined}
                            className={`w-9 h-9 rounded-lg border text-sm font-medium flex items-center justify-center transition-colors ${
                              pg === page ? "bg-primary text-primary-foreground border-primary" : "text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {pg}
                          </Link>
                        );
                      })}
                      {totalPages > 7 && <span className="text-slate-400 px-1">…</span>}
                    </div>
                    <Link
                      href={buildUrl({ page: Math.min(totalPages, page + 1) })}
                      aria-label="Next page"
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        page === totalPages ? "text-slate-300 border-slate-100 pointer-events-none" : "text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* ── TRUST STRIP ──────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { icon: Shield, label: "Secure Checkout", desc: "Protected payment flow" },
                  { icon: CheckCircle, label: "Verified Products", desc: "Reviewed before listing" },
                  { icon: Headphones, label: "Customer Support", desc: "Available when needed" },
                  { icon: TrendingUp, label: "Real Pricing", desc: "Transparent, no hidden fees" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800">{label}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RELATED CATEGORIES ───────────────────────────────────────── */}
            {categories.filter((c: any) => c.slug !== category.slug).length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Explore More</h2>
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((c: any) => c.slug !== category.slug && c.isActive)
                    .slice(0, 8)
                    .map((c: any) => (
                      <Link
                        key={c.id}
                        href={`/category/${c.slug}`}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-primary/40 hover:text-primary hover:shadow-sm transition-all"
                      >
                        {c.name}
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE FILTER DRAWER ──────────────────────────────────────────────── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
              </h3>
              <button onClick={() => setMobileFilterOpen(false)} aria-label="Close filters" className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Search */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Search</label>
                <form onSubmit={e => { e.preventDefault(); navigate({ q: searchVal, page: 1 }); setMobileFilterOpen(false); }} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    placeholder={`Search ${category.name}...`}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </form>
              </div>
              {/* Country */}
              {countries.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Country</label>
                  <div className="space-y-1">
                    <button onClick={() => { navigate({ country: "", page: 1 }); setMobileFilterOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!countryFilter ? "bg-primary/8 text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>All Countries</button>
                    {countries.map(c => (
                      <button key={c} onClick={() => { navigate({ country: c, page: 1 }); setMobileFilterOpen(false); }} className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${countryFilter === c ? "bg-primary/8 text-primary font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                        <Globe className="h-3 w-3" />{c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t">
              <button onClick={() => { navigate({ q: "", country: "", page: 1 }); setMobileFilterOpen(false); }} className="w-full py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile category nav (existing component) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white border-t border-slate-200 flex gap-2 shadow-lg">
        <CategoryMobileNav categories={categories} currentCategory={category.slug} />
      </div>
      <div className="lg:hidden h-20" />
    </div>
  );
}
