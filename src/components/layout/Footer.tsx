"use client";

import Image from "next/image";
import Link from "next/link";
import { Send } from "lucide-react";

export function Footer({ telegramUrl = "https://t.me/+xpN22t7nSkk4ZWJl" }: { telegramUrl?: string }) {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 py-8 text-center">
      <div className="container max-w-[1440px] mx-auto px-4 flex flex-col items-center justify-center gap-3">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="The Valid Market Logo"
            width={28}
            height={28}
            className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform"
          />
          <span className="text-sm font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            The Valid Market
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 py-1">
          <Link href="/store" className="hover:text-white transition-colors">Store</Link>
          <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
          <Link href="/news" className="hover:text-white transition-colors">News</Link>
          <Link href="/contact" className="hover:text-emerald-400 text-slate-300 font-semibold transition-colors">Contact Us</Link>
          <Link href="/chat" className="hover:text-white transition-colors">VIP Chat</Link>
          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#0088cc] hover:text-[#33a3dc] font-bold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram Support</span>
            </a>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Copyright &copy; 2026 The Valid Market. All rights reserved. Verified Digital Marketplace.
        </p>
      </div>
    </footer>
  );
}
