"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { normalizeImageUrl } from "@/lib/storage/client";

interface ProductGalleryProps {
  image: string | null;
  gallery: string[];
  productName: string;
}

export default function ProductGallery({ image, gallery, productName }: ProductGalleryProps) {
  const [mainImage, setMainImage] = useState(image || gallery[0] || null);

  const allImages: string[] = [];
  if (image) allImages.push(image);
  if (gallery && gallery.length > 0) {
    gallery.forEach(img => {
      if (img !== image && !allImages.includes(img)) allImages.push(img);
    });
  }

  return (
    <div className="space-y-4">
      {/* Main Image - Optimized with Next.js Image */}
      <div 
        className="w-full aspect-video bg-slate-100 rounded-2xl overflow-hidden border flex items-center justify-center relative shadow-sm"
        style={{ aspectRatio: "16 / 9" }}
      >
        {mainImage ? (
          <Image
            src={normalizeImageUrl(mainImage)}
            alt={productName}
            fill
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 700px, 800px"
            className="object-cover transition-all"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
            <span>No Image Available</span>
          </div>
        )}
      </div>

      {/* Gallery Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMainImage(img)}
              className={`flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all relative ${mainImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}
              style={{ aspectRatio: "16 / 9" }}
            >
              <Image
                src={normalizeImageUrl(img)}
                alt={`${productName} - thumbnail ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
