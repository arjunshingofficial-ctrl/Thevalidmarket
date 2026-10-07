"use client";

import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatUsd } from "@/lib/currency";

export default function RDPProductCard({ product }: { product: any }) {
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
  const specs = metadata.specs || {};
  const badge = metadata.badge;
  const price = product.salePrice ?? product.price ?? 0;

  return (
    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#0088cc]/50 relative">
      
      {badge && (
        <div className="absolute top-3 right-3 z-10 bg-[#0088cc] text-white text-[10px] font-bold px-2.5 py-1 rounded-sm shadow-sm tracking-wider uppercase">
          {badge}
        </div>
      )}

      {/* Image Container 16:9 */}
      <Link href={`/product/${product.slug}`} className="relative aspect-video bg-slate-900 block overflow-hidden border-b border-slate-100">
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={image} 
            alt={product.name} 
            className="object-cover object-center w-full h-full opacity-90 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800 transition-transform duration-700 group-hover:scale-105">
            <span className="text-slate-400 font-medium text-xs tracking-wide">SERVER IMAGE</span>
          </div>
        )}
      </Link>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <Link href={`/product/${product.slug}`} className="font-bold text-slate-900 text-[16px] leading-tight hover:text-[#0088cc] transition-colors mb-4">
          {product.name}
        </Link>
        
        {/* Specs */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-5 mt-auto">
          {specs.cpu && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">CPU</span>
              <span className="text-xs text-slate-700 font-medium">{specs.cpu}</span>
            </div>
          )}
          {specs.ram && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">RAM</span>
              <span className="text-xs text-slate-700 font-medium">{specs.ram}</span>
            </div>
          )}
          {specs.storage && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Storage</span>
              <span className="text-xs text-slate-700 font-medium">{specs.storage}</span>
            </div>
          )}
          {specs.os && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">OS</span>
              <span className="text-xs text-slate-700 font-medium">{specs.os}</span>
            </div>
          )}
        </div>
        
        {/* Price & Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline">
            <span className="font-black text-xl text-slate-900">{formatUsd(price)}</span>
            <span className="text-xs text-slate-500 ml-1 font-medium">/month</span>
          </div>
          
          <button 
            onClick={handleAddToCart}
            className={`flex items-center justify-center h-9 px-3 rounded-md text-xs font-bold transition-all duration-200 ${
              added 
                ? "bg-emerald-500 text-white" 
                : "bg-slate-900 text-white hover:bg-[#0088cc]"
            }`} 
          >
            {added ? <Check className="h-4 w-4" /> : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
