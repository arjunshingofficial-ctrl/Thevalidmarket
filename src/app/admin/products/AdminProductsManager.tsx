"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Search, Filter, X, Package, AlertTriangle, Loader2, CheckCircle2, ShoppingCart 
} from "lucide-react";
import ProductRowActions from "./ProductRowActions";

interface AdminProductsManagerProps {
  products: any[];
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  categories: { id: string; name: string }[];
  initialQuery: string;
  currentCategory?: string;
  currentStatus?: string;
  stats?: {
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalSales: number;
  };
}

export default function AdminProductsManager({
  products,
  totalProducts,
  currentPage,
  totalPages,
  categories,
  initialQuery,
  currentCategory,
  currentStatus,
  stats,
}: AdminProductsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [, startTransition] = useTransition();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [isExecutingBulk, setIsExecutingBulk] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync internal search input with URL
  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  // Clear selections when page changes
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, initialQuery, currentCategory, currentStatus]);

  const updateSearch = (query: string, categoryId?: string, status?: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
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

  // Debounced auto-search
  useEffect(() => {
    if (searchTerm === initialQuery) return;
    const timer = setTimeout(() => {
      updateSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    updateSearch("");
  };

  // Checkbox selection handlers
  const isAllSelected = products.length > 0 && selectedIds.length === products.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < products.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk action execution
  const executeBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      setBulkMessage({ type: "error", text: "Please select at least one product using the checkboxes." });
      setTimeout(() => setBulkMessage(null), 3500);
      setBulkAction("");
      return;
    }

    if (action === "delete") {
      setShowDeleteModal(true);
      return;
    }

    await performBulkRequest(action);
  };

  const performBulkRequest = async (action: string) => {
    setIsExecutingBulk(true);
    setBulkMessage(null);

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          productIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bulk action failed");
      }

      setBulkMessage({
        type: "success",
        text: `Successfully performed "${action}" on ${selectedIds.length} product(s)!`,
      });
      setSelectedIds([]);
      setBulkAction("");
      setShowDeleteModal(false);
      router.refresh();

      setTimeout(() => setBulkMessage(null), 4000);
    } catch (err: any) {
      setBulkMessage({
        type: "error",
        text: err.message || "Failed to execute bulk action.",
      });
      setTimeout(() => setBulkMessage(null), 5000);
    } finally {
      setIsExecutingBulk(false);
    }
  };

  const hasActiveFilters = Boolean(initialQuery || currentCategory || currentStatus);

  const buildPageUrl = (targetPage: number) => {
    const p = new URLSearchParams(searchParams?.toString() || "");
    if (targetPage > 1) p.set("page", targetPage.toString());
    else p.delete("page");
    const qs = p.toString();
    return `/admin/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
      {/* Notifications / Alerts */}
      {bulkMessage && (
        <div
          className={`px-4 py-3 flex items-center justify-between text-sm border-b transition-all ${
            bulkMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {bulkMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{bulkMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setBulkMessage(null)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="border-b bg-slate-50/70 px-4 pt-3 flex items-center gap-2 overflow-x-auto">
        {[
          { id: "", label: "All Products", count: stats?.total ?? totalProducts },
          { id: "PUBLISHED", label: "Published", count: stats?.published ?? 0, badgeColor: "bg-emerald-100 text-emerald-700" },
          { id: "DRAFT", label: "Drafts", count: stats?.draft ?? 0, badgeColor: "bg-amber-100 text-amber-700" },
          ...((stats?.archived || 0) > 0 ? [{ id: "ARCHIVED", label: "Archived", count: stats?.archived, badgeColor: "bg-slate-200 text-slate-700" }] : []),
        ].map((tab) => {
          const isActive = (currentStatus || "") === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => updateSearch(searchTerm, currentCategory, tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "border-primary text-primary bg-white shadow-xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab.badgeColor || "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="p-4 border-b flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96 flex items-center">
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
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-between sm:justify-end">
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

          {/* Filter dropdown */}
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
                    onChange={(e) => updateSearch(searchTerm, e.target.value, undefined)}
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
                    onChange={(e) => updateSearch(searchTerm, undefined, e.target.value)}
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

          {/* Bulk Actions Dropdown */}
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md whitespace-nowrap">
                {selectedIds.length} selected
              </span>
            )}
            <select
              value={bulkAction}
              onChange={(e) => {
                const act = e.target.value;
                setBulkAction(act);
                if (act) {
                  executeBulkAction(act);
                }
              }}
              disabled={isExecutingBulk}
              className={`h-[38px] rounded-md border px-3 py-2 text-sm font-medium focus:outline-none transition-colors cursor-pointer ${
                selectedIds.length > 0
                  ? "bg-white border-primary/50 text-slate-900 shadow-sm"
                  : "bg-white text-slate-600 border-slate-300"
              }`}
            >
              <option value="">Bulk Actions</option>
              <option value="publish">Publish</option>
              <option value="unpublish">Unpublish</option>
              <option value="archive">Archive</option>
              <option value="delete">Delete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete {selectedIds.length} Products?</h3>
              <p className="text-slate-500 text-sm mt-2">
                Are you sure you want to delete the <strong>{selectedIds.length}</strong> selected products? This will permanently remove them along with their custom fields, variants, and files. This action cannot be undone.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setBulkAction("");
                }}
                disabled={isExecutingBulk}
                className="px-4 py-2 border rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => performBulkRequest("delete")}
                disabled={isExecutingBulk}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                {isExecutingBulk && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Delete ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={handleSelectAll}
                  aria-label="Select all products on page"
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 font-semibold hidden md:table-cell">Type</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold text-center">Orders / Sales</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-lg font-medium text-slate-900">No products found</p>
                  <p>Try adjusting your search query or filters.</p>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <tr
                    key={product.id}
                    className={`transition-colors group ${
                      isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-slate-100 hidden sm:flex items-center justify-center shrink-0 border">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                        <div className="min-w-0 max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px]">
                          <div className="font-medium text-slate-900 truncate" title={product.name}>
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate" title={product.sku || product.slug}>
                            {product.sku || product.slug}
                          </div>
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
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {product._count?.orderItems > 0 ? (
                        <Link
                          href={`/admin/orders?q=${encodeURIComponent(product.name)}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-xs"
                          title={`View orders containing ${product.name}`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{product._count.orderItems} {product._count.orderItems === 1 ? 'sale' : 'sales'}</span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs text-slate-400 bg-slate-50 border border-slate-100">
                          0 sales
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          product.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-700"
                            : product.status === "DRAFT"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductRowActions product={product} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50">
        <div className="text-sm text-slate-500">
          Showing <strong>{products.length}</strong> of <strong>{totalProducts}</strong> products
          {stats?.totalSales !== undefined && (
            <span className="text-xs text-slate-400 ml-2">
              • <strong>{stats.totalSales}</strong> total product sales
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentPage > 1 ? (
            <Link
              href={buildPageUrl(currentPage - 1)}
              className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50"
            >
              Previous
            </Link>
          ) : (
            <button
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm"
              disabled
            >
              Previous
            </button>
          )}
          {currentPage < totalPages ? (
            <Link
              href={buildPageUrl(currentPage + 1)}
              className="px-3 py-1 border rounded-md text-sm bg-white shadow-sm hover:bg-slate-50"
            >
              Next
            </Link>
          ) : (
            <button
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 bg-white shadow-sm"
              disabled
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
