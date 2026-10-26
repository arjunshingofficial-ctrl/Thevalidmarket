"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, AlertCircle, UploadCloud } from "lucide-react";
import { formatUsd, formatInr, formatBtc, formatUsdt } from "@/lib/currency";
import { PaymentDestinationCard } from "@/components/payment/PaymentDestinationCard";

export default function DepositInstructionClient({ deposit, methodConfig, settings }: any) {
  const router = useRouter();
  const [transactionId, setTransactionId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPaymentAmount = () => {
    if (deposit.paymentCurrency === "INR") return formatInr(deposit.paymentAmount);
    if (deposit.paymentCurrency === "BTC") return formatBtc(deposit.paymentAmount);
    if (deposit.paymentCurrency === "USDT") return formatUsdt(deposit.paymentAmount);
    return formatUsd(deposit.paymentAmount);
  };

  const getExchangeRateDisplay = () => {
    if (deposit.paymentCurrency === "INR" && deposit.fxRate) return `1 USD = ${formatInr(deposit.fxRate)}`;
    if (deposit.paymentCurrency === "BTC" && deposit.fxRate) return `1 BTC = ${formatUsd(1 / deposit.fxRate)}`;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError("Please provide the transaction ID or hash.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("transactionId", transactionId.trim());
      if (proofFile) formData.append("proof", proofFile);
      formData.append("depositId", deposit.id);

      const res = await fetch(`/api/wallet/deposit/submit`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit proof");
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (deposit.status !== "PENDING") {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-slate-200">
        <CheckCircle2 className="mx-auto h-16 w-16 text-blue-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Deposit Submitted</h2>
        <p className="text-slate-500 mb-6">Your deposit is currently under review by our team.</p>
        <div className="bg-slate-50 border rounded-lg p-4 text-left max-w-sm mx-auto space-y-2 text-sm text-slate-600">
          <p><span className="font-medium text-slate-900">Deposit ID:</span> {deposit.id.slice(0,8).toUpperCase()}</p>
          <p><span className="font-medium text-slate-900">Amount:</span> {formatUsd(deposit.amountUsd)}</p>
          <p><span className="font-medium text-slate-900">Bonus:</span> {formatUsd(deposit.bonusAmountUsd)}</p>
          <p><span className="font-medium text-slate-900">Status:</span> {deposit.status}</p>
        </div>
        <button onClick={() => router.push("/dashboard/wallet")} className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium">
          Back to Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-slate-900 text-white p-6 text-center">
          <h2 className="text-lg font-medium text-slate-300">DEPOSIT REQUIRED</h2>
          <div className="text-sm text-slate-400 mt-2">DEPOSIT AMOUNT</div>
          <div className="text-2xl font-semibold mb-4">{formatUsd(deposit.amountUsd)}</div>
          
          <div className="pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">{deposit.paymentMethod} PAYMENT</div>
            <div className="text-3xl font-bold mt-1">{formatPaymentAmount()}</div>
            {getExchangeRateDisplay() && (
              <div className="text-xs text-slate-400 mt-2">Exchange Rate: {getExchangeRateDisplay()}</div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {(() => {
            let meta: any = {};
            try {
              if (deposit.metadata) meta = JSON.parse(deposit.metadata);
            } catch (e) {}

            if (meta.cashierUrl) {
              return (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                  <p className="text-sm font-semibold text-emerald-950">
                    Instant UPI Checkout (BladePay)
                  </p>
                  <p className="text-xs text-emerald-800">
                    Click below to open the dynamic UPI cashier to pay via GPay, PhonePe, Paytm, or QR.
                  </p>
                  <a
                    href={meta.cashierUrl}
                    className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
                  >
                    Pay Now with UPI Cashier →
                  </a>
                </div>
              );
            }
            return null;
          })()}

          <div>
            <h3 className="font-semibold text-slate-900 mb-3 border-b pb-2">Payment Instructions</h3>
            <div className="prose prose-sm text-slate-600" dangerouslySetInnerHTML={{ __html: methodConfig?.instructions || "Please transfer the exact amount to the details provided below." }} />
          </div>

          <PaymentDestinationCard 
            method={deposit.paymentMethod} 
            settings={settings} 
            amount={deposit.paymentAmount} 
            currency={deposit.paymentCurrency}
            reference={deposit.id.slice(0, 8).toUpperCase()}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Submit Payment Proof</h2>
        <p className="text-sm text-slate-500 mb-6">After completing the transfer, provide the transaction ID and a screenshot of the successful payment.</p>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transaction ID / UTR / Hash *</label>
            <input 
              type="text" 
              required
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 312345678901 or 0x..."
              className="w-full px-4 py-3 rounded-lg border-slate-300 focus:border-primary focus:ring-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Screenshot (Optional)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 transition-colors">
              <div className="space-y-2 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                    <span>{proofFile ? proofFile.name : "Upload a file"}</span>
                    <input id="file-upload" name="file-upload" type="file" accept="image/*" className="sr-only" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !transactionId.trim()}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Clock className="w-5 h-5 animate-spin" /> : "Submit for Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
