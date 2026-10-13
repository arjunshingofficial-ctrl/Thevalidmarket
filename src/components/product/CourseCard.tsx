"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Check, Heart, User } from "lucide-react";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { formatUsd } from "@/lib/currency";
import { normalizeImageUrl } from "@/lib/storage/client";

export default function CourseCard({ course }: { course: any }) {
  const [added, setAdded] = useState(false);

  if (!course || !course.id) return null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const price = course.salePrice ?? course.price ?? 0;
    const metadata = course.metadata ? (typeof course.metadata === 'string' ? JSON.parse(course.metadata) : course.metadata) : {};
    
    addToCart({
      id: course.id,
      name: course.name,
      slug: course.slug,
      price,
      image: metadata.image
    });
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Wishlist feature coming soon.");
  };

  const metadata = course.metadata ? (typeof course.metadata === 'string' ? JSON.parse(course.metadata) : course.metadata) : {};
  // Prefer thumbnailUrl from Course record, fallback to metadata.image
  const image = course.course?.thumbnailUrl || metadata.image || null;
  const categoryName = course.category?.name || (typeof course.category === 'string' ? course.category : "Course");
  
  // Extract custom fields if any
  let instructor = "Instructor";
  if (course.fieldValues) {
    const authorField = course.fieldValues.find((fv: any) => fv.field?.slug === "author" || fv.field?.name?.toLowerCase() === "instructor" || fv.field?.name?.toLowerCase() === "author");
    if (authorField && authorField.value) {
      instructor = authorField.value;
    }
  }

  const price = course.salePrice ?? course.price ?? 0;
  const originalPrice = course.price ?? 0;
  const isOnSale = Boolean(course.salePrice && course.salePrice < course.price);

  // Ratings
  const reviews = course.reviews || [];
  const approvedReviews = reviews.filter((r: any) => r.status === "APPROVED" || r.rating !== undefined);
  const avgRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length 
    : 0;
  const reviewCount = approvedReviews.length;

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 relative">
      
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        <div className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-widest border border-white/20">
          {categoryName}
        </div>
        {isOnSale && (
          <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-widest">
            Sale
          </div>
        )}
      </div>

      <button 
        onClick={handleWishlist} 
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/50 backdrop-blur-md text-slate-500 hover:text-rose-500 hover:bg-white shadow-sm transition-all"
        aria-label="Add to wishlist"
      >
        <Heart className="w-4 h-4" />
      </button>

      {/* Image Container (16:9) */}
      <Link href={`/courses/${course.slug}`} className="relative aspect-video bg-slate-100 block overflow-hidden border-b border-slate-100">
        {image ? (
          <Image
            src={normalizeImageUrl(image)}
            alt={course.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 transition-transform duration-700 group-hover:scale-105">
            <div className="h-10 w-10 rounded-full bg-white/50 flex items-center justify-center mb-2 shadow-sm">
              <span className="text-slate-400 font-bold">No Image</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </Link>
      
      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <Link href={`/courses/${course.slug}`} className="font-bold text-slate-900 leading-snug tracking-tight line-clamp-2 hover:text-primary transition-colors text-lg">
          {course.name}
        </Link>
        
        {/* Instructor */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
            <User className="h-3 w-3 text-slate-400" />
          </div>
          <span className="truncate">By {instructor}</span>
        </div>

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-500">
              <Star className="h-4 w-4 fill-current" />
            </div>
            <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({reviewCount})</span>
          </div>
        )}
        
        {/* Footer: Price & Add to Cart */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            {isOnSale ? (
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-900">{formatUsd(price)}</span>
                <span className="text-sm font-medium text-slate-400 line-through">{formatUsd(originalPrice)}</span>
              </div>
            ) : (
              <span className="font-black text-xl text-slate-900">{formatUsd(price)}</span>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            className={`flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-300 font-semibold text-sm shadow-sm ${
              added 
                ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-primary/20 hover:-translate-y-0.5"
            }`} 
          >
            {added ? (
              <>
                <Check className="h-4 w-4 mr-1.5" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1.5" /> Join Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
