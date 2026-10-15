"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
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
        <p className="text-xs text-slate-500">
          Copyright &copy; 2026 The Valid Market. All rights reserved. Verified Digital Marketplace.
        </p>
      </div>
    </footer>
  );
}
