"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

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
      {/* Main Image */}
      <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border flex items-center justify-center relative">
        {mainImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={mainImage} alt={productName} className="object-cover w-full h-full transition-all" />
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
              onClick={() => setMainImage(img)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${mainImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-slate-300'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${productName} - thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
