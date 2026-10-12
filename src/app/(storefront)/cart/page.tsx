import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import CartView from "@/components/cart/CartView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Cart | Asia D Market",
  description: "Review your selected digital assets, software licenses, private proxies, and masterclasses before secure checkout.",
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Continue Shopping</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-700">Shopping Cart</span>
          </div>
        </div>

        {/* Main Cart View */}
        <CartView />

      </div>
    </div>
  );
}
