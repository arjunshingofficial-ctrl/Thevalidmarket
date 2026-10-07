"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { formatUsd, formatInr, formatBtc, formatUsdt } from "@/lib/currency";

export default function WalletDepositReviewClient({ deposit, settings }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  
  const formatPaymentAmount = () => {
    if (deposit.paymentCurrency === "INR") return formatInr(deposit.paymentAmount);
    if (deposit.paymentCurrency === "BTC") return formatBtc(deposit.paymentAmount);
    if (deposit.paymentCurrency === "USDT") return formatUsdt(deposit.paymentAmount);
    return formatUsd(deposit.paymentAmount);
  };

  const handleAction = async (action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectReason && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (action === "REJECT" && !rejectReason) {
      setError("Rejection reason is required.");
      return;
    }

    if (action === "APPROVE") {
      if (!confirm(`Are you sure you want to approve this wallet deposit of ${formatPaymentAmount()}? This will permanently credit $${deposit.amountUsd} cash and $${deposit.bonusAmountUsd} bonus to the user's wallet.`)) {
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/wallet/deposits/${deposit.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: rejectReason })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action.toLowerCase()} deposit`);
      }

      router.refresh();
      router.push("/admin/wallets/deposits");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Details */}
      <div className="lg:col-span-2 space-y-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {deposit.status === "APPROVED" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">This deposit has already been approved and credited.</span>
          </div>
        )}

        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Wallet Deposit Information</h2>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
              deposit.status === 'PAYMENT_REVIEW' ? 'bg-blue-100 text-blue-700' :
              deposit.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
              deposit.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {deposit.status}
            </span>
          </div>
          <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Method</p>
              <p className="font-medium text-slate-900">{deposit.paymentMethod}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Base Cash Credit</p>
              <p className="font-medium text-slate-900 text-lg">{formatUsd(deposit.amountUsd)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Promotional Bonus Credit</p>
              <p className="font-medium text-emerald-600 text-lg">{formatUsd(deposit.bonusAmountUsd)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Expected Customer Payment</p>
              <p className="font-medium text-blue-700 text-lg">{formatPaymentAmount()}</p>
            </div>
            {deposit.fxRate && (
              <div className="col-span-2">
                <p className="text-slate-500 mb-1">Locked FX Rate</p>
                <p className="font-medium text-slate-900 text-lg">
                  {deposit.paymentCurrency === "INR" ? `1 USD = ${formatInr(deposit.fxRate)}` : 
                   deposit.paymentCurrency === "BTC" ? `1 BTC = ${formatUsd(1 / deposit.fxRate)}` : ''}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-500 mb-1">Transaction ID / Hash</p>
              <p className="font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border inline-block select-all break-all">
                {deposit.transactionId || "Not Provided"}
              </p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Submitted At</p>
              <p className="font-medium text-slate-900">
                {deposit.submittedAt ? new Date(deposit.submittedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {deposit.proofUrl ? (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-slate-50">
              <h2 className="font-semibold text-slate-900">Payment Proof</h2>
            </div>
            <div className="p-6">
              <a href={deposit.proofUrl} target="_blank" rel="noreferrer" className="block border rounded-lg overflow-hidden relative group max-w-md mx-auto">
                <img 
                  src={deposit.proofUrl} 
                  alt="Payment Proof" 
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const div = document.createElement('div');
                      div.className = "flex items-center justify-center h-48 bg-slate-50 text-slate-500 font-medium";
                      div.textContent = "Proof image unavailable or is a mock file.";
                      parent.appendChild(div);
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium flex items-center gap-2"><ExternalLink className="w-4 h-4"/> View Source</span>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-slate-50">
              <h2 className="font-semibold text-slate-900">Payment Proof</h2>
            </div>
            <div className="p-6 text-slate-500 font-medium">
              No payment proof uploaded.
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Actions & Context */}
      <div className="space-y-6">
        
        {deposit.status === "PAYMENT_REVIEW" && (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 border-b pb-3">Admin Actions</h2>
            
            <button 
              onClick={() => handleAction("APPROVE")} 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              APPROVE DEPOSIT
            </button>

            {!showRejectInput ? (
              <button 
                onClick={() => handleAction("REJECT")} 
                disabled={loading}
                className="w-full bg-white border-2 border-red-200 text-red-600 py-3 rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                REJECT DEPOSIT
              </button>
            ) : (
              <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
                <label className="text-sm font-medium text-red-900">Reason for Rejection *</label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="E.g. Transaction ID not found in bank statement."
                  className="w-full border-red-200 rounded-md p-2 text-sm focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowRejectInput(false)} className="flex-1 bg-white border text-slate-600 py-2 rounded-md text-sm font-medium">Cancel</button>
                  <button onClick={() => handleAction("REJECT")} disabled={loading || !rejectReason} className="flex-1 bg-red-600 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50">Confirm Reject</button>
                </div>
              </div>
            )}
            
            <p className="text-xs text-slate-500 text-center mt-4">
              Approving this deposit will securely credit {formatUsd(deposit.amountUsd)} Cash and {formatUsd(deposit.bonusAmountUsd)} Bonus to the user's wallet via the ledger.
            </p>
          </div>
        )}

        <div className="bg-white border rounded-xl shadow-sm overflow-hidden p-6">
          <h2 className="font-semibold text-slate-900 border-b pb-3 mb-4">Customer Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">Name</p>
              <p className="font-medium text-slate-900">{deposit.wallet.user.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-medium text-slate-900">{deposit.wallet.user.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border rounded-xl shadow-sm overflow-hidden p-6">
          <h2 className="font-semibold text-slate-900 border-b border-slate-200 pb-3 mb-4">Expected Destination</h2>
          <p className="text-xs text-slate-500 mb-3">Compare the proof to these settings.</p>
          <div className="space-y-3 text-sm">
            {deposit.paymentMethod === "UPI" && (
              <>
                <div>
                  <p className="text-slate-500">UPI ID / VPA</p>
                  <p className="font-mono font-medium text-slate-900">{settings.vpa || "Not configured"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Receiver Name</p>
                  <p className="font-medium text-slate-900">{settings.receiverName || "Not configured"}</p>
                </div>
              </>
            )}
            {deposit.paymentMethod === "BTC" && (
              <>
                <div>
                  <p className="text-slate-500">BTC Address</p>
                  <p className="font-mono font-medium text-slate-900 break-all">{settings.btcAddress || "Not configured"}</p>
                </div>
              </>
            )}
            {deposit.paymentMethod === "USDT" && (
              <>
                <div>
                  <p className="text-slate-500">USDT Address</p>
                  <p className="font-mono font-medium text-slate-900 break-all">{settings.usdtAddress || "Not configured"}</p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
