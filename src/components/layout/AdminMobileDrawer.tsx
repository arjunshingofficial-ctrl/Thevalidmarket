"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  X, Search, ChevronDown, ChevronRight, Globe, LogOut, 
  LayoutDashboard, Package, ShoppingCart, CreditCard, Settings,
  Sparkles
} from "lucide-react";
import { NAV_GROUPS, NavItem } from "./adminNavConfig";

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
}

export default function AdminMobileDrawer({ isOpen, onClose, session }: AdminMobileDrawerProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Auto-close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href) && href !== "/admin");

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [label]: prev[label] === undefined ? false : !prev[label]
    }));
  };

  // Filter items if searching
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results: { groupLabel: string; item: NavItem }[] = [];
    NAV_GROUPS.forEach(g => {
      g.items.forEach(item => {
        if (item.name.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) {
          results.push({ groupLabel: g.label, item });
        }
      });
    });
    return results;
  }, [searchQuery]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation Menu"
        className="relative w-full max-w-[320px] sm:max-w-xs bg-slate-900 text-slate-200 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800"
      >
        {/* Drawer Header */}
        <div className="h-16 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <Link 
            href="/admin" 
            onClick={onClose} 
            className="flex items-center gap-2.5"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-black">V</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
                The Valid Market
                <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded border border-primary/30 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <div className="text-slate-400 text-[11px]">Management Portal</div>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Search */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all admin sections..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Jump Shortcuts Bar (shown when not searching) */}
        {!searchQuery && (
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 px-1">
              Quick Shortcuts
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <Link
                href="/admin/dashboard"
                onClick={onClose}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center border border-slate-750"
              >
                <LayoutDashboard className="h-4 w-4 text-blue-400 mb-1" />
                <span className="text-[10px] font-medium leading-none">Home</span>
              </Link>
              <Link
                href="/admin/products"
                onClick={onClose}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center border border-slate-750"
              >
                <Package className="h-4 w-4 text-emerald-400 mb-1" />
                <span className="text-[10px] font-medium leading-none">Products</span>
              </Link>
              <Link
                href="/admin/orders"
                onClick={onClose}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center border border-slate-750"
              >
                <ShoppingCart className="h-4 w-4 text-amber-400 mb-1" />
                <span className="text-[10px] font-medium leading-none">Orders</span>
              </Link>
              <Link
                href="/admin/settings"
                onClick={onClose}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-center border border-slate-750"
              >
                <Settings className="h-4 w-4 text-purple-400 mb-1" />
                <span className="text-[10px] font-medium leading-none">Settings</span>
              </Link>
            </div>
          </div>
        )}

        {/* Scrollable Nav Content */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
          {/* SEARCH RESULTS VIEW */}
          {filteredItems !== null ? (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400">
                Found {filteredItems.length} {filteredItems.length === 1 ? "match" : "matches"}
              </div>
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No admin sections match "{searchQuery}"
                </div>
              ) : (
                filteredItems.map(({ groupLabel, item }) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${groupLabel}-${item.name}`}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${
                        active
                          ? "bg-primary text-white font-medium shadow-sm"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                        <div className="truncate">
                          <span className="font-semibold text-slate-100">{item.name}</span>
                          <span className="text-[10px] text-slate-400 ml-1.5 font-normal">in {groupLabel}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
                    </Link>
                  );
                })
              )}
            </div>
          ) : (
            /* GROUPED CATEGORIES ACCORDION VIEW */
            NAV_GROUPS.map((group) => {
              const groupHasActive = group.items.some(item => isActive(item.href));
              // Default to expanded if group contains active item, or check state
              const isCollapsed = collapsedGroups[group.label] !== undefined
                ? collapsedGroups[group.label]
                : !groupHasActive && group.label !== "OVERVIEW" && group.label !== "CATALOG";

              return (
                <div 
                  key={group.label} 
                  className="rounded-xl bg-slate-950/40 border border-slate-800/80 overflow-hidden"
                >
                  {/* Group Accordion Header */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-3.5 rounded-full bg-gradient-to-b ${group.color || "from-primary to-indigo-500"}`} />
                      <span className={`text-[11px] font-bold tracking-wider uppercase ${
                        groupHasActive ? "text-primary" : "text-slate-300"
                      }`}>
                        {group.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {group.items.length}
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <div className="p-1 space-y-0.5 border-t border-slate-800/60 bg-slate-900/40">
                      {group.items.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;

                        return (
                          <Link
                            key={`${group.label}-${item.name}`}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              active
                                ? "bg-primary text-white shadow-sm font-semibold"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {active && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User Card & Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2">
          {/* User profile row */}
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0">
              {session?.user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {session?.user?.name || "Admin"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {session?.user?.role || "ADMIN"} · {session?.user?.email}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              target="_blank"
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              Store
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-900/40 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
