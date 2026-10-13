"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight, X, Sparkles, CheckCircle2 } from "lucide-react";
import { CartItem } from "@/lib/cart";
import { normalizeImageUrl } from "@/lib/storage/client";

export default function QuickCheckoutToast() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [lastItem, setLastItem] = useState<Partial<CartItem> | null>(null);

  // Automatically hide if user navigates to checkout or payment page
  useEffect(() => {
    if (pathname && (pathname.startsWith("/checkout") || pathname.startsWith("/payment"))) {
      setVisible(false);
    }
  }, [pathname]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleAdded = (event: Event) => {
      // Never pop up if already on checkout or payment page
      if (window.location.pathname.startsWith("/checkout") || window.location.pathname.startsWith("/payment")) {
        return;
      }

      const customEvent = event as CustomEvent<{ item: Partial<CartItem> }>;
      const item = customEvent.detail?.item;
      if (item) {
        setLastItem(item);
        setVisible(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          setVisible(false);
        }, 7000);
      }
    };

    window.addEventListener("item-added-to-cart", handleAdded);
    return () => {
      window.removeEventListener("item-added-to-cart", handleAdded);
      clearTimeout(timeout);
    };
  }, []);

  // Do not render anything when on checkout or payment page
  if (pathname && (pathname.startsWith("/checkout") || pathname.startsWith("/payment"))) {
    return null;
  }

  if (!visible || !lastItem) return null;

  return (
    <div className="fixed bottom-5 right-5 sm:right-6 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 text-white rounded-2xl p-4 shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Added to Your Cart
            </span>
          </div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-800"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Info */}
        <div className="flex items-center gap-3 mb-3.5">
          {lastItem.image ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 border border-slate-700">
              <Image
                src={normalizeImageUrl(lastItem.image)}
                alt={lastItem.name || "Product"}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{lastItem.name}</p>
            <p className="text-xs text-slate-300 font-semibold mt-0.5">
              ${Number(lastItem.price || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <Link
            href="/cart"
            onClick={() => setVisible(false)}
            className="flex-1 py-2 px-3 text-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition-colors border border-slate-700/50"
          >
            View Cart
          </Link>

          <Link
            href="/checkout"
            onClick={() => setVisible(false)}
            className="stylish-btn btn-emerald btn-sm flex-[1.6] flex items-center justify-center gap-1.5 text-xs font-bold shadow-md shadow-emerald-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
