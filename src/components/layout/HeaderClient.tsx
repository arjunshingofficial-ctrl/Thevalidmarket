"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, User } from "lucide-react";
import CartIcon from "./CartIcon";
import MobileNav from "./MobileNav";
import DesktopNav from "./DesktopNav";
import AccountDropdown from "./AccountDropdown";
import { NotificationBell } from "./NotificationBell";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function HeaderClient({ session, menuItems, walletBalance }: { session: any, menuItems: any, walletBalance?: any }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/store?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/50 py-2" 
          : "bg-white border-b border-slate-200 py-3"
      }`}
    >
      <div className="container max-w-[1440px] mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8">
        
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group z-10">
            <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-primary transition-colors hidden sm:block">
              Asia D Market
            </span>
          </Link>
          
          <DesktopNav items={menuItems} />
        </div>

        {/* Right: Search, Cart, Account */}
        <div className="flex items-center gap-4 lg:gap-6 z-10">
          
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex relative group"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="search"
              placeholder="Search products, courses & tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-[320px] xl:w-[360px] rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
            />
          </form>

          <CartIcon />

          <div className="hidden md:block">
            {session?.user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <AccountDropdown user={session.user} walletBalance={walletBalance} />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link href="/register" className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-full hover:bg-primary/90 transition-colors shadow-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <MobileNav session={session} menuItems={menuItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
