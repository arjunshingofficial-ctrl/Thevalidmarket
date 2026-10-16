"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Globe,
  Star,
  Package,
  CreditCard,
  RotateCw,
} from "lucide-react";
import { addToCart } from "@/lib/cart";
import { normalizeImageUrl } from "@/lib/storage/client";

interface CCProductsShortcodeProps {
  limit?: number;
  title?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  initialCountry?: string;
  className?: string;
}

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

function BuyButton({ product, compact = false }: { product: any; compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const price = product.salePrice ?? product.price ?? 0;
    let image = "";
    try {
      image = product.metadata ? JSON.parse(product.metadata).image || "" : "";
    } catch {}
    addToCart({ id: product.id, name: product.name, slug: product.slug, price, image });
    router.push("/checkout");
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      aria-label={`Buy ${product.name} now`}
      className={`inline-flex items-center justify-center gap-1.5 font-bold bg-amber-400 text-amber-950 hover:bg-amber-500 transition-all hover:shadow-md hover:shadow-amber-500/20 active:translate-y-0 disabled:opacity-70 whitespace-nowrap cursor-pointer rounded-lg ${
        compact
          ? "px-3 py-1.5 text-xs shadow-sm"
          : "px-3 sm:px-4 py-2 text-xs"
      }`}
    >
      <ShoppingCart className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
      <span>Buy Now</span>
    </button>
  );
}

function CountryBadge({ country }: { country: string }) {
  if (!country) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
      <Globe className="h-3 w-3 text-slate-400 shrink-0" />
      <span className="truncate max-w-[110px] sm:max-w-none">{country}</span>
    </span>
  );
}

function PriceDisplay({ product, compact = false }: { product: any; compact?: boolean }) {
  const price = product.salePrice ?? product.price;
  return (
    <div className={`flex flex-col leading-tight ${compact ? "items-end" : "items-end"}`}>
      {product.salePrice && (
        <span className="text-[10px] text-slate-400 line-through">
          ${Number(product.price).toLocaleString("en-US")}
        </span>
      )}
      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
        ${Number(price).toLocaleString("en-US")}
      </span>
    </div>
  );
}

