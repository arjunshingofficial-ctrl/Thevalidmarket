"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { logAddToCartAction } from "@/lib/actions/analytics";

export default function AddToCartButton({ product }: { product: any }) {
  const [added, setAdded] = useState(false);

  // Fallback if product is undefined/invalid
  if (!product || !product.id) {
    return (
      <button disabled className="w-full h-12 rounded-lg font-semibold text-lg bg-slate-200 text-slate-500 cursor-not-allowed">
        Unavailable
      </button>
    );
  }

  const handleAdd = () => {
    const price = product.salePrice ?? product.price ?? 0;
    const metadata = product.metadata ? JSON.parse(product.metadata) : {};
    
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: metadata.image
    });

    logAddToCartAction(product.id, 1);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button 
      onClick={handleAdd}
      className={`w-full h-12 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-sm
        ${added 
          ? "bg-emerald-500 text-white" 
          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
        }`}
    >
      <ShoppingCart className="h-5 w-5" /> 
      {added ? "Added to Cart" : (product?.type === "COURSE" || product?.category?.slug === "courses" ? "Join Now" : "Add to Cart")}
    </button>
  );
}
