"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Home, 
  ArrowLeft, 
  GraduationCap, 
  Cpu, 
  ShieldCheck, 
  ShoppingBag, 
  Sparkles, 
  MessageCircle, 
  Zap, 
  Lock, 
  Compass,
  ArrowRight
} from "lucide-react";

export default function NotFoundView() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/store?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickSearch = (keyword: string) => {
    router.push(`/store?q=${encodeURIComponent(keyword)}`);
  };

  const quickLinks = [
    {
      title: "Academy & Courses",
      subtitle: "Ethical hacking, exploits, OSINT & programming masterclasses",
      href: "/courses",
      icon: GraduationCap,
      badge: "Masterclasses",
      color: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/60",
      accent: "hover:border-amber-400 group-hover:text-amber-600"
    },
    {
      title: "Software & Licenses",
      subtitle: "Verified activation keys, developer tools & automation scripts",
      href: "/software",
      icon: Cpu,
      badge: "Instant Keys",
      color: "from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200/60",
      accent: "hover:border-blue-400 group-hover:text-blue-600"
    },
    {
      title: "Residential Proxies",
      subtitle: "Ultra-fast rotating residential pools, mobile & dedicated IPs",
      href: "/proxies",
      icon: ShieldCheck,
      badge: "High Speed",
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/60",
      accent: "hover:border-emerald-400 group-hover:text-emerald-600"
    },
    {
      title: "Digital Marketplace",
      subtitle: "Explore 500+ premium digital assets, tools, accounts & VIP drops",
      href: "/store",
      icon: ShoppingBag,
      badge: "500+ Drops",
      color: "from-violet-500/10 to-purple-500/10 text-violet-600 border-violet-200/60",
      accent: "hover:border-violet-400 group-hover:text-violet-600"
    },
  ];

  const popularTags = [
    "Hacking Course",
    "Residential Proxies",
    "RDP",
    "CC Checker",
    "Python Bot",
    "VIP Drops"
  ];

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 py-16 sm:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-violet-600/15 via-indigo-600/10 to-pink-500/10 blur-3xl rounded-full pointer-events-none -z-10" />
      <div className="absolute -top-12 right-10 w-96 h-96 bg-blue-500/5 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="container max-w-4xl mx-auto flex flex-col items-center text-center">
        
        {/* Status radar pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200/80 shadow-xs mb-6 animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600"></span>
          </span>
          <span>Status 404 &bull; Route Coordinates Not Found</span>
        </div>

        {/* 404 Stylized Display */}
        <div className="relative my-2">
          <div className="absolute -inset-6 bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-pink-500/15 blur-2xl rounded-full pointer-events-none" />
          <h1 className="relative font-black text-8xl sm:text-9xl md:text-[13rem] leading-none tracking-tighter bg-gradient-to-b from-slate-900 via-violet-950 to-indigo-900 bg-clip-text text-transparent select-none drop-shadow-sm">
            404
          </h1>
        </div>

        {/* Headline & Description */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight max-w-2xl mt-4 mb-3">
          Lost in the Digital Grid?
        </h2>
        <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed mb-8">
          The product, course, tool, or secret drop you were searching for has been relocated, archived, or does not exist on The Valid Market.
        </p>

        {/* Interactive Search Bar */}
        <div className="w-full max-w-xl mb-6">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <div className="absolute left-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 500+ products, courses, software & tools..."
              className="w-full pl-12 pr-28 py-3.5 text-sm rounded-2xl bg-white border border-slate-200/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl shadow-xs transition-all active:scale-95"
            >
              Search
            </button>
          </form>

          {/* Popular Tag Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-400 mr-1">Quick search:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleQuickSearch(tag)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-violet-50 hover:text-violet-700 text-slate-600 text-[11px] font-medium transition-colors border border-slate-200/60"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Core Quick-Navigation Cards */}
        <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4 mb-8 text-left">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-violet-300 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-3.5 hover:-translate-y-0.5"
              >
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} border shrink-0 transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-violet-700 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                    {item.subtitle}
                  </p>
                </div>
                <div className="self-center text-slate-300 group-hover:text-violet-600 transition-colors">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md mb-12">
          <Link
            href="/"
            className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/90 shadow-xs transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Trust Badges Bar */}
        <div className="w-full pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Instant Digital Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            <span>256-Bit Encrypted Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            <a 
              href="https://t.me/+xpN22t7nSkk4ZWJl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-violet-700 underline underline-offset-2 transition-colors"
            >
              24/7 VIP Telegram Support
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
