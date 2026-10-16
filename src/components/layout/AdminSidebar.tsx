"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronDown, Loader2, Globe, LogOut } from "lucide-react";
import { NAV_GROUPS, NavItem, NavGroup } from "./adminNavConfig";
import { useAdminBadges } from "@/components/providers/AdminBadgeContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { byPath, byGroup } = useAdminBadges();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (pathname === href) return;
    setPendingPath(href);
    startTransition(() => {
      router.push(href);
      setPendingPath(null);
    });
  };

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href) && href !== "/admin");

  const isGroupActive = (items: NavItem[]) =>
    items.some(item => isActive(item.href));

  return (
    <div className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col h-screen overflow-hidden shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 shrink-0 bg-slate-950">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="The Valid Market Logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg shrink-0 shadow-sm object-cover"
          />
          <div>
            <div className="text-white font-bold text-sm leading-none">The Valid Market</div>
            <div className="text-primary text-[10px] uppercase tracking-widest mt-0.5">Admin</div>
          </div>
        </Link>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
        {NAV_GROUPS.map((group) => {
          const groupActive = isGroupActive(group.items);
          const isCollapsed = collapsed[group.label] ?? false;
          const groupBadgeCount = byGroup[group.label] || 0;

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${
                  groupActive ? "text-primary" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{group.label}</span>
                  {groupBadgeCount > 0 && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </div>
                {isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const isItemPending = pendingPath === item.href;
                    const badgeCount = byPath[item.href] || 0;

                    return (
                      <Link
                        key={`${group.label}-${item.name}`}
                        href={item.href}
                        onClick={(e) => handleNavigation(e, item.href)}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors group/item ${
                          active
                            ? "bg-primary text-white font-medium shadow-sm"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        } ${isItemPending ? "opacity-70 pointer-events-none" : ""}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                          <span className="truncate">{item.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {badgeCount > 0 && (
                            <span className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full leading-tight ${
                                  active
                                    ? "bg-white/20 text-white border border-white/30"
                                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30 group-hover/item:bg-rose-500 group-hover/item:text-white transition-colors"
                                }`}
                              >
                                {badgeCount > 99 ? "99+" : badgeCount}
                              </span>
                            </span>
                          )}
                          {isItemPending && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-slate-300" />}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100">
          <Globe className="h-4 w-4 shrink-0 text-slate-500" />
          <span>View Store</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
