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

// Indian cities prominently mixed with major global hubs
const GLOBAL_LOCATIONS = [
  // India locations
  "Mumbai, India",
  "New Delhi, India",
  "Bengaluru, India",
  "Hyderabad, India",
  "Chennai, India",
  "Kolkata, India",
  "Pune, India",
  "Ahmedabad, India",
  "Jaipur, India",
  "Chandigarh, India",
  "Surat, India",
  "Lucknow, India",
  "Kochi, Kerala, India",
  "Indore, India",
  "Noida, India",
  "Gurugram, India",
  "Goa, India",
  // Top Global locations
  "New York, United States",
  "London, United Kingdom",
  "Frankfurt, Germany",
  "Toronto, Canada",
  "Sydney, Australia",
  "Paris, France",
  "Singapore",
  "Dubai, United Arab Emirates",
  "Zurich, Switzerland",
  "Amsterdam, Netherlands",
  "Tokyo, Japan",
  "Congo Free State, The",
  "California, United States",
  "Texas, United States",
  "Melbourne, Australia",
];

const TIME_AGO_OPTIONS = [
  "About 3 minutes ago",
  "About 7 minutes ago",
  "About 11 minutes ago",
  "About 16 minutes ago",
  "About 23 minutes ago",
  "About 27 minutes ago",
  "About 34 minutes ago",
  "About 42 minutes ago",
  "Just now",
];

export default function RecentSalesToast() {
  const pathname = usePathname();
  const [products, setProducts] = useState<SocialProduct[]>([]);
  const [currentProduct, setCurrentProduct] = useState<SocialProduct | null>(null);
  const [location, setLocation] = useState<string>("");
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [ratingPattern, setRatingPattern] = useState<number>(5);
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
    // Pick random location (India + Global)
    const randomLocation = GLOBAL_LOCATIONS[Math.floor(Math.random() * GLOBAL_LOCATIONS.length)];
    // Pick random timestamp
    const randomTime = TIME_AGO_OPTIONS[Math.floor(Math.random() * TIME_AGO_OPTIONS.length)];
    // Pick rating: 80% 5-star, 20% 4-star
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
    // Random interval between 12s and 22s
    const nextInterval = Math.floor(Math.random() * 10000) + 12000;
    timerRef.current = setTimeout(() => {
      triggerNotification();
    }, nextInterval);
  };

  // Initial trigger after products load
  useEffect(() => {
    if (products.length === 0 || dismissed) return;

    // Initial delay of 4 seconds for first popup
    const initialTimer = setTimeout(() => {
      triggerNotification();
    }, 4000);

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
    // Suppress for 2 minutes before allowing new popups
    setTimeout(() => {
      setDismissed(false);
    }, 120000);
  };

  const imageUrl = normalizeImageUrl(currentProduct.image || "/images/cards/cards-deck.jpg");

  return (
    <div
      className="fixed top-24 right-3 sm:top-24 sm:right-6 z-[100] max-w-[calc(100vw-1.5rem)] sm:max-w-[430px] animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-300 select-none group"
      role="status"
      aria-live="polite"
    >
      {/* Enhanced Pill Container with Red Glow and Glassmorphism */}
      <div className="relative flex items-center bg-gradient-to-r from-[#0d0d12] via-[#09090c] to-[#0d0d12] border border-neutral-700/80 hover:border-red-500/50 rounded-full p-2.5 pr-4 sm:pr-5 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.85),0_0_20px_rgba(239,68,68,0.18)] backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-300 overflow-hidden">
        
        {/* Subtle animated progress bar at the bottom */}
        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full opacity-80"
          style={{
            animation: "salesProgress 6.5s linear forwards",
          }}
        />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white rounded-full flex items-center justify-center opacity-85 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md hover:bg-neutral-800"
          aria-label="Close notification"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Circular Product Thumbnail with glow ring */}
        <Link
          href={`/product/${currentProduct.slug}`}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 border-2 border-red-500/50 bg-neutral-950 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform shadow-inner ring-2 ring-black"
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
          {/* Top Line: Red accent text with pulsing live dot */}
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[11px] sm:text-xs font-semibold text-[#ff334b] truncate">
              Someone in <span className="text-white font-bold underline decoration-[#ff334b]/60">{location}</span> purchased a
            </p>
          </div>

          {/* Product Name: Bold uppercase white text */}
          <Link
            href={`/product/${currentProduct.slug}`}
            className="block text-white font-black text-xs sm:text-[13px] tracking-wide uppercase truncate leading-tight mt-1 hover:text-red-400 transition-colors drop-shadow"
            title={currentProduct.displayName || currentProduct.name}
          >
            {currentProduct.displayName || currentProduct.name}
          </Link>

          {/* Stars line: coral/amber rating */}
          <div className="flex items-center gap-0.5 my-1">
            {[1, 2, 3, 4, 5].map((starIdx) => {
              const isFilled = starIdx <= ratingPattern;
              return (
                <Star
                  key={starIdx}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    isFilled
                      ? "fill-[#f59e0b] text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]"
                      : "text-[#f59e0b] stroke-[1.5]"
                  }`}
                />
              );
            })}
          </div>

          {/* Bottom Line: Timestamp on left, Add to cart button on right */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-medium text-rose-400/90 truncate">
              {timeAgo}
            </span>

            {/* Red pill button with cyan circular cart icon */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 sm:py-1 rounded-full text-xs font-black transition-all active:scale-95 shadow-md ${
                isAdded
                  ? "bg-emerald-500 text-white shadow-emerald-500/30"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-black shadow-red-600/40"
              }`}
              aria-label={`Add ${currentProduct.name} to cart`}
            >
              {isAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  <span className="font-extrabold text-[11px] sm:text-xs">Added!</span>
                </>
              ) : (
                <>
                  {/* Cyan circle with red cart icon */}
                  <span className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-full bg-[#00f2fe] flex items-center justify-center shrink-0 shadow-sm">
                    <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-600 fill-red-600 stroke-[2.5]" />
                  </span>
                  <span className="text-black font-extrabold text-[11px] sm:text-xs tracking-tight">
                    Add to cart
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded keyframe animation for the progress bar */}
      <style jsx global>{`
        @keyframes salesProgress {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}
