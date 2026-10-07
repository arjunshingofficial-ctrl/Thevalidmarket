"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown, ShoppingBag, Download, Star, Settings, LayoutDashboard, Wallet, Copy, Check } from "lucide-react";
import { signOut } from "next-auth/react";
import { formatUsd } from "@/lib/currency";
import ThemeToggle from "./ThemeToggle";

export default function AccountDropdown({ user, walletBalance }: { user: { name?: string | null, email?: string | null, image?: string | null, accountId?: string | null }, walletBalance?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = user.name?.split(" ")[0] || "User";

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.accountId) {
      navigator.clipboard.writeText(user.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border bg-white p-1 pr-3 shadow-sm hover:shadow-md transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {user.image ? (
          <img src={user.image} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {firstName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 hidden xl:block">{firstName}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Content */}
      <div 
        className={`absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white shadow-xl transition-all origin-top-right z-50 ${
          isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
        }`}
      >
        <div className="p-4 border-b">
          <p className="font-semibold text-slate-900 truncate">{user.name || "User"}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5 mb-2">{user.email}</p>
          
          {user.accountId && (
            <div 
              onClick={handleCopyId}
              className="flex items-center gap-1.5 w-fit px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono rounded cursor-pointer transition-colors"
              title="Copy User ID"
            >
              <span>ID: {user.accountId}</span>
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </div>
          )}
          
          {walletBalance && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Wallet</span>
              <span className="text-sm font-bold text-primary">{formatUsd(walletBalance.total)}</span>
            </div>
          )}
        </div>
        
        <div className="p-2 flex flex-col gap-1">
          <ThemeToggle variant="dropdown-item" onClick={() => setIsOpen(false)} />
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/dashboard/wallet" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <Wallet className="w-4 h-4" />
            My Wallet
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <ShoppingBag className="w-4 h-4" />
            Orders
          </Link>
          <Link href="/dashboard/downloads" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <Download className="w-4 h-4" />
            Downloads
          </Link>
          <Link href="/dashboard/reviews" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <Star className="w-4 h-4" />
            Reviews
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
            <Settings className="w-4 h-4" />
            Profile
          </Link>
        </div>
        
        <div className="p-2 border-t">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
