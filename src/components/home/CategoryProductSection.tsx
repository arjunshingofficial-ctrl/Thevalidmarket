import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingCart, Star } from "lucide-react";
import { normalizeImageUrl } from "@/lib/storage/client";
import { formatUsd } from "@/lib/currency";

function ProductRating({ reviews }: { reviews: Array<{ rating: number }> }) {
  if (!reviews || reviews.length === 0) {
    return null;
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <span className="text-xs font-semibold text-slate-700">{avg.toFixed(1)}</span>
      <span className="text-xs text-slate-400">({reviews.length})</span>
    </div>
  );
}

function CategoryProductCard({ product }: { product: any }) {
  if (!product?.id) return null;

  const metadata = (() => {
    try { return product.metadata ? JSON.parse(product.metadata) : {}; }
    catch { return {}; }
  })();
  const image = metadata.image || null;
  const price = product.salePrice ?? product.price;
  const reviews: Array<{ rating: number }> = product.reviews || [];

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden bg-slate-50 w-full aspect-video" style={{ aspectRatio: "16 / 9" }}>
        {image ? (
          <Image
            src={normalizeImageUrl(image)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
            <ShoppingCart className="h-10 w-10 opacity-40" />
            <span className="text-xs font-medium text-slate-400">No image</span>
          </div>
        )}
        {product.salePrice && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-[11px] font-bold rounded-lg uppercase tracking-wide">
            Sale
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="text-[11px] font-bold text-primary/70 uppercase tracking-widest">
          {product.category?.name || "Product"}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-primary transition-colors text-sm"
        >
          {product.name}
        </Link>

        <ProductRating reviews={reviews} />

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
          <div className="flex flex-col">
            {product.salePrice && (
              <span className="text-xs text-slate-400 line-through">{formatUsd(product.price)}</span>
            )}
            <span className="font-bold text-slate-900">{formatUsd(price)}</span>
          </div>
          <Link
            href={`/product/${product.slug}`}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

interface CategoryProductSectionProps {
  category: any;
  products: any[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  showViewAll?: boolean;
  viewAllLabel?: string;
}

export function CategoryProductSection({
  category,
  products,
  sectionTitle,
  sectionSubtitle,
  showViewAll = true,
  viewAllLabel = "View All",
}: CategoryProductSectionProps) {
  // Hide if no published products
  if (!category || !products || products.length === 0) return null;

  const title = sectionTitle || category.name;
  const viewAllHref = `/category/${category.slug}`;

  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="container max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-[11px] font-bold text-primary/60 uppercase tracking-widest mb-1">
              {category.name}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {sectionSubtitle && (
              <p className="text-slate-500 mt-2 text-sm max-w-xl">{sectionSubtitle}</p>
            )}
          </div>
          {showViewAll && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              {viewAllLabel} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Subtle divider */}
        <div className="w-12 h-0.5 bg-primary/30 rounded-full mb-8" />

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any) => (
            <CategoryProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
