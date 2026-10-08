"use client";

import Link from "next/link";
import { ShoppingCart, Star, Check, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatUsd } from "@/lib/currency";
import { normalizeImageUrl } from "@/lib/storage/client";

export default function ProductCard({ product }: { product: any }) {
  const [added, setAdded] = useState(false);

  if (!product || !product.id) return null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const price = product.salePrice ?? product.price ?? 0;
    const metadata = product.metadata ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata) : {};
    
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: metadata.image
    });
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const metadata = product.metadata ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata) : {};
  const image = metadata.image || null;
  // Account for both populated category relation (product.category.name) and raw format (product.category)
  const categoryName = product.category?.name || (typeof product.category === 'string' ? product.category : "Product");
  const price = product.salePrice ?? product.price ?? 0;
  const originalPrice = product.price ?? 0;
  const isOnSale = Boolean(product.salePrice && product.salePrice < product.price);

  const reviews = product.reviews || [];
  const hasReviews = reviews.length > 0;
  const avgRating = hasReviews ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length : 0;
  
  const isCourse = categoryName.toLowerCase() === "courses" || categoryName.toLowerCase() === "course";

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 relative">
      
      {/* Sale Badge */}
      {isOnSale && (
        <div className="absolute top-3 right-3 z-10 bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          Sale
        </div>
      )}

      {/* Image Container */}
      <Link href={`/product/${product.slug}`} className="relative aspect-video bg-slate-50 block overflow-hidden">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={normalizeImageUrl(image)} 
            alt={product.name} 
            className="object-cover object-center w-full h-full transition-transform duration-700 group-hover:scale-105" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 transition-transform duration-700 group-hover:scale-105">
            <span className="text-slate-400 font-medium text-xs tracking-wide">No Image Available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </Link>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex justify-between items-center">
          <div className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
            {categoryName}
          </div>
          {hasReviews ? (
            <div className="flex items-center text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-full" title={`${reviews.length} reviews`}>
              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
              {avgRating.toFixed(1)}
              <span className="text-[10px] text-amber-600/70 ml-1">({reviews.length})</span>
            </div>
          ) : (
            <div className="text-[10px] font-medium text-slate-400">
              No ratings yet
            </div>
          )}
        </div>
        
        <Link href={`/product/${product.slug}`} className="font-semibold text-slate-900 leading-snug tracking-tight line-clamp-2 hover:text-primary transition-colors text-[15px] mt-1">
          {product.name}
        </Link>
        
        <div className="mt-auto pt-5 flex items-center justify-between">
          <div className="flex flex-col">
            {isOnSale && (
              <span className="text-[11px] font-medium text-slate-400 line-through mb-0.5">
                {formatUsd(originalPrice)}
              </span>
            )}
            <span className={`font-black text-lg ${isOnSale ? "text-rose-600" : "text-slate-900"}`}>
              {formatUsd(price)}
            </span>
          </div>
          
          {isCourse ? (
            <button 
              onClick={handleAddToCart}
              className={`flex items-center justify-center h-10 px-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm whitespace-nowrap ${
                added 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/20 hover:-translate-y-0.5"
              }`} 
            >
              {added ? <><Check className="h-4 w-4 mr-1.5" /> Added</> : "Join Now"}
            </button>
          ) : (
            <button 
              onClick={handleAddToCart}
              className={`flex items-center justify-center h-10 px-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm whitespace-nowrap ${
                added 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/20 hover:-translate-y-0.5"
              }`} 
            >
              {added ? <><Check className="h-4 w-4 mr-1.5" /> Added</> : <><ShoppingCart className="h-4 w-4 mr-1.5" /> Buy Now</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
