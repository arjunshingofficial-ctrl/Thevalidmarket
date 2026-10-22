"use client";

import { useState } from "react";
import { RotateCcw, X, AlertTriangle, Wallet, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface RefundButtonProps {
  orderId: string;
  orderNumber: string;
  total: number;
  customerName?: string | null;
  customerEmail: string;
  paymentStatus: string;
  orderStatus: string;
}

export function RefundButton({
  orderId,
  orderNumber,
  total,
  customerName,
  customerEmail,
  paymentStatus,
}: RefundButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [refundType, setRefundType] = useState<"WALLET" | "MANUAL">("WALLET");
  const [amount, setAmount] = useState<number>(total);
  const [reason, setReason] = useState("Customer requested refund");
  const [note, setNote] = useState("");
  const [revokeAccess, setRevokeAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const isRefunded = paymentStatus === "REFUNDED";

  if (isRefunded) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-sm font-semibold select-none">
        <RotateCcw className="w-4 h-4 text-rose-600" />
        <span>Order Refunded</span>
      </span>
    );
  }

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0 || amount > total) {
      setError(`Refund amount must be between $0.01 and $${total.toFixed(2)}.`);
      return;
    }

    if (!confirm(`Are you sure you want to refund $${amount.toFixed(2)} for Order #${orderNumber}? This will update the order status and revoke access.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refundType,
          amount,
          reason,
          note,
          revokeAccess,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process refund");
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setAmount(total);
          setError(null);
          setSuccess(false);
          setIsOpen(true);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-semibold transition-colors shadow-xs"
        title="Issue a full or partial refund for this order"
      >
        <RotateCcw className="h-4 w-4" />
        <span>Refund Order</span>
      </button>

      {/* Refund Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Refund Order #{orderNumber}</h3>
                  <p className="text-xs text-slate-500">
                    {customerName ? `${customerName} • ` : ""}{customerEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !loading && setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Refund Completed!</h4>
                <p className="text-sm text-slate-600">
                  ${amount.toFixed(2)} has been refunded successfully
                  {refundType === "WALLET" ? " to the customer's on-site wallet" : ""}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcessRefund} className="p-6 space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Refund Destination Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Refund Destination</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setRefundType("WALLET")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        refundType === "WALLET"
                          ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-0.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Customer Wallet</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Instant credit to their wallet balance on-site.
                      </p>
                    </div>

                    <div
                      onClick={() => setRefundType("MANUAL")}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        refundType === "MANUAL"
                          ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-0.5">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                        <span>External / Manual</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Crypto / UPI returned outside the system.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Refund Amount */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">Refund Amount ($)</label>
                    <span className="text-slate-500">Order Total: ${total.toFixed(2)}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={total}
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      required
                    />
                  </div>
                </div>

                {/* Refund Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  >
                    <option value="Customer requested refund">Customer requested refund</option>
                    <option value="Card / CVV Invalid or Declined">Card / CVV Invalid or Declined</option>
                    <option value="Product File or Software Defect">Product File or Software Defect</option>
                    <option value="Out of Stock / Unavailable">Out of Stock / Unavailable</option>
                    <option value="Duplicate Order / Billing Mistake">Duplicate Order / Billing Mistake</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Optional Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Admin Note (Optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Details about this refund..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                {/* Revoke Access Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="revokeAccess"
                    checked={revokeAccess}
                    onChange={(e) => setRevokeAccess(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <label htmlFor="revokeAccess" className="text-xs text-slate-700 select-none cursor-pointer">
                    Revoke customer download access, license keys &amp; entitlements
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Confirm Refund (${amount.toFixed(2)})</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
