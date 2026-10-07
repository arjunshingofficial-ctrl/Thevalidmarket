"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  DownloadCloud, 
  Key, 
  Repeat, 
  BookOpen, 
  Heart, 
  Star, 
  Ticket, 
  Users, 
  Bell, 
  LifeBuoy, 
  UserCircle, 
  ShieldCheck,
  LogOut,
  Wallet,
  MessageSquare,
  Sparkles
} from "lucide-react";

const SIDEBAR_LINKS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Downloads", href: "/dashboard/downloads", icon: DownloadCloud },
  { name: "Licenses", href: "/dashboard/licenses", icon: Key },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: Repeat },
  { name: "VIP Free Drops", href: "/dashboard/vip-drops", icon: Sparkles },
  { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Reviews", href: "/dashboard/reviews", icon: Star },
  { name: "Referrals", href: "/dashboard/referrals", icon: Users },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Community Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Support", href: "/dashboard/support", icon: LifeBuoy },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
  { name: "Security", href: "/dashboard/security", icon: ShieldCheck },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
      {SIDEBAR_LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {link.name}
          </Link>
        );
      })}
      
      <div className="pt-4 mt-4 border-t px-2">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </nav>
  );
}
