"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, Globe, Star, Package } from "lucide-react";
import { addToCart } from "@/lib/cart";

function BuyButton({ product }: { product: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    const price = product.salePrice ?? product.price ?? 0;
    let image = "";
    try { image = product.metadata ? JSON.parse(product.metadata).image || "" : ""; } catch {}
    addToCart({ id: product.id, name: product.name, slug: product.slug, price, image });
    router.push("/checkout");
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      aria-label={`Buy ${product.name} now`}
      className="inline-flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold bg-amber-400 text-amber-950 hover:bg-amber-500 transition-all hover:shadow-md hover:shadow-amber-500/20 active:translate-y-0 disabled:opacity-70 whitespace-nowrap"
    >
      <ShoppingCart className="h-4 w-4" />
      <span>Buy Now</span>
    </button>
  );
}

function ProductRating({ reviews }: { reviews?: Array<{ rating: number }> }) {
  if (!reviews || reviews.length === 0) {
    return <span className="text-xs text-slate-400">No reviews</span>;
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {avg.toFixed(1)}
      <span className="text-slate-400 font-normal">({reviews.length})</span>
    </span>
  );
}

function getFieldValue(product: any, fieldName: string): string {
  if (!product.fieldValues) return "";
  const lower = fieldName.toLowerCase();
  const match = product.fieldValues.find(
    (fv: any) =>
      fv.field?.slug?.toLowerCase() === lower ||
      fv.field?.name?.toLowerCase() === lower
  );
  return match?.value || "";
}

function CountryBadge({ country }: { country: string }) {
  if (!country) return <span className="text-slate-400 text-[10px] md:text-sm">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-sm md:rounded-md bg-slate-100 text-slate-700 text-[10px] md:text-xs font-medium border border-slate-200">
      <Globe className="hidden sm:block h-3 w-3 text-slate-400" />
      <span className="max-w-[45px] sm:max-w-none truncate">{country}</span>
    </span>
  );
}

function PriceDisplay({ product }: { product: any }) {
  const price = product.salePrice ?? product.price;
  return (
    <div className="flex flex-col items-end leading-tight">
      {product.salePrice && (
        <span className="text-[9px] md:text-xs text-slate-400 line-through">${Number(product.price).toLocaleString("en-US")}</span>
      )}
      <span className="font-bold text-slate-900 text-[11px] md:text-base">${Number(price).toLocaleString("en-US")}</span>
    </div>
  );
}

function BBProductRow({ product, index }: { product: any; index: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const country = getFieldValue(product, "country");
  const worth = getFieldValue(product, "worth") || getFieldValue(product, "balance");
  let image = "";
  try { image = product.metadata ? JSON.parse(product.metadata).image || "" : ""; } catch {}

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // let the BuyButton handle it

    e.preventDefault();
    setLoading(true);
    const price = product.salePrice ?? product.price ?? 0;
    addToCart({ id: product.id, name: product.name, slug: product.slug, price, image });
    router.push("/checkout");
  };

  return (
    <tr onClick={handleRowClick} className={`group transition-all duration-200 cursor-pointer ${loading ? 'opacity-75 pointer-events-none' : ''}`}>
      <td className="px-2 md:px-5 py-3 md:py-4 bg-white border-y border-l border-slate-200 rounded-l-xl group-hover:border-blue-300 group-hover:bg-blue-50/50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-3 group/link">
          <div className="shrink-0 w-8 h-8 md:w-12 md:h-12 rounded md:rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors line-clamp-2 md:line-clamp-1 text-[11px] md:text-sm leading-tight">
              {product.name}
            </div>
            <div className="hidden sm:block">
              {product.reviews && <ProductRating reviews={product.reviews} />}
            </div>
          </div>
        </div>
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 shadow-sm">
        <CountryBadge country={country} />
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 shadow-sm">
        {worth ? (
          <span className="font-mono text-[11px] md:text-sm font-bold text-slate-800">
            ${Number(worth).toLocaleString("en-IN")}
          </span>
        ) : (
          <span className="text-slate-400 text-[11px] md:text-sm">—</span>
        )}
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 text-right shadow-sm">
        <PriceDisplay product={product} />
      </td>
      <td className="px-1 md:px-5 py-3 md:py-4 bg-white border-y border-r border-slate-200 rounded-r-xl group-hover:border-blue-300 group-hover:bg-blue-50/50 text-right shadow-sm">
        <BuyButton product={product} />
      </td>
    </tr>
  );
}

export default function BBProductTable({ products }: { products: any[] }) {
  return (
    <div className="w-full mt-6">
      <div className="overflow-hidden w-full">
        <table className="w-full text-left border-separate border-spacing-y-2.5" role="table">
          <thead>
            <tr className="bg-slate-900 text-slate-300 shadow-sm">
              <th scope="col" className="px-2 md:px-5 py-3 md:py-4 text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest rounded-l-xl">PRODUCT</th>
              <th scope="col" className="px-1 md:px-5 py-3 md:py-4 text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest">COUNTRY</th>
              <th scope="col" className="px-1 md:px-5 py-3 md:py-4 text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest">BALANCE</th>
              <th scope="col" className="px-1 md:px-5 py-3 md:py-4 text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest text-right">PRICE</th>
              <th scope="col" className="px-1 md:px-5 py-3 md:py-4 text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest text-right rounded-r-xl">BUY</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <BBProductRow key={p.id} product={p} index={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
