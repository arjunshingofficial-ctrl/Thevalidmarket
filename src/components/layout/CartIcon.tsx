"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, CartItem } from "@/lib/cart";

export default function CartIcon() {
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    // Initial load
    const updateCount = () => {
      const cart = getCart();
      const count = cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
      setItemCount(count);
    };

    updateCount();

    // Listen for custom cart-updated event (fired by our cart utility)
    window.addEventListener("cart-updated", updateCount);
    
    // Listen for storage events (if cart changed in another tab)
    window.addEventListener("storage", updateCount);

    return () => {
      window.removeEventListener("cart-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return (
    <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-primary" title="View Shopping Cart">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}
