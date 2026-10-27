"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  DownloadCloud, 
  Key, 
  Repeat, 
  BookOpen, 
  Star, 
  Users, 
  Bell, 
  LifeBuoy, 
  UserCircle, 
  ShieldCheck,
  Wallet,
  MessageSquare,
  Sparkles
} from "lucide-react";

const TABLET_LINKS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Downloads", href: "/dashboard/downloads", icon: DownloadCloud },
  { name: "Licenses", href: "/dashboard/licenses", icon: Key },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: Repeat },
  { name: "VIP Drops", href: "/dashboard/vip-drops", icon: Sparkles },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Reviews", href: "/dashboard/reviews", icon: Star },
  { name: "Referrals", href: "/dashboard/referrals", icon: Users },
  { name: "Alerts", href: "/dashboard/notifications", icon: Bell },
  { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
  { name: "Security", href: "/dashboard/security", icon: ShieldCheck },
];

export default function DashboardTabletNav({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <div className="lg:hidden w-full mb-6">
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
        {/* User Compact Ribbon */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-slate-900 block truncate">
                {user.name || "Customer Dashboard"}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {user.email}
              </span>
            </div>
          </div>

          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            Active Account
          </span>
        </div>

        {/* Horizontal Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {TABLET_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
