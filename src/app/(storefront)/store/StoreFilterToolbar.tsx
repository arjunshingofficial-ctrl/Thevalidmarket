"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, ArrowUpDown, Shuffle, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import CategoryMobileNav from "@/components/layout/CategoryMobileNav";

interface StoreFilterToolbarProps {
  categories: any[];
  currentCategory: string;
  totalResults: number;
  currentSort: string;
  searchQuery: string;
}

export default function StoreFilterToolbar({
  categories,
  currentCategory,
  totalResults,
  currentSort,
  searchQuery,
}: StoreFilterToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [qInput, setQInput] = useState(searchQuery || "");

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === "default") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    const queryStr = params.toString();
    startTransition(() => {
      router.push(`/store${queryStr ? `?${queryStr}` : ""}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: qInput.trim() ? qInput.trim() : null });
  };

  const handleShuffleClick = () => {
    // Generate a fresh random shuffle seed
    const seed = Math.floor(Math.random() * 1000000).toString();
    updateUrl({ sort: "shuffle", seed });
  };

  const isShuffleActive = currentSort === "shuffle" || (!currentSort && currentCategory === "cc");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left: Results Count & Active Tags */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="text-sm font-medium text-slate-500">
          Showing <strong className="text-slate-900">{totalResults}</strong> results
        </div>

        {(searchQuery || (currentSort && currentSort !== "default")) && (
          <button
            onClick={() => updateUrl({ q: null, sort: null, seed: null })}
            className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <X className="h-3 w-3" /> Reset filters
          </button>
        )}
      </div>

      {/* Right Controls: Category Mobile, Search, Shuffle Button, Sort Dropdown */}
      <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        {/* Mobile category navigation */}
        <div className="w-full md:hidden">
          <CategoryMobileNav categories={categories} currentCategory={currentCategory} />
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search in store..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
          />
        </form>

        {/* Shuffle Button */}
        <button
          type="button"
          onClick={handleShuffleClick}
          title="Shuffle / reorder products"
          className={`h-10 px-3.5 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all active:scale-95 ${
            currentSort === "shuffle"
              ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
          }`}
        >
          <Shuffle className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          <span>Shuffle</span>
        </button>

        {/* Sort Dropdown */}
        <div className="relative min-w-[170px]">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <select
            value={currentSort || "default"}
            onChange={(e) => updateUrl({ sort: e.target.value, seed: null })}
            aria-label="Sort products"
            className="h-10 w-full pl-9 pr-8 border border-slate-200 bg-slate-50 hover:bg-white rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="default">Default Order</option>
            <option value="shuffle">Shuffle Order</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="worth_asc">Balance: Low → High</option>
            <option value="worth_desc">Balance: High → Low</option>
            <option value="newest">Newest First</option>
            <option value="name">Product Name (A-Z)</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
