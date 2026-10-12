"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, ChevronRight, LayoutGrid, Layers, ArrowUpRight,
  Package, ShoppingCart, Users, BookOpen, Settings, Sliders
} from "lucide-react";
import { NAV_GROUPS } from "@/components/layout/adminNavConfig";

export default function AdminSectionsHub() {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const categories = useMemo(() => {
    return [
      { id: "ALL", label: "All Sections" },
      { id: "CATALOG", label: "Catalog" },
      { id: "ORDERS & COMMERCE", label: "Orders & Sales" },
      { id: "CUSTOMERS", label: "Customers" },
      { id: "COURSES", label: "Courses" },
      { id: "CONTENT", label: "Content & SEO" },
      { id: "SYSTEM", label: "System & Users" },
    ];
  }, []);

  const displayedGroups = useMemo(() => {
    let groups = NAV_GROUPS;

    // Filter by category tab
    if (filter !== "ALL") {
      if (filter === "CONTENT") {
        groups = groups.filter(g => g.label === "CONTENT" || g.label === "SEO" || g.label === "MARKETING");
      } else if (filter === "SYSTEM") {
        groups = groups.filter(g => g.label === "SYSTEM" || g.label === "USERS");
      } else {
        groups = groups.filter(g => g.label === filter);
      }
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return groups.map(g => ({
        ...g,
        items: g.items.filter(item => 
          item.name.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)
        )
      })).filter(g => g.items.length > 0);
    }

    return groups;
  }, [filter, search]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <LayoutGrid className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900">
              Admin Sections & Modules
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quickly navigate to any management module in your store.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all sections & menus..."
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50/30 border-b border-slate-100 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === cat.id
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="p-4 sm:p-6">
        {displayedGroups.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No sections match your search "{search}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedGroups.map((group) => (
              <div
                key={group.label}
                className="rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-shadow hover:shadow-xs flex flex-col overflow-hidden"
              >
                {/* Group Title Bar */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-3.5 rounded-full bg-gradient-to-b ${group.color || "from-primary to-indigo-500"}`} />
                    <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                      {group.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {group.items.length}
                  </span>
                </div>

                {/* Items List */}
                <div className="p-2 space-y-0.5 flex-1 divide-y divide-slate-50">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={`${group.label}-${item.name}`}
                        href={item.href}
                        className="group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-slate-700 hover:bg-primary/5 hover:text-primary transition-all font-medium"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1 rounded-md bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary text-slate-500 transition-colors shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="truncate">{item.name}</span>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
