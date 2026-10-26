"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getCart, clearCart } from "@/lib/cart";

import { formatUsd, formatInr, formatBtc, formatUsdt } from "@/lib/currency";

interface CheckoutFlowProps {
  user: any;
  paymentMethods: any[];
  fxRates: { INR: number; BTC: number; USDT: number };
  walletBalance: { exists: boolean; total: number; cash: number; bonus: number; status?: string };
}

export default function CheckoutFlow({ user, paymentMethods, fxRates, walletBalance }: CheckoutFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<"CART" | "PAYMENT" | "VERIFYING" | "CONFIRMED" | "FAILED">("CART");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, type: string, value: number} | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  useEffect(() => {
    // Load safely sanitized cart from utility
    setCart(getCart());
    setLoading(false);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "PERCENTAGE") {
      discount = subtotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === "FIXED") {
      discount = appliedCoupon.value;
    }
    if (discount > subtotal) discount = subtotal;
  }
  
  const total = subtotal - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError("");
    
    try {
      const res = await fetch("/api/checkout/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim() })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Invalid coupon");
      }
      
      setAppliedCoupon({
        code: data.coupon.code,
        type: data.coupon.discountType,
        value: data.coupon.discountValue
      });
      setCouponCode("");
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedPayment) {
      setError("Please select a payment method");
      return;
    }

    setStep("VERIFYING");
    setError("");

    try {
      // Create Order
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: cart, 
          paymentMethod: selectedPayment,
          couponCode: appliedCoupon?.code 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      setOrder(data.order);
      clearCart();

      if (data.redirectUrl) {
        if (data.redirectUrl.startsWith("http://") || data.redirectUrl.startsWith("https://")) {
          window.location.href = data.redirectUrl;
        } else {
          router.push(data.redirectUrl);
        }
        return;
      }

      // Trigger fulfillment (simulates payment webhook firing from Sandbox)
      // In real world, this would redirect to payment gateway and wait for webhook
      const verifyRes = await fetch(`/api/checkout/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.order.id, transactionId: data.transactionId })
      });

      if (!verifyRes.ok) {
        throw new Error("Payment verification failed");
      }

      setStep("CONFIRMED");

    } catch (err: any) {
      setError(err.message);
      setStep("FAILED");
    }
  };

  if (loading) return <div className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-300" /></div>;

  if (step === "CONFIRMED") {
    // Determine which buttons to show based on product types
    const hasDownloads = order?.items?.some((i: any) => i.product.type === "DIGITAL" || i.product.type === "SOFTWARE");
    const hasLicenses = order?.items?.some((i: any) => i.product.type === "SOFTWARE"); // Assuming software gives licenses
    const hasCourses = order?.items?.some((i: any) => i.product.type === "COURSE");
    const hasSubscriptions = order?.items?.some((i: any) => i.product.type === "SUBSCRIPTION");
    const hasVPN = order?.items?.some((i: any) => i.product.type === "VPN" || i.product.type === "PROXY");

    return (
      <div className="bg-white p-8 rounded-xl border shadow-sm text-center max-w-lg mx-auto">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Confirmed!</h2>
        <p className="text-slate-500 mb-6">Your order #{order?.id?.slice(0, 8).toUpperCase()} has been fulfilled successfully.</p>
        
        <div className="flex flex-col gap-3">
          <button onClick={() => router.push(`/dashboard/orders/${order?.id}`)} className="w-full bg-primary text-white py-3 rounded-lg font-medium">
            View Order Details
          </button>
          
          {hasDownloads && (
            <button onClick={() => router.push("/dashboard/downloads")} className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-lg font-medium">
              Go to Downloads
            </button>
          )}
          {hasLicenses && (
            <button onClick={() => router.push("/dashboard/licenses")} className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-lg font-medium">
              View License Keys
            </button>
          )}
          {hasCourses && (
            <button onClick={() => router.push("/dashboard/courses")} className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-lg font-medium">
              Access My Courses
            </button>
          )}
          {(hasSubscriptions || hasVPN) && (
            <button onClick={() => router.push("/dashboard/subscriptions")} className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-lg font-medium">
              Manage Subscriptions
            </button>
          )}
          
          <button onClick={() => router.push("/dashboard")} className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-medium mt-2">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === "FAILED") {
    return (
      <div className="bg-white p-8 rounded-xl border shadow-sm text-center max-w-lg mx-auto">
        <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Checkout Failed</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => setStep("CART")} className="w-full bg-primary text-white py-3 rounded-lg font-medium">
          Try Again
        </button>
      </div>
    );
  }

  if (step === "VERIFYING") {
    return (
      <div className="bg-white p-12 rounded-xl border shadow-sm text-center max-w-lg mx-auto">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Verifying Payment...</h2>
        <p className="text-slate-500 mt-2">Please wait while we confirm your transaction securely.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Flow */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Information</h2>
          <div className="bg-slate-50 p-4 rounded-lg border text-sm text-slate-600">
            <p><span className="font-medium text-slate-900">Name:</span> {user.name || "N/A"}</p>
            <p><span className="font-medium text-slate-900">Email:</span> {user.email}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h2>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentMethods.length === 0 ? (
              <p className="text-slate-500 text-sm">No payment methods available.</p>
            ) : (
              paymentMethods.map(method => {
                let conversionDisplay = null;
                if (method.code === "UPI" || method.code === "UPI_MANUAL" || method.code.startsWith("UPI")) {
                  conversionDisplay = `~ ${formatInr(total * fxRates.INR)}`;
                } else if (method.code === "BTC") {
                  conversionDisplay = `~ ${formatBtc(total * fxRates.BTC)}`;
                } else if (method.code === "USDT_TRC20" || method.code === "USDT") {
                  conversionDisplay = `~ ${formatUsdt(total)}`;
                }

                return (
                  <label 
                    key={method.id} 
                    className={`border rounded-lg p-4 flex items-start cursor-pointer transition-all ${
                      selectedPayment === method.code ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-slate-300"
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value={method.code} 
                      checked={selectedPayment === method.code}
                      onChange={() => setSelectedPayment(method.code)}
                      className="mt-1 mr-3 text-primary focus:ring-primary h-4 w-4"
                    />
                    <div>
                      <div className="font-medium text-slate-900">{method.displayName}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {method.code === "UPI"
                          ? "GPay, PhonePe, Paytm, BHIM & Dynamic QR"
                          : method.code === "UPI_MANUAL"
                          ? "Static QR & Direct UPI Transfer"
                          : method.code}
                      </div>
                      {conversionDisplay && (
                        <div className="text-xs font-semibold text-emerald-600 mt-1">{conversionDisplay}</div>
                      )}
                      {method.code === "UPI" && (
                        <span className="inline-block mt-2 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                          ⚡ Automated Instant UPI
                        </span>
                      )}
                      {method.code === "UPI_MANUAL" && (
                        <span className="inline-block mt-2 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                          📋 Manual UPI & QR
                        </span>
                      )}
                      {method.isTestMode && <span className="inline-block mt-2 text-[10px] uppercase font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Test Mode</span>}
                    </div>
                  </label>
                );
              })
            )}

            {/* Wallet Option */}
            {walletBalance?.exists && walletBalance?.status === "ACTIVE" && (
              <label 
                className={`border rounded-lg p-4 flex items-start cursor-pointer transition-all ${
                  walletBalance.total < total ? "opacity-50 cursor-not-allowed bg-slate-50" : 
                  selectedPayment === "WALLET" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-slate-300"
                }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="WALLET" 
                  checked={selectedPayment === "WALLET"}
                  onChange={() => walletBalance.total >= total && setSelectedPayment("WALLET")}
                  disabled={walletBalance.total < total}
                  className="mt-1 mr-3 text-primary focus:ring-primary h-4 w-4 disabled:opacity-50"
                />
                <div className="w-full">
                  <div className="font-medium text-slate-900 flex justify-between">
                    <span>Pay with Wallet</span>
                    <span className="text-primary">{formatUsd(walletBalance.total)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>{formatUsd(walletBalance.cash)} Cash / {formatUsd(walletBalance.bonus)} Bonus</span>
                  </div>
                  {walletBalance.total < total && (
                    <div className="text-xs font-semibold text-red-600 mt-2">Insufficient wallet balance. Please add funds.</div>
                  )}
                </div>
              </label>
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl border shadow-sm sticky top-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3 mb-6">
            {cart.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Your cart is empty.</p>
            ) : (
              cart.map((item, i) => (
                <div key={item.id} className="flex flex-col gap-2 py-2 border-b last:border-0">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-900 line-clamp-1">{item.name}</span>
                    <span className="text-slate-900">{formatUsd(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-md border p-1">
                      <button 
                        type="button" 
                        onClick={() => {
                          import("@/lib/cart").then(m => {
                            if (item.quantity > 1) {
                              m.updateQuantity(item.id, item.quantity - 1);
                              setCart(m.getCart());
                            }
                          });
                        }}
                        className="px-2 py-0.5 hover:bg-slate-200 rounded text-slate-700 font-bold"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          import("@/lib/cart").then(m => {
                            m.updateQuantity(item.id, item.quantity + 1);
                            setCart(m.getCart());
                          });
                        }}
                        className="px-2 py-0.5 hover:bg-slate-200 rounded text-slate-700 font-bold"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        import("@/lib/cart").then(m => {
                          m.removeFromCart(item.id);
                          setCart(m.getCart());
                        });
                      }}
                      className="text-red-500 hover:text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 mt-4 space-y-4">
            {/* Coupon Section */}
            {!appliedCoupon ? (
              <div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Discount code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button 
                    type="button"
                    onClick={applyCoupon}
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">{appliedCoupon.code}</span>
                </div>
                <button 
                  type="button" 
                  onClick={removeCoupon}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span>{formatUsd(subtotal)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-{formatUsd(discount)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax (0%)</span>
                <span>{formatUsd(0)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-slate-900 pt-2 border-t mt-2">
                <span>Order Total (USD)</span>
                <span>{formatUsd(total)}</span>
              </div>
              <div className="text-xs text-slate-400 text-center mt-2">
                Prices are displayed in USD. Payment amount may vary by payment method and locked exchange rate.
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || step !== "CART"}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium mt-6 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Complete Purchase
          </button>
        </div>
      </div>
    </div>
  );
}
