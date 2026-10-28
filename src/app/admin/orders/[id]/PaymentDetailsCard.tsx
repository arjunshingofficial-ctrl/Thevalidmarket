"use client";

import { useState } from "react";
import { 
  CreditCard, Wallet, Copy, Check, ExternalLink, ShieldCheck, 
  Clock, AlertCircle, Eye, ArrowUpRight, DollarSign, Tag, Info, ChevronDown, ChevronUp
} from "lucide-react";
import ClientDateTime from "@/components/common/ClientDateTime";
import { normalizeImageUrl } from "@/lib/storage/client";

interface PaymentItem {
  id: string;
  method: string;
  mode: string;
  transactionId?: string | null;
  status: string;
  amount: number;
  currency: string;
  baseAmount?: number | null;
  baseCurrency?: string | null;
  fxRate?: number | null;
  metadata?: string | null;
  proofUrl?: string | null;
  submittedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  verifiedAt?: string | Date | null;
  verifiedBy?: { id: string; name?: string | null; email?: string | null } | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
}

interface WalletTxItem {
  id: string;
  walletId: string;
  type: string;
  cashAmount: number;
  bonusAmount: number;
  status: string;
  description?: string | null;
  createdAt: string | Date;
}

interface PaymentDetailsCardProps {
  order: {
    id: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    baseCurrency: string;
    paymentCurrency?: string | null;
    paymentAmount?: number | null;
    fxRate?: number | null;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string | Date;
  };
  matchedCoupon?: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  payments: PaymentItem[];
  walletTx?: WalletTxItem | null;
  customer: {
    id: string;
    name?: string | null;
    email: string;
    accountId?: string | null;
  };
}

