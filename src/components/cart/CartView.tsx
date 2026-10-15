"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft,
  ShieldCheck, Zap, Headphones, Check, Sparkles, Tag, AlertCircle,
  ExternalLink, Lock, Flame
} from "lucide-react";
import { getCart, updateQuantity, removeFromCart, clearCart, CartItem } from "@/lib/cart";
import { formatUsd } from "@/lib/currency";
import { normalizeImageUrl } from "@/lib/storage/client";

export default function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setIsClient(true);
    const syncCart = () => {
      setItems(getCart());
    };

    syncCart();
    window.addEventListener("cart-updated", syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponMsg(null);

    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid coupon code");
      }

      setAppliedCoupon({
        code: data.coupon.code,
        type: data.coupon.discountType || "PERCENTAGE",
        value: Number(data.coupon.discountValue) || 0,
      });

      setCouponMsg({
        type: "success",
        text: `Coupon "${data.coupon.code}" applied successfully!`,
      });
    } catch (err: any) {
      setCouponMsg({
        type: "error",
        text: err.message || "Failed to validate coupon.",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMsg(null);
  };

  if (!isClient) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading your shopping cart...</p>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "PERCENTAGE") {
      discount = subtotal * (appliedCoupon.value / 100);
    } else {
      discount = appliedCoupon.value;
    }
    if (discount > subtotal) discount = subtotal;
  }

  const total = Math.max(0, subtotal - discount);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // ═══ EMPTY CART STATE ═══
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-14 text-center shadow-xs">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-md">
              <ShoppingCart className="w-9 h-9" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Your Shopping Cart is Empty
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
            You don’t have any digital assets, licenses, or tools in your cart yet. Explore our marketplace to discover verified tools with instant delivery.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/store"
              className="stylish-btn btn-primary btn-md flex items-center gap-2 font-bold px-6 py-3 shadow-md"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/category/software"
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Software &amp; Tools
            </Link>
            <Link
              href="/category/proxies"
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Private Proxies
            </Link>
            <Link
              href="/category/cc-cvv"
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              CC &amp; Live Drops
            </Link>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-100 text-left">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">Instant Dispatch</h4>
                <p className="text-[11px] text-slate-500">Auto-delivered immediately upon payment confirmation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">100% Clean &amp; Safe</h4>
                <p className="text-[11px] text-slate-500">Every binary and license key is pre-verified virus-free.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-0.5">24/7 VIP Support</h4>
                <p className="text-[11px] text-slate-500">Live chat assistance and automatic key replacement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ACTIVE CART STATE ═══
  return (
    <div className="space-y-8">
      {/* ─ Header & Counter ─ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Shopping Cart
            </h1>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-wider">
              {totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review your digital items, adjust quantities, and proceed to instant checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm("Are you sure you want to clear all items from your cart?")) {
              clearCart();
            }
          }}
          className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Entire Cart</span>
        </button>
      </div>

      {/* ─ Main Two-Column Layout ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* ══ LEFT: Items List (lg:col-span-8) ══ */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-xs">
            {items.map((item) => {
              const itemTotal = item.price * item.quantity;

              return (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Link
                      href={`/product/${item.slug}`}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-hidden flex-shrink-0 group block"
                    >
                      {item.image ? (
                        <Image
                          src={normalizeImageUrl(item.image)}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" />
                          <span>Instant Dispatch</span>
                        </span>
                      </div>

                      <Link
                        href={`/product/${item.slug}`}
                        className="text-sm sm:text-base font-bold text-slate-900 hover:text-primary transition-colors line-clamp-1 leading-snug"
                      >
                        {item.name}
                      </Link>

                      <p className="text-xs text-slate-500 mt-1">
                        Price: <span className="font-bold text-slate-800">{formatUsd(item.price)}</span> each
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper & Price & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/80 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.id, item.quantity - 1);
                          } else {
                            removeFromCart(item.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-2xs"
                        title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="w-9 text-center text-xs font-black text-slate-900">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors shadow-2xs"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Total for item */}
                    <div className="text-right min-w-[70px]">
                      <span className="text-base font-black text-slate-900 block">
                        {formatUsd(itemTotal)}
                      </span>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/store"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>

            <span className="text-xs text-slate-400">
              Prices guaranteed for 30 minutes
            </span>
          </div>

          {/* Trust Footnote */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Guaranteed Delivery &amp; Replacement</p>
                <p className="text-[11px] text-slate-400">
                  Every product is dispatched automatically with immediate client portal download access.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl whitespace-nowrap self-start sm:self-auto">
              <Lock className="w-3 h-3" />
              <span>256-Bit SSL Checkout</span>
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Order Summary (lg:col-span-4 Sticky) ══ */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
              <h3 className="text-lg font-black text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-slate-400">USD</span>
              </h3>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs sm:text-sm text-slate-600 mb-6">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{formatUsd(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-600">
                    <span>Instant Digital Delivery</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">Auto</span>
                  </span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Discount ({appliedCoupon.code})</span>
                    </span>
                    <span>-{formatUsd(discount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-base font-black text-slate-900 block leading-tight">Total</span>
                    <span className="text-[10px] text-slate-400 font-normal">All taxes included</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900 block tracking-tight">
                      {formatUsd(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="mb-6 pt-4 border-t border-slate-100">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-800">{appliedCoupon.code}</span>
                      <span className="text-slate-400 text-[10px]">Applied</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label
                      htmlFor="cartCoupon"
                      className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
                    >
                      Have a Promo Code?
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="cartCoupon"
                        type="text"
                        placeholder="e.g. VIP2026"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-slate-50/50"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  </form>
                )}

                {couponMsg && (
                  <p
                    className={`text-[11px] mt-2 font-semibold ${
                      couponMsg.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {couponMsg.text}
                  </p>
                )}
              </div>

              {/* Proceed to Checkout CTA */}
              <Link
                href="/checkout"
                className="stylish-btn btn-primary btn-md w-full flex items-center justify-center gap-2 font-black text-sm shadow-md py-3.5 mb-4"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Payment Methods */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">
                  Supported Payment Methods
                </p>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">USDT (TRC20/BEP20)</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Bitcoin (BTC)</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">UPI / QR</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">Wallet Balance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
