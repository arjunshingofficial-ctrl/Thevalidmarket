"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Check, Sparkles, Plus, RotateCcw } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { logAddToCartAction } from "@/lib/actions/analytics";

export default function AddToCartButton({ product }: { product: any }) {
  const [added, setAdded] = useState(false);
  const [quantityAdded, setQuantityAdded] = useState(0);

  // Fallback if product is undefined/invalid
  if (!product || !product.id) {
    return (
      <button disabled className="w-full h-12 rounded-xl font-semibold text-base bg-slate-200 text-slate-500 cursor-not-allowed">
        Unavailable
      </button>
    );
  }

  const handleAdd = () => {
    const price = product.salePrice ?? product.price ?? 0;
    const metadata = product.metadata ? (typeof product.metadata === "string" ? JSON.parse(product.metadata) : product.metadata) : {};
    
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: metadata.image
    });

    logAddToCartAction(product.id, 1);
    
    setAdded(true);
    setQuantityAdded(prev => prev + 1);
  };

  if (added) {
    return (
      <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
        {/* Stylish Checkout Button */}
        <Link
          href="/checkout"
          className="stylish-btn btn-emerald btn-lg w-full flex items-center justify-between text-base font-extrabold shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 py-3.5 px-6 rounded-xl transition-all"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>⚡ Proceed to Checkout</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-white bg-white/20 px-2 py-0.5 rounded-md text-sm">
            Checkout <ArrowRight className="w-4 h-4" />
          </span>
        </Link>

        {/* Action / Context Row */}
        <div className="flex items-center justify-between text-xs px-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Added to Cart {quantityAdded > 1 ? `(${quantityAdded})` : ""}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium hover:underline cursor-pointer"
              title="Add one more to cart"
            >
              <Plus className="w-3.5 h-3.5" /> Add another
            </button>
            <span className="text-slate-300">|</span>
            <Link
              href="/cart"
              className="text-primary hover:underline font-semibold"
            >
              View Cart →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={handleAdd}
      className="w-full h-12 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25 active:scale-[0.99] cursor-pointer"
    >
      <ShoppingCart className="h-5 w-5" /> 
      {product?.type === "COURSE" || product?.category?.slug === "courses" ? "Join Now & Add to Cart" : "Add to Cart"}
    </button>
  );
}
