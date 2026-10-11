"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";

interface ProductSearchToolbarProps {
  initialQuery: string;
  categories: { id: string; name: string }[];
  currentCategory?: string;
  currentStatus?: string;
}

export default function ProductSearchToolbar({
  initialQuery,
  categories,
  currentCategory,
  currentStatus,
}: ProductSearchToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Sync internal state when URL parameter changes
  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  const updateSearch = (query: string, categoryId?: string, status?: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    // Always reset to page 1 on new filter or search
    params.delete("page");

    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }

    if (categoryId !== undefined) {
      if (categoryId) params.set("categoryId", categoryId);
      else params.delete("categoryId");
    }

    if (status !== undefined) {
      if (status) params.set("status", status);
      else params.delete("status");
    }

    startTransition(() => {
      const qs = params.toString();
      router.push(`/admin/products${qs ? `?${qs}` : ""}`);
    });
  };

  // Debounced auto-search as user types
  useEffect(() => {
    if (searchTerm === initialQuery) return;
    const timer = setTimeout(() => {
      updateSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm("");
    updateSearch("");
  };

  const hasActiveFilters = Boolean(initialQuery || currentCategory || currentStatus);

  return (
    <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
      <form onSubmit={handleSubmit} className="relative w-full sm:w-96 flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by name, slug, SKU, category..."
          className="w-full pl-9 pr-8 py-2 border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              updateSearch("", "", "");
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1.5 rounded-md hover:bg-rose-50 border border-rose-200 transition-colors inline-flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Clear Filters
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
              currentCategory || currentStatus
                ? "bg-primary/10 border-primary text-primary"
                : "bg-white hover:bg-slate-50 text-slate-600"
            }`}
          >
            <Filter className="h-4 w-4" /> Filter
            {(currentCategory || currentStatus) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={currentCategory || ""}
                  onChange={(e) => {
                    updateSearch(searchTerm, e.target.value, undefined);
                  }}
                  className="w-full text-sm border rounded-lg p-2 bg-slate-50 focus:bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Status
                </label>
                <select
                  value={currentStatus || ""}
                  onChange={(e) => {
                    updateSearch(searchTerm, undefined, e.target.value);
                  }}
                  className="w-full text-sm border rounded-lg p-2 bg-slate-50 focus:bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <select className="h-[38px] rounded-md border bg-white px-3 py-2 text-sm text-slate-600 font-medium focus:outline-none">
          <option>Bulk Actions</option>
          <option>Publish</option>
          <option>Unpublish</option>
          <option>Archive</option>
          <option>Delete</option>
        </select>
      </div>
    </div>
  );
}
