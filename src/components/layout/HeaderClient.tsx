"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, User, Sparkles, Loader2 } from "lucide-react";
import CartIcon from "./CartIcon";
import { addToCart } from "@/lib/cart";
import MobileNav from "./MobileNav";
import DesktopNav from "./DesktopNav";
import AccountDropdown from "./AccountDropdown";
import { NotificationBell } from "./NotificationBell";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function HeaderClient({ session, menuItems, walletBalance }: { session: any, menuItems: any, walletBalance?: any }) {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [buyingVip, setBuyingVip] = useState(false);
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

  const handleBuyVip = () => {
    setBuyingVip(true);
    addToCart({ 
      id: "vip-access", 
      name: "VIP Access (1 Month)", 
      slug: "vip-access", 
      price: 10, 
      image: "" 
    });
    router.push("/checkout");
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 flex flex-col ${
        scrolled 
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/50" 
          : "bg-white border-b border-slate-200"
      }`}
    >
      {/* Top VIP Promo Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="container max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm relative z-10">
          <div className="flex items-center gap-2 font-medium text-center sm:text-left">
            <Sparkles className="h-4 w-4 text-yellow-300 shrink-0" />
            <span><strong className="font-bold hidden sm:inline">Daily Free Drops:</strong> Get instant access to VIP exclusive products for just $10/month.</span>
          </div>
          <button 
            onClick={handleBuyVip}
            disabled={buyingVip}
            className="bg-white text-indigo-700 px-4 py-1.5 rounded-full font-bold text-[11px] sm:text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all whitespace-nowrap disabled:opacity-70 flex items-center justify-center min-w-[100px]"
          >
            {buyingVip ? <Loader2 className="w-3 h-3 animate-spin" /> : "Join VIP for $10"}
          </button>
        </div>
      </div>

      <div className={`container max-w-[1440px] mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 transition-all ${scrolled ? "py-2" : "py-3"}`}>
        
        {/* Left: Brand + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group z-10">
            <Image
              src="/logo.png"
              alt="The Valid Market Logo"
              width={36}
              height={36}
              className="w-9 h-9 rounded-xl shadow-sm group-hover:scale-105 transition-transform object-cover"
              priority
            />
            <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-primary transition-colors hidden sm:block">
              The Valid Market
            </span>
          </Link>
          
          <DesktopNav items={menuItems} />
        </div>

        {/* Right: Search, Cart, Account, Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 z-10">
          
          <form 
            onSubmit={handleSearch}
            className="hidden sm:flex relative group"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="search"
              placeholder="Search store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 md:h-10 w-36 sm:w-48 md:w-52 lg:w-64 xl:w-80 rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs md:text-sm outline-none transition-all focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 font-medium"
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
              <div className="flex items-center gap-2 lg:gap-3">
                <Link href="/login" className="text-xs md:text-sm font-medium text-slate-600 hover:text-primary transition-colors px-2 py-1">
                  Login
                </Link>
                <Link href="/register" className="text-xs md:text-sm font-medium bg-primary text-white px-3.5 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <div className="lg:hidden flex items-center">
            <MobileNav session={session} menuItems={menuItems} />
          </div>
        </div>
      </div>
    </header>
  );
}