export default function CCProductsShortcode({
  limit = 20,
  title = "Credit Cards (CC)",
  showSearch = true,
  showFilters = true,
  initialCountry = "",
  className = "",
}: CCProductsShortcodeProps) {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [sort, setSort] = useState("default");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
      });
      if (search.trim()) params.set("q", search.trim());
      if (selectedCountry) params.set("country", selectedCountry);

      const res = await fetch(`/api/shortcodes/cc?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load CC products");
      const data = await res.json();

      setProducts(data.products || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.countries && data.countries.length > 0) {
        setCountries(data.countries);
      }
    } catch (err) {
      console.error("Error fetching CC products in shortcode:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedCountry, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRowClick = (product: any, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    router.push(`/product/${product.slug}`);
  };

  return (
    <div className={`my-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-6 not-prose ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">{title}</h3>
            <p className="text-xs text-slate-500 font-medium">
              Showing {products.length} of {total} available cards
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {showSearch && (
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search card or country..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {showFilters && countries.length > 0 && (
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 truncate"
              >
                <option value="">All Countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {showFilters && (
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 truncate"
              >
                <option value="default">Default Sort</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE CARD LIST (< 640px) ── */}
      {/* Eliminates the horizontal scroll slider completely on phones */}
      <div className="block sm:hidden space-y-2.5 mt-3.5">
        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
            <div className="flex flex-col items-center justify-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading products...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-slate-100">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No cards found matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting search or country filter</p>
          </div>
        ) : (
          products.map((product) => {
            const country = getFieldValue(product, "country");
            const worth = getFieldValue(product, "worth") || getFieldValue(product, "balance");
            let image = "";
            try {
              image = product.metadata ? JSON.parse(product.metadata).image || "" : "";
            } catch {}

            return (
              <div
                key={product.id}
                onClick={(e) => handleRowClick(product, e)}
                className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-primary/40 transition-all cursor-pointer flex flex-col gap-2.5"
              >
                {/* Top: Card Thumbnail, Name, Rating and Price */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className="shrink-0 w-12 aspect-video rounded-md overflow-hidden border border-slate-200 bg-slate-50 relative"
                      style={{ aspectRatio: "16 / 9" }}
                    >
                      {image ? (
                        <Image
                          src={normalizeImageUrl(image)}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-900 text-xs truncate leading-snug">
                        {product.name}
                      </div>
                      {product.reviews && product.reviews.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>
                            {(product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0">
                    <PriceDisplay product={product} compact={true} />
                  </div>
                </div>

                {/* Bottom Row: Country & Balance on left, Buy Now button on right */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <CountryBadge country={country} />
                    {worth && (
                      <span className="inline-flex items-center text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <span className="text-slate-400 font-normal mr-1">Bal:</span>
                        ${Number(worth).toLocaleString("en-US")}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    <BuyButton product={product} compact={true} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── DESKTOP & TABLET TABLE (>= 640px) ── */}
      <div className="hidden sm:block overflow-x-auto mt-4">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-slate-900 text-slate-300">
              <th scope="col" className="px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-l-lg">
                PRODUCT
              </th>
              <th scope="col" className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                COUNTRY
              </th>
              <th scope="col" className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                BALANCE
              </th>
              <th scope="col" className="px-2 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right">
                PRICE
              </th>
              <th scope="col" className="px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-right rounded-r-lg">
                BUY
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCw className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-xs font-medium">Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center bg-slate-50 rounded-xl border border-slate-100">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No cards found matching your criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting search or filter</p>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const country = getFieldValue(product, "country");
                const worth = getFieldValue(product, "worth") || getFieldValue(product, "balance");
                let image = "";
                try {
                  image = product.metadata ? JSON.parse(product.metadata).image || "" : "";
                } catch {}

                return (
                  <tr
                    key={product.id}
                    onClick={(e) => handleRowClick(product, e)}
                    className="group transition-all duration-150 hover:bg-slate-50/80 cursor-pointer"
                  >
                    {/* Product Column */}
                    <td className="px-3 sm:px-4 py-3 bg-white border-y border-l border-slate-200 rounded-l-xl group-hover:border-primary/30 group-hover:bg-primary/[0.02]">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className="shrink-0 w-12 sm:w-16 aspect-video rounded-md overflow-hidden border border-slate-200 bg-slate-50 relative"
                          style={{ aspectRatio: "16 / 9" }}
                        >
                          {image ? (
                            <Image
                              src={normalizeImageUrl(image)}
                              alt={product.name}
                              fill
                              sizes="64px"
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-primary transition-colors truncate text-xs sm:text-sm">
                            {product.name}
                          </div>
                          {product.reviews && product.reviews.length > 0 && (
                            <div className="flex items-center gap-0.5 text-[11px] text-amber-600 font-medium">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{(product.reviews.reduce((s: number, r: any) => s + r.rating, 0) / product.reviews.length).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Country Column */}
                    <td className="px-2 sm:px-4 py-3 bg-white border-y border-slate-200 group-hover:border-primary/30 group-hover:bg-primary/[0.02]">
                      <CountryBadge country={country} />
                    </td>

                    {/* Worth / Balance Column */}
                    <td className="px-2 sm:px-4 py-3 bg-white border-y border-slate-200 group-hover:border-primary/30 group-hover:bg-primary/[0.02]">
                      {worth ? (
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-800">
                          ${Number(worth).toLocaleString("en-US")}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Price Column */}
                    <td className="px-2 sm:px-4 py-3 bg-white border-y border-slate-200 text-right group-hover:border-primary/30 group-hover:bg-primary/[0.02]">
                      <PriceDisplay product={product} />
                    </td>

                    {/* Buy Button Column */}
                    <td className="px-3 sm:px-4 py-3 bg-white border-y border-r border-slate-200 rounded-r-xl text-right group-hover:border-primary/30 group-hover:bg-primary/[0.02]">
                      <BuyButton product={product} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 sm:px-2.5 sm:py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Direct page buttons (tablet and desktop) */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (page <= 3) {
                  pageNum = idx + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = page - 2 + idx;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      page === pageNum
                        ? "bg-primary text-white"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 sm:px-2.5 sm:py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              title="Next Page"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
