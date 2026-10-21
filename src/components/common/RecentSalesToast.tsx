"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Star, X, Check, ShieldCheck } from "lucide-react";
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

// Indian locations mixed with major global hubs
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
  "About 22 minutes ago",
  "About 27 minutes ago",
  "About 35 minutes ago",
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
    // Pick rating: 85% 5-star, 15% 4-star
    const randomRating = Math.random() > 0.15 ? 5 : 4;

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
  const isWhiteLogo =
    imageUrl.includes("/cards/") &&
    !imageUrl.includes("cards-deck") &&
    !imageUrl.includes("amex");

  return (
    <div
      className="fixed top-[108px] inset-x-3 max-w-[390px] mx-auto sm:mx-0 sm:left-auto sm:right-6 sm:top-28 sm:w-[380px] z-[90] animate-in fade-in slide-in-from-top-4 sm:slide-in-from-right-4 duration-300 select-none group"
      role="status"
      aria-live="polite"
    >
      {/* Sleek Floating Glassmorphic Card */}
      <div className="relative bg-gradient-to-br from-[#0e0e14]/98 via-[#09090e]/98 to-[#050508]/98 border border-neutral-700/80 hover:border-red-500/50 rounded-2xl p-3 sm:p-3.5 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.85),0_0_20px_rgba(239,68,68,0.18)] backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-300 overflow-hidden">
        
        {/* Subtle animated progress bar at the bottom */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 opacity-90"
          style={{
            animation: "salesCardProgress 6.5s linear forwards",
          }}
        />

        {/* Top Meta Row: Live pulse + Location + Timestamp + Dismiss */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-neutral-800/80">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[11px] sm:text-xs text-neutral-300 font-medium truncate">
              Someone in <span className="text-[#ff3850] font-bold">{location}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-neutral-400 font-medium">
              {timeAgo}
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-5 h-5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Main Product Row */}
        <div className="flex items-center gap-3 pt-2.5">
          {/* Thumbnail */}
          <Link
            href={`/product/${currentProduct.slug}`}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 border border-neutral-700/80 bg-neutral-900 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform shadow-md"
          >
            <Image
              src={imageUrl}
              alt={currentProduct.name}
              fill
              sizes="56px"
              className={isWhiteLogo ? "object-contain p-1.5 bg-white" : "object-cover"}
            />
          </Link>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/product/${currentProduct.slug}`}
              className="block font-black text-white text-xs sm:text-[13px] tracking-wide uppercase truncate leading-snug hover:text-red-400 transition-colors"
              title={currentProduct.displayName || currentProduct.name}
            >
              {currentProduct.displayName || currentProduct.name}
            </Link>

            {/* Stars & Price */}
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((starIdx) => {
                  const isFilled = starIdx <= ratingPattern;
                  return (
                    <Star
                      key={starIdx}
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                        isFilled
                          ? "fill-[#f59e0b] text-[#f59e0b]"
                          : "text-[#f59e0b] stroke-[1.5]"
                      }`}
                    />
                  );
                })}
              </div>

              <span className="text-[11px] sm:text-xs font-bold text-emerald-400">
                ${Number(currentProduct.price || 0).toFixed(2)}
              </span>

              <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-semibold text-neutral-400 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                Verified
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition-all active:scale-95 shadow-md ${
              isAdded
                ? "bg-emerald-500 text-white shadow-emerald-500/30"
                : "bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30"
            }`}
            aria-label={`Add ${currentProduct.name} to cart`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="font-extrabold text-[11px] sm:text-xs">Added!</span>
              </>
            ) : (
              <>
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-[#00f2fe] flex items-center justify-center shrink-0 shadow-sm">
                  <ShoppingCart className="w-2.5 h-2.5 text-red-600 fill-red-600 stroke-[2.5]" />
                </span>
                <span className="font-extrabold text-[11px] sm:text-xs whitespace-nowrap">
                  Add to cart
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Embedded keyframe animation for the progress bar */}
      <style jsx global>{`
        @keyframes salesCardProgress {
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
