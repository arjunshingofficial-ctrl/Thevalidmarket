"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Package, Folders, SlidersHorizontal, HardDrive, Image,
  ShoppingCart, CreditCard, Receipt, Ticket, Repeat, Key, Download, RefreshCcw,
  Users, Star, LifeBuoy, Link2,
  BookOpen, GraduationCap,
  Wifi, Server, MapPin, Activity,
  FileText, FileSearch, Home, Menu, Megaphone, MessageSquare, HelpCircle,
  Search, Globe, ArrowLeftRight, Map, Bot,
  Tag, Share2, Bell, Mail, Loader2,
  UserCheck, Shield, ShieldAlert, Settings, Plug, LogOut, ChevronDown, ChevronRight, Sparkles
} from "lucide-react";

type NavItem = { name: string; href: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ]
  },
  {
    label: "CATALOG",
    items: [
      { name: "Products", href: "/admin/products", icon: Package },
      { name: "VIP Free Drops", href: "/admin/products?category=vip-drops", icon: Sparkles },
      { name: "Categories", href: "/admin/categories", icon: Folders },
      { name: "Custom Fields", href: "/admin/custom-fields", icon: SlidersHorizontal },
      { name: "Product Files", href: "/admin/product-files", icon: HardDrive },
      { name: "Media Library", href: "/admin/media", icon: Image },
    ]
  },
  {
    label: "ORDERS & COMMERCE",
    items: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Payments", href: "/admin/payments", icon: CreditCard },
      { name: "Payment Reviews", href: "/admin/payments/review", icon: ShieldAlert },
      { name: "Payment Settings", href: "/admin/settings/payments", icon: Receipt },
      { name: "Coupons", href: "/admin/coupons", icon: Ticket },
      { name: "Subscriptions", href: "/admin/subscriptions", icon: Repeat },
      { name: "Downloads", href: "/admin/downloads", icon: Download },
      { name: "Refunds", href: "/admin/refunds", icon: RefreshCcw },
    ]
  },
  {
    label: "CUSTOMERS",
    items: [
      { name: "Customers", href: "/admin/customers", icon: Users },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
      { name: "Community Chat", href: "/admin/chat", icon: MessageSquare },
      { name: "Support Tickets", href: "/admin/support", icon: LifeBuoy },
      { name: "Referrals", href: "/admin/referrals", icon: Link2 },
    ]
  },
  {
    label: "WALLET",
    items: [
      { name: "Wallets", href: "/admin/wallets", icon: CreditCard },
      { name: "Deposits", href: "/admin/wallets/deposits", icon: Download },
      { name: "Settings", href: "/admin/settings/wallet", icon: Settings },
    ]
  },
  {
    label: "COURSES",
    items: [
      { name: "Courses", href: "/admin/courses", icon: BookOpen },
      { name: "Students", href: "/admin/students", icon: GraduationCap },
    ]
  },
  {
    label: "NETWORK SERVICES",
    items: [
      { name: "VPN & Proxy Plans", href: "/admin/network-services", icon: Wifi },
      { name: "Locations", href: "/admin/locations", icon: MapPin },
      { name: "Service Status", href: "/admin/service-status", icon: Activity },
    ]
  },
  {
    label: "CONTENT",
    items: [
      { name: "Blog Posts", href: "/admin/blog", icon: FileText },
      { name: "Blog Categories", href: "/admin/blog/categories", icon: Folders },
      { name: "Pages", href: "/admin/pages", icon: FileSearch },
      { name: "Menus", href: "/admin/appearance/menus", icon: Menu },
      { name: "Homepage", href: "/admin/settings/homepage", icon: Home },
      { name: "Banners", href: "/admin/banners", icon: Megaphone },
      { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
      { name: "FAQ", href: "/admin/faq", icon: HelpCircle },
    ]
  },
  {
    label: "SEO",
    items: [
      { name: "SEO Dashboard", href: "/admin/seo", icon: Search },
      { name: "Global SEO", href: "/admin/settings/seo", icon: Globe },
      { name: "Redirects", href: "/admin/settings/redirects", icon: ArrowLeftRight },
      { name: "Sitemap", href: "/admin/sitemap", icon: Map },
      { name: "Robots.txt", href: "/admin/robots", icon: Bot },
    ]
  },
  {
    label: "MARKETING",
    items: [
      { name: "Coupons", href: "/admin/coupons", icon: Tag },
      { name: "Referrals", href: "/admin/referrals", icon: Share2 },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
    ]
  },
  {
    label: "USERS",
    items: [
      { name: "All Users", href: "/admin/users", icon: Users },
      { name: "Staff & Admins", href: "/admin/staff", icon: UserCheck },
      { name: "Roles & Permissions", href: "/admin/roles", icon: Shield },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
      { name: "Settings", href: "/admin/settings", icon: Settings },
      { name: "Security", href: "/admin/security", icon: Shield },
      { name: "Integrations", href: "/admin/integrations", icon: Plug },
    ]
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
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
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">Asia D Market</div>
            <div className="text-primary text-[10px] uppercase tracking-widest">Admin</div>
          </div>
        </Link>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
        {NAV_GROUPS.map((group) => {
          const groupActive = isGroupActive(group.items);
          const isCollapsed = collapsed[group.label] ?? false;

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${
                  groupActive ? "text-primary" : "text-slate-500 hover:text-slate-400"
                }`}
              >
                {group.label}
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
                    return (
                      <Link
                        key={`${group.label}-${item.name}`}
                        href={item.href}
                        onClick={(e) => handleNavigation(e, item.href)}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          active
                            ? "bg-primary text-white font-medium shadow-sm"
                            : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        } ${isItemPending ? "opacity-70 pointer-events-none" : ""}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-slate-500"}`} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        {isItemPending && <Loader2 className="h-4 w-4 animate-spin shrink-0 text-slate-300" />}
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
