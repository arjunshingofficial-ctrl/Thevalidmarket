"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import { Loader2 } from "lucide-react";

export default function VipBuyButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBuy = () => {
    setLoading(true);
    addToCart({ 
      id: "vip-access", 
      name: "VIP Access (1 Month)", 
      slug: "vip-access", 
      price: 10, 
      image: "" 
    });
    router.push("/checkout");
  };

  return (
    <button 
      onClick={handleBuy}
      disabled={loading}
      className="shrink-0 bg-white text-indigo-700 font-bold px-6 py-3 rounded-xl shadow-sm hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5 transition-all whitespace-nowrap disabled:opacity-70 flex items-center justify-center min-w-[160px]"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join VIP for $10"}
    </button>
  );
}