export function PaymentDetailsCard({
  order,
  matchedCoupon,
  payments = [],
  walletTx,
  customer,
}: PaymentDetailsCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showRawMetadata, setShowRawMetadata] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Determine Primary Payment
  const primaryPayment = payments[0] || null;
  const isWalletPayment = !primaryPayment && (walletTx || (order.paymentStatus === "PAID" && order.total > 0));

  // Parse Metadata
  const parsedMeta: Record<string, any> = (() => {
    if (!primaryPayment?.metadata) return {};
    try {
      return JSON.parse(primaryPayment.metadata);
    } catch {
      return {};
    }
  })();

  // Method Labels
  const rawMethod = primaryPayment?.method || (isWalletPayment ? "WALLET" : "UNKNOWN");
  const rawMode = primaryPayment?.mode || (isWalletPayment ? "INTERNAL_WALLET" : "UNKNOWN");

  const getMethodBadge = () => {
    const m = (rawMethod || "").toUpperCase();
    if (m === "WALLET" || rawMode === "INTERNAL_WALLET") {
      return {
        name: "Customer Wallet Balance",
        icon: Wallet,
        color: "bg-purple-50 text-purple-700 border-purple-200",
        type: "Internal Balance Deduction",
      };
    }
    if (m === "UPI") {
      if (rawMode === "BLADEPAY") {
        return {
          name: "BladePay Automated UPI",
          icon: CreditCard,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          type: "Instant Gateway",
        };
      }
      return {
        name: "Manual UPI Transfer",
        icon: CreditCard,
        color: "bg-blue-50 text-blue-700 border-blue-200",
        type: "Direct VPA Transfer",
      };
    }
    if (m === "USDT" || m === "USDT_TRC20") {
      return {
        name: "USDT Tether (TRC-20)",
        icon: DollarSign,
        color: "bg-teal-50 text-teal-700 border-teal-200",
        type: "Crypto Settlement",
      };
    }
    if (m === "BTC") {
      return {
        name: "Bitcoin (BTC)",
        icon: DollarSign,
        color: "bg-amber-50 text-amber-700 border-amber-200",
        type: "Crypto Settlement",
      };
    }
    return {
      name: rawMethod,
      icon: CreditCard,
      color: "bg-slate-50 text-slate-700 border-slate-200",
      type: "Payment Gateway",
    };
  };

  const methodInfo = getMethodBadge();
  const MethodIcon = methodInfo.icon;

  const currentStatus = primaryPayment?.status || order.paymentStatus;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PAYMENT_REVIEW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
      case "PAYMENT_REQUIRED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "REFUNDED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "FAILED":
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Transaction Reference ID
  const refId = primaryPayment?.transactionId || walletTx?.id || parsedMeta?.gatewayOrderNo || null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Section Header ── */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MethodIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <span>Payment &amp; Transaction Details</span>
            </h2>
            <p className="text-xs text-slate-500">
              Complete settlement breakdown, gateway references, and proof
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(
              currentStatus
            )}`}
          >
            {currentStatus.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* ── Core Payment Details Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Method Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Payment Method
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{methodInfo.name}</span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">{methodInfo.type}</span>
          </div>

          {/* Amount & Currency Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Settlement Amount
            </span>
            <div className="font-extrabold text-slate-900 text-base">
              {primaryPayment ? (
                <>
                  {primaryPayment.currency === "INR"
                    ? `₹${primaryPayment.amount.toLocaleString()}`
                    : `${primaryPayment.amount} ${primaryPayment.currency}`}
                  {primaryPayment.currency !== "USD" && (
                    <span className="text-xs font-semibold text-slate-500 ml-1.5 font-mono">
                      (${order.total.toFixed(2)} USD)
                    </span>
                  )}
                </>
              ) : (
                `$${order.total.toFixed(2)} USD`
              )}
            </div>
            {primaryPayment?.fxRate && primaryPayment.fxRate !== 1 && (
              <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">
                FX Rate: 1 USD = {primaryPayment.fxRate} {primaryPayment.currency}
              </span>
            )}
          </div>

          {/* Payment Mode */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Payment Mode
            </span>
            <span className="font-bold text-sm text-slate-900 uppercase">
              {rawMode === "BLADEPAY" ? "Automated BladePay" : rawMode.replace("_", " ")}
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block">
              {rawMode === "BLADEPAY"
                ? "Instant UPI webhook verification"
                : rawMode === "INTERNAL_WALLET"
                ? "Direct user wallet balance deduction"
                : "Manual administrative review"}
            </span>
          </div>

        </div>

        {/* ── Transaction Reference ID & Copy ── */}
        {refId && (
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5 overflow-hidden">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
                {isWalletPayment ? "Wallet Transaction Reference" : "Gateway Transaction / UTR ID"}
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-white break-all select-all">
                {refId}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyToClipboard(refId, "txId")}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              {copiedKey === "txId" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Discount & Coupon Details (if applied) ── */}
        {order.discount > 0 && (
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-900 block">
                  Discount Applied to Order
                </span>
                <span className="text-xs text-rose-700">
                  {matchedCoupon
                    ? `Coupon Code: "${matchedCoupon.code}" (${matchedCoupon.discountValue}${
                        matchedCoupon.discountType === "PERCENTAGE" ? "% OFF" : " USD OFF"
                      })`
                    : `Promo discount of $${order.discount.toFixed(2)} applied at checkout`}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-base font-black text-rose-600 block">
                -${order.discount.toFixed(2)}
              </span>
              <span className="text-[11px] text-rose-500 font-semibold">
                Saved {Math.round((order.discount / order.subtotal) * 100)}% off subtotal
              </span>
            </div>
          </div>
        )}

        {/* ── Verification, Timestamps & Actor ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
          <div>
            <span className="text-slate-400 block mb-0.5">Order Initiated</span>
            <span className="font-semibold text-slate-800">
              <ClientDateTime date={order.createdAt} format="full" showSeconds={true} />
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Payment Verified / Settled</span>
            <span className="font-semibold text-slate-800">
              {primaryPayment?.verifiedAt ? (
                <ClientDateTime date={primaryPayment.verifiedAt} format="full" showSeconds={true} />
              ) : walletTx?.createdAt ? (
                <ClientDateTime date={walletTx.createdAt} format="full" showSeconds={true} />
              ) : order.paymentStatus === "PAID" ? (
                "Verified"
              ) : (
                <span className="text-amber-600 font-medium">Awaiting Settlement</span>
              )}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Verified By</span>
            <span className="font-semibold text-slate-800">
              {primaryPayment?.verifiedBy ? (
                `${primaryPayment.verifiedBy.name || primaryPayment.verifiedBy.email} (Admin)`
              ) : rawMode === "BLADEPAY" ? (
                "BladePay Automated Webhook"
              ) : isWalletPayment ? (
                "System Wallet Engine"
              ) : (
                "System Automation"
              )}
            </span>
          </div>
        </div>

        {/* ── Proof of Payment Receipt (if manual upload exists) ── */}
        {primaryPayment?.proofUrl && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Customer Payment Proof Uploaded</span>
            </span>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div 
                className="relative w-28 h-20 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 cursor-pointer group shadow-2xs"
                onClick={() => setShowProofModal(true)}
              >
                <img
                  src={normalizeImageUrl(primaryPayment.proofUrl)}
                  alt="Customer Payment Receipt"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                  View
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800">
                  Uploaded transaction receipt / screenshot
                </p>
                <p className="text-[11px] text-slate-500">
                  Click to inspect full resolution receipt details and reference stamps.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowProofModal(true)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>Enlarge Proof</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className="text-slate-300">•</span>
                  <a
                    href={normalizeImageUrl(primaryPayment.proofUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 hover:underline"
                  >
                    Open in New Tab
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Specific Gateway Metadata Breakdown ── */}
        {(parsedMeta?.cashierUrl || parsedMeta?.upi || parsedMeta?.usdtAddress || isWalletPayment) && (
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Gateway Configuration &amp; Technical Identifiers
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {parsedMeta?.gatewayOrderNo && (
                <div>
                  <span className="text-slate-400 block text-[11px]">BladePay Gateway Order No:</span>
                  <span className="font-mono font-bold text-slate-800 select-all">
                    {parsedMeta.gatewayOrderNo}
                  </span>
                </div>
              )}

              {parsedMeta?.upi && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Receiving Merchant UPI ID:</span>
                  <span className="font-mono font-bold text-slate-800 select-all">
                    {parsedMeta.upi}
                  </span>
                </div>
              )}

              {parsedMeta?.usdtAddress && (
                <div>
                  <span className="text-slate-400 block text-[11px]">USDT TRC20 Wallet Address:</span>
                  <span className="font-mono font-bold text-slate-800 break-all select-all">
                    {parsedMeta.usdtAddress}
                  </span>
                </div>
              )}

              {parsedMeta?.cashierUrl && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Cashier Page:</span>
                  <a
                    href={parsedMeta.cashierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>View BladePay Cashier URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {isWalletPayment && walletTx && (
                <>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Customer Wallet Account ID:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {customer.accountId || "Standard Wallet"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Wallet Ledger Entry:</span>
                    <span className="font-mono font-bold text-purple-700">
                      {walletTx.description || "Order Purchase Debit"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Collapsible Full JSON Metadata Viewer ── */}
        {primaryPayment?.metadata && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRawMetadata(!showRawMetadata)}
              className="w-full px-4 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <span>Raw Payment JSON Metadata</span>
              {showRawMetadata ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showRawMetadata && (
              <pre className="p-4 bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed max-h-60">
                {JSON.stringify(parsedMeta, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* ── Multiple Payment Attempts (if customer attempted more than 1 payment) ── */}
        {payments.length > 1 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Payment Attempt History ({payments.length} Attempts)
            </span>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              {payments.map((p, idx) => (
                <div key={p.id} className="p-3 bg-slate-50/50 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Attempt #{payments.length - idx}: {p.method} ({p.mode})
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tx: {p.transactionId || "N/A"} •{" "}
                      <ClientDateTime date={p.createdAt} format="full" showSeconds={true} />
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {p.currency === "INR" ? `₹${p.amount}` : `$${p.amount} ${p.currency}`}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBadge(
                        p.status
                      )}`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Proof Preview Modal ── */}
      {showProofModal && primaryPayment?.proofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b">
              <h3 className="font-bold text-sm text-slate-900">
                Customer Payment Proof — Order #{order.id.slice(0, 8).toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold text-xs"
              >
                Close ✕
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              <img
                src={normalizeImageUrl(primaryPayment.proofUrl)}
                alt="Full Payment Proof"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <a
                href={normalizeImageUrl(primaryPayment.proofUrl)}
                download={`order-proof-${order.id}.jpg`}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
              >
                Download Receipt
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
