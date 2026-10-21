"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Star, X, Check } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { normalizeImageUrl } from "@/lib/storage/client";

interface SocialProduct {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  price: number;
  image: string;
  stars?: number;
}

const GLOBAL_LOCATIONS = [
  "Congo Free State, The",
  "London, United Kingdom",
  "New York, United States",
  "Frankfurt, Germany",
  "Toronto, Canada",
  "Sydney, Australia",
  "Paris, France",
  "Singapore",
  "Dubai, United Arab Emirates",
  "Zurich, Switzerland",
  "Amsterdam, Netherlands",
  "Tokyo, Japan",
  "Stockholm, Sweden",
  "Madrid, Spain",
  "Rome, Italy",
  "São Paulo, Brazil",
  "Seoul, South Korea",
  "California, United States",
  "Manchester, United Kingdom",
  "Vienna, Austria",
  "Dublin, Ireland",
  "Oslo, Norway",
  "Melbourne, Australia",
  "Brussels, Belgium",
  "Helsinki, Finland",
  "Copenhagen, Denmark",
  "Texas, United States",
  "Florida, United States",
  "Milan, Italy",
  "Vancouver, Canada",
  "Warsaw, Poland",
];

const TIME_AGO_OPTIONS = [
  "About 3 minutes ago",
  "About 7 minutes ago",
  "About 12 minutes ago",
  "About 18 minutes ago",
  "About 24 minutes ago",
  "About 27 minutes ago",
  "About 35 minutes ago",
  "About 42 minutes ago",
  "Just now",
];

export default function RecentSalesToast() {
  const pathname = usePathname();
  const [products, setProducts] = useState<SocialProduct[]>([]);
  const [currentProduct, setCurrentProduct] = useState<SocialProduct | null>(null);
  const [location, setLocation] = useState<string>("");
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [ratingPattern, setRatingPattern] = useState<number>(5); // 4 or 5 filled stars
  const [visible, setVisible] = useState<boolean>(false);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch published products on mount
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const res = await fetch("/api/store/social-proof");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.products && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error("Failed to fetch social proof products:", err);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Show a randomized notification
  const triggerNotification = () => {
    if (dismissed || products.length === 0) return;

    // Pick random product
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    // Pick random location
    const randomLocation = GLOBAL_LOCATIONS[Math.floor(Math.random() * GLOBAL_LOCATIONS.length)];
    // Pick random timestamp
    const randomTime = TIME_AGO_OPTIONS[Math.floor(Math.random() * TIME_AGO_OPTIONS.length)];
    // Pick rating: 80% 5-star, 20% 4-star (to look authentic like the reference)
    const randomRating = Math.random() > 0.25 ? 5 : 4;

    setCurrentProduct(randomProduct);
    setLocation(randomLocation);
    setTimeAgo(randomTime);
    setRatingPattern(randomRating);
    setIsAdded(false);
    setVisible(true);

    // Auto-hide after 6.5 seconds
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      scheduleNext();
    }, 6500);
  };

  const scheduleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Random interval between 14s and 26s
    const nextInterval = Math.floor(Math.random() * 12000) + 14000;
    timerRef.current = setTimeout(() => {
      triggerNotification();
    }, nextInterval);
  };

  // Initial trigger after products load
  useEffect(() => {
    if (products.length === 0 || dismissed) return;

    // Initial delay of 4.5 seconds for first popup
    const initialTimer = setTimeout(() => {
      triggerNotification();
    }, 4500);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [products.length, dismissed]);

  // Don't render if dismissed, invisible, no product, or on checkout/payment pages
  if (
    !visible ||
    !currentProduct ||
    dismissed ||
    (pathname && (pathname.startsWith("/checkout") || pathname.startsWith("/payment")))
  ) {
    return null;
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      id: currentProduct.id,
      name: currentProduct.name,
      slug: currentProduct.slug,
      price: currentProduct.price,
      image: currentProduct.image,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    setDismissed(true);
    // Suppress for 3 minutes before allowing new popups
    setTimeout(() => {
      setDismissed(false);
    }, 180000);
  };

  const imageUrl = normalizeImageUrl(currentProduct.image || "/images/cards/cards-deck.jpg");

  return (
    <div
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 max-w-[calc(100vw-2rem)] sm:max-w-[460px] animate-in fade-in slide-in-from-bottom-5 duration-300 select-none group"
      role="status"
      aria-live="polite"
    >
      {/* Pill Container matching reference screenshot */}
      <div className="relative flex items-center bg-[#070709] border border-neutral-800/90 rounded-full p-2 sm:p-2.5 pr-4 sm:pr-5 shadow-2xl shadow-black ring-1 ring-white/5 hover:border-neutral-700 transition-colors">
        
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white rounded-full flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Close notification"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Circular Product Thumbnail */}
        <Link
          href={`/product/${currentProduct.slug}`}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border border-neutral-700/80 bg-neutral-900 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
        >
          <Image
            src={imageUrl}
            alt={currentProduct.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </Link>

        {/* Text & Action Details */}
        <div className="ml-3 sm:ml-3.5 flex-1 min-w-0 pr-1">
          {/* Top Line: Red location text */}
          <p className="text-[11px] sm:text-xs font-normal text-[#e52020] truncate leading-tight">
            Someone in <span className="underline decoration-[#e52020]/40">{location}</span> purchased a
          </p>

          {/* Product Name: Bold uppercase white text */}
          <Link
            href={`/product/${currentProduct.slug}`}
            className="block text-white font-black text-xs sm:text-[13px] tracking-wide uppercase truncate leading-tight mt-0.5 hover:text-red-400 transition-colors"
            title={currentProduct.displayName || currentProduct.name}
          >
            {currentProduct.displayName || currentProduct.name}
          </Link>

          {/* Stars line: coral/salmon rating */}
          <div className="flex items-center gap-0.5 my-0.5">
            {[1, 2, 3, 4, 5].map((starIdx) => {
              const isFilled = starIdx <= ratingPattern;
              return (
                <Star
                  key={starIdx}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    isFilled
                      ? "fill-[#e05842] text-[#e05842]"
                      : "text-[#e05842] stroke-[1.5]"
                  }`}
                />
              );
            })}
          </div>

          {/* Bottom Line: Timestamp on left, Add to cart button on right */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-normal text-[#c23b3b] truncate">
              {timeAgo}
            </span>

            {/* Red pill button with cyan circular cart icon */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 sm:py-1 rounded-full text-xs font-black transition-all active:scale-95 shadow-md ${
                isAdded
                  ? "bg-emerald-500 text-white"
                  : "bg-[#e51919] hover:bg-[#d01515] text-black"
              }`}
              aria-label={`Add ${currentProduct.name} to cart`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  {/* Cyan circle with red cart icon */}
                  <span className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-[#00f2fe] flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#e51919] fill-[#e51919]" />
                  </span>
                  <span className="text-black font-extrabold text-[11px] sm:text-xs">
                    Add to cart
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
