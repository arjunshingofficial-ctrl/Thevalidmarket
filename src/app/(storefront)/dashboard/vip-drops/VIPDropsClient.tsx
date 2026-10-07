"use client";

import { useState } from "react";
import { Sparkles, Download, Gift, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { addToCart } from "@/lib/cart";
import { useRouter } from "next/navigation";

export default function VIPDropsClient({ drops, isAdmin }: { drops: any[], isAdmin: boolean }) {
  const router = useRouter();

  const handleClaim = (product: any) => {
    // Treat it as a free purchase and add to cart with $0
    addToCart({ 
      id: product.id, 
      name: product.name, 
      slug: product.slug, 
      price: 0, // It's free!
      image: "" 
    });
    router.push("/checkout");
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white relative overflow-hidden group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-300" />
            VIP Free Drops
          </h1>
          <p className="text-indigo-100 mt-2 text-lg max-w-xl">
            Welcome to the VIP club! Enjoy your exclusive access to free premium software, courses, and digital assets updated daily.
          </p>
        </div>
        
        {isAdmin && (
          <div className="relative z-10 shrink-0">
            <Link 
              href="/admin/products/new"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-white/20"
            >
              <ShieldCheck className="w-4 h-4" />
              Add Drop (Admin)
            </Link>
            <p className="text-xs text-indigo-200 mt-2 text-right">
              Assign products to category slug: <strong>vip-drops</strong>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> Available Now
        </h2>
        
        {drops.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Check back later!</h3>
            <p className="text-slate-500 mt-1 max-w-sm mx-auto">
              There are no new VIP drops available at the moment. We update these regularly, so keep an eye out!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {drops.map((drop) => (
              <div key={drop.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold mb-3 border border-indigo-100">
                      <Sparkles className="w-3 h-3" /> VIP EXCLUSIVE
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{drop.name}</h3>
                  </div>
                </div>
                
                <p className="text-slate-500 text-sm mb-6 flex-1">
                  {drop.shortDesc || "Exclusive VIP content. Click to claim and download your free copy immediately."}
                </p>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-xs font-bold line-through">${drop.price.toFixed(2)}</span>
                    <span className="text-sm font-black text-emerald-600 ml-1">FREE</span>
                  </div>
                  <button 
                    onClick={() => handleClaim(drop)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    Claim Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
