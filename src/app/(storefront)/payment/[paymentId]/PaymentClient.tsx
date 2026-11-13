"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { formatUsd, formatInr, formatBtc, formatUsdt } from "@/lib/currency";
import { PaymentDestinationCard } from "@/components/payment/PaymentDestinationCard";
import ManualPaymentSupport from "./ManualPaymentSupport";

export default function PaymentClient({ payment, order, methodConfig, settings, accountId }: any) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Determine effective UPI mode: auto-fallback to SUPPORT if UPI ID is missing
  let effectiveUpiMode = settings?.upiPaymentMode || "DIRECT_SUPPORT";
  if (payment.method === "UPI" || payment.method === "UPI_MANUAL") {
    const hasValidUpi = !!settings?.vpa && settings.vpa.trim() !== "";
    if (!hasValidUpi && (effectiveUpiMode === "DIRECT" || effectiveUpiMode === "DIRECT_SUPPORT")) {
      effectiveUpiMode = "SUPPORT";
    }
  }

  const isExpired = payment.status === "EXPIRED" || (payment.status === "PAYMENT_REQUIRED" && timeLeft <= 0 && payment.expiresAt && new Date() > new Date(payment.expiresAt));

  useEffect(() => {
    if (payment.status !== "PAYMENT_REQUIRED" || !payment.expiresAt) return;

    const expiryTime = new Date(payment.expiresAt).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) {
        clearInterval(interval);
        router.refresh();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [payment.status, payment.expiresAt, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("paymentId", payment.id);

    try {
      const res = await fetch("/api/payment/submit", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatPaymentAmount = () => {
    if (payment.currency === "INR") return formatInr(payment.amount);
    if (payment.currency === "BTC") return formatBtc(payment.amount);
    if (payment.currency === "USDT") return formatUsdt(payment.amount);
    return formatUsd(payment.amount);
  };

  const getExchangeRateDisplay = () => {
    if (payment.currency === "INR" && payment.fxRate) return `1 USD = ${formatInr(payment.fxRate)}`;
    if (payment.currency === "BTC" && payment.fxRate) return `1 BTC = ${formatUsd(1 / payment.fxRate)}`;
    return null;
  };

  if (payment.status === "PAID") {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-emerald-100">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Verified</h2>
        <p className="text-slate-500 mb-6">Your payment has been successfully approved.</p>
        <button onClick={() => router.push(`/dashboard/orders`)} className="bg-primary text-white px-6 py-2 rounded-md font-medium">
          Access Your Purchase
        </button>
      </div>
    );
  }

  if (payment.status === "REJECTED") {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-red-100">
        <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Rejected</h2>
        <p className="text-slate-500 mb-2">Payment could not be verified.</p>
        {payment.rejectionReason && (
          <p className="text-sm bg-red-50 text-red-700 p-3 rounded-md mb-6 max-w-sm mx-auto">{payment.rejectionReason}</p>
        )}
        <button onClick={() => router.push(`/checkout`)} className="bg-primary text-white px-6 py-2 rounded-md font-medium">
          Try Again
        </button>
      </div>
    );
  }

  if (payment.status === "EXPIRED" || isExpired) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border">
        <Clock className="mx-auto h-16 w-16 text-slate-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Window Expired</h2>
        <p className="text-slate-500 mb-6">The 10-minute payment window has closed.</p>
        <button onClick={() => router.push(`/checkout`)} className="bg-primary text-white px-6 py-2 rounded-md font-medium">
          Try Again
        </button>
      </div>
    );
  }

  if (payment.status === "PAYMENT_REVIEW") {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-blue-100">
        <AlertCircle className="mx-auto h-16 w-16 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Submitted</h2>
        <p className="text-slate-500 mb-6">Your order is under manual verification.</p>
        <div className="bg-slate-50 border rounded-lg p-4 text-left max-w-sm mx-auto space-y-2 text-sm text-slate-600">
          <p><span className="font-medium text-slate-900">Order ID:</span> {order.id.slice(0,8).toUpperCase()}</p>
          <p><span className="font-medium text-slate-900">Order Total:</span> {formatUsd(payment.baseAmount || order.total)}</p>
          <p><span className="font-medium text-slate-900">Payment Amount:</span> {formatPaymentAmount()}</p>
          <p><span className="font-medium text-slate-900">Submitted:</span> {payment.submittedAt ? new Date(payment.submittedAt).toLocaleString() : 'N/A'}</p>
          {payment.transactionId && <p><span className="font-medium text-slate-900">Reference:</span> {payment.transactionId}</p>}
        </div>
        <button onClick={() => router.push(`/dashboard/orders`)} className="mt-6 bg-slate-100 text-slate-700 hover:bg-slate-200 px-6 py-2 rounded-md font-medium">
          View Order Status
        </button>
      </div>
    );
  }

  // Status is PAYMENT_REQUIRED
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-slate-900 text-white p-6 text-center">
          <h2 className="text-lg font-medium text-slate-300">PAYMENT REQUIRED</h2>
          <div className="text-sm text-slate-400 mt-2">ORDER TOTAL</div>
          <div className="text-2xl font-semibold mb-4">{formatUsd(payment.baseAmount || order.total)}</div>
          
          <div className="pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">{payment.method} PAYMENT</div>
            <div className="text-3xl font-bold mt-1">{formatPaymentAmount()}</div>
            {getExchangeRateDisplay() && (
              <div className="text-xs text-slate-400 mt-2">Exchange Rate: {getExchangeRateDisplay()}</div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full font-medium">
              <Clock className="w-5 h-5" />
              <span>Payment window: {formatTime(timeLeft)} remaining</span>
            </div>
          </div>

          {(payment.method === "UPI" || payment.method === "UPI_MANUAL") && effectiveUpiMode === "SUPPORT" ? (
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Manual Payment Required</h3>
              <p className="text-blue-700 text-sm">Please contact our support team below to receive payment instructions.</p>
            </div>
          ) : (
            <PaymentDestinationCard 
              method={payment.method} 
              settings={settings} 
              amount={payment.amount} 
              currency={payment.currency}
              reference={payment.id.slice(0, 8).toUpperCase()}
            />
          )}

          {(payment.method === "UPI" || payment.method === "UPI_MANUAL") && effectiveUpiMode !== "DIRECT" && (
            <ManualPaymentSupport 
              order={order}
              payment={payment}
              settings={settings}
              accountId={accountId}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5 border-t pt-8">
            <h3 className="text-lg font-semibold text-slate-900">Submit Payment Details</h3>
            
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

            {settings.requireTransactionId !== false && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Transaction ID / Reference Hash *</label>
                <input name="transactionId" required 
                  placeholder="Enter the transaction ID from your app"
                  className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary" />
              </div>
            )}

            {settings.requireProof !== false && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Payment Screenshot (Optional)</label>
                <input type="file" name="proof" accept="image/jpeg,image/png,image/webp" 
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Customer Note (Optional)</label>
              <textarea name="note" rows={2} placeholder="Any additional information..."
                className="w-full border rounded-md px-3 py-2 focus:ring-primary focus:border-primary resize-none" />
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {submitting ? "Submitting..." : "I HAVE PAID"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
