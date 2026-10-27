"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { 
  Menu, X, User, LayoutDashboard, ShoppingBag, DownloadCloud, Key, 
  Repeat, BookOpen, Heart, Star, Ticket, Users, Bell, LifeBuoy, 
  UserCircle, ShieldCheck, LogOut, Package, Folders, FileText, 
  Settings, Globe, ChevronRight, Briefcase, ChevronDown, Wallet, MessageSquare, Copy, Check, Headphones
} from "lucide-react";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const NavItem = ({ link, isActive, onClick }: { link: any, isActive: boolean, onClick?: () => void }) => {
  const Icon = link.icon;
  return (
    <li>
      <Link 
        href={link.href}
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isActive
            ? "bg-white/10 text-white shadow-sm"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-primary rounded-r-full" />}
        {Icon && (
          <Icon className={`h-5 w-5 shrink-0 transition-colors ${
            isActive ? "text-white" : "text-slate-500 group-hover:text-white"
          }`} />
        )}
        {link.name}
      </Link>
    </li>
  );
};

export default function MobileNav({ session, menuItems = [] }: { session: any, menuItems?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() || "";
  const drawerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (session?.user?.accountId) {
      navigator.clipboard.writeText(session.user.accountId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDrawer = () => setIsOpen(!isOpen);
  const closeDrawer = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    closeDrawer();
  }, [pathname]);

  const dynamicNavLinks: { name: string; href: string; icon: any; children?: any[] }[] = menuItems.length > 0 
    ? menuItems.map(item => ({ name: item.label, href: item.url, icon: Globe, children: item.children }))
    : [
        { name: "Home", href: "/", icon: Globe },
        { name: "Store", href: "/store", icon: ShoppingBag },
        { name: "Courses", href: "/courses", icon: BookOpen },
        { name: "Software & Tools", href: "/software", icon: Package },
        { name: "VPN & Proxy", href: "/vpn-proxy", icon: ShieldCheck },
        { name: "Services", href: "/services", icon: Briefcase },
        { name: "News", href: "/blog", icon: FileText },
        { name: "Contact Us", href: "/contact", icon: Headphones },
      ];

  const dashboardLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { name: "Downloads", href: "/dashboard/downloads", icon: DownloadCloud },
    { name: "Licenses", href: "/dashboard/licenses", icon: Key },
    { name: "Subscriptions", href: "/dashboard/subscriptions", icon: Repeat },
    { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Reviews", href: "/dashboard/reviews", icon: Star },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Referrals", href: "/dashboard/referrals", icon: Users },
    { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    { name: "Support", href: "/dashboard/support", icon: LifeBuoy },
  ];

  const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Folders },
    { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Payments", href: "/admin/payments", icon: Ticket },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Chat", href: "/admin/chat", icon: MessageSquare },
    { name: "Subscriptions", href: "/admin/subscriptions", icon: Repeat },
    { name: "Downloads", href: "/admin/downloads", icon: DownloadCloud },
    { name: "Courses", href: "/admin/courses", icon: BookOpen },
    { name: "News", href: "/admin/blog", icon: FileText },
    { name: "Pages", href: "/admin/pages", icon: FileText },
    { name: "SEO", href: "/admin/seo", icon: Globe },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Staff", href: "/admin/staff", icon: UserCircle },
  ];

  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isPublic = !isDashboard && !isAdmin;

  const getActiveState = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin" || pathname === "/admin/dashboard";
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    if (href === "/store") return pathname === "/store";
    return pathname === href || pathname.startsWith(href + "/");
  };


  return (
    <>
      <button 
        onClick={toggleDrawer}
        aria-label="Open menu"
        className="lg:hidden p-2 text-slate-700 hover:text-slate-900 transition-colors rounded-xl hover:bg-slate-100 flex items-center justify-center active:scale-95 cursor-pointer"
      >
        <Menu className="h-6 w-6" />
      </button>

      {mounted && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/60 z-[100] lg:hidden backdrop-blur-[4px] transition-opacity duration-300 ${
              isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div 
            ref={drawerRef}
            className={`fixed top-0 left-0 h-[100dvh] w-[300px] sm:w-[350px] md:w-[380px] max-w-[86vw] bg-slate-950 z-[110] shadow-2xl rounded-r-3xl border-r border-slate-800 transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 shrink-0 h-[72px] border-b border-slate-800/60">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="The Valid Market Logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-xl shrink-0 shadow-sm object-cover"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-white leading-none">The Valid Market</span>
                  <span className="text-[10px] uppercase tracking-widest text-primary/90 mt-1 font-semibold">
                    {isAdmin ? "Admin" : isDashboard ? "Customer Dashboard" : "Main"}
                  </span>
                </div>
              </div>
              <button 
                onClick={closeDrawer} 
                aria-label="Close menu" 
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full flex flex-col pb-4">
              
              {/* User Profile Card */}
              {session?.user ? (
                <div className="px-4 py-4 shrink-0">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                      {session.user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-white truncate">{session.user.name || "User"}</div>
                      <div className="text-[11px] text-slate-400 truncate mb-1">{session.user.email}</div>
                      {session.user.accountId && (
                        <div 
                          onClick={handleCopyId}
                          className="flex items-center gap-1.5 w-fit px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded cursor-pointer transition-colors"
                          title="Copy User ID"
                        >
                          <span>ID: {session.user.accountId}</span>
                          {copiedId ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2.5 h-2.5 text-slate-500" />}
                        </div>
                      )}
                    </div>
                    {(isDashboard || isPublic) && (
                      <Link href="/dashboard/profile" onClick={closeDrawer} className="p-1.5 text-slate-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 shrink-0">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-white truncate">Guest</div>
                      <div className="text-[11px] text-slate-400 truncate">Welcome to Market</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Sections */}
              <div className="flex-1 flex flex-col space-y-4">
                
                {/* PUBLIC MODE */}
                {isPublic && (
                  <div className="px-2">
                    <div className="px-4 pb-2">
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Main Navigation</h3>
                    </div>
                    <ul className="flex flex-col space-y-0.5">
                      {dynamicNavLinks.map((link) => (
                        <div key={link.name}>
                          <NavItem link={link} isActive={getActiveState(link.href)} onClick={closeDrawer} />
                          {link.children && link.children.length > 0 && (
                            <div className="pl-6 flex flex-col space-y-0.5 mt-0.5">
                              {link.children.map((child: any) => (
                                <NavItem key={child.name || child.label} link={{ name: child.label, href: child.url, icon: ChevronRight }} isActive={getActiveState(child.url)} onClick={closeDrawer} />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DASHBOARD MODE */}
                {isDashboard && (
                  <>
                    <div className="px-2">
                      <div className="px-4 pb-2">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dashboard</h3>
                      </div>
                      <ul className="flex flex-col space-y-0.5">
                        {dashboardLinks.map((link) => (
                          <NavItem key={link.name} link={link} isActive={getActiveState(link.href)} onClick={closeDrawer} />
                        ))}
                      </ul>
                    </div>
                    
                    <div className="px-4 py-2">
                      <div className="h-px bg-slate-800/60 w-full" />
                    </div>
                    
                    <div className="px-2">
                      <div className="px-4 pb-2">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Store</h3>
                      </div>
                      <ul className="flex flex-col space-y-0.5 opacity-90">
                        {dynamicNavLinks.map((link) => (
                          <div key={link.name}>
                            <NavItem link={link} isActive={getActiveState(link.href)} onClick={closeDrawer} />
                          </div>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* ADMIN MODE */}
                {isAdmin && (
                  <div className="px-2">
                    <div className="px-4 pb-2">
                      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Management</h3>
                    </div>
                    <ul className="flex flex-col space-y-0.5">
                      {adminLinks.map((link) => (
                        <NavItem key={link.name} link={link} isActive={getActiveState(link.href)} onClick={closeDrawer} />
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Account Footer */}
            <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md p-3">
              <div className="px-2 mb-1.5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account</h3>
              </div>
              <ul className="flex flex-col space-y-0.5 px-1">
                {session?.user ? (
                  <>
                    {isPublic && (
                      <NavItem 
                        link={{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }} 
                        isActive={getActiveState("/dashboard")} 
                        onClick={closeDrawer}
                      />
                    )}
                    <NavItem 
                      link={{ name: "Security", href: "/dashboard/security", icon: ShieldCheck }} 
                      isActive={getActiveState("/dashboard/security")} 
                      onClick={closeDrawer}
                    />
                    
                    {/* Hacker Mode Toggle in Mobile */}
                    <div className="px-3 py-1 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                      <ThemeToggle variant="dropdown-item" />
                    </div>

                    <li>
                      <button 
                        onClick={() => { closeDrawer(); window.location.href = '/api/auth/signout'; }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-red-400 hover:bg-red-400/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        <LogOut className="h-4 w-4 text-red-400/80" />
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <NavItem 
                      link={{ name: "Login", href: "/login", icon: User }} 
                      isActive={getActiveState("/login")} 
                      onClick={closeDrawer}
                    />
                    <li>
                      <Link 
                        href="/register"
                        onClick={closeDrawer}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <UserCircle className="h-4 w-4 text-primary/80" />
                        Create Account
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            
          </div>
        </>, document.body
      )}
    </>
  );
}
