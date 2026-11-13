"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatUsd, formatInr, formatBtc, formatUsdt } from "@/lib/currency";

export default function WalletDepositClient({ user, config, paymentMethods, fxRates }: any) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>("50");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountNum = parseFloat(amount) || 0;
  
  let bonus = 0;
  if (config.bonusEnabled && amountNum >= 50) {
    bonus = amountNum * (config.bonusRate / 100);
    if (config.maxBonus && bonus > config.maxBonus) {
      bonus = config.maxBonus;
    }
  }

  const handleDeposit = async () => {
    if (amountNum < config.minDeposit) {
      setError(`Minimum deposit is ${formatUsd(config.minDeposit)}`);
      return;
    }
    if (config.maxDeposit && amountNum > config.maxDeposit) {
      setError(`Maximum deposit is ${formatUsd(config.maxDeposit)}`);
      return;
    }
    if (!selectedMethod) {
      setError("Please select a payment method.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: amountNum, paymentMethod: selectedMethod })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to initiate deposit");

      if (data.redirectUrl) {
        if (data.redirectUrl.startsWith("http://") || data.redirectUrl.startsWith("https://")) {
          window.location.href = data.redirectUrl;
        } else {
          router.push(data.redirectUrl);
        }
        return;
      }

      router.push(`/dashboard/wallet/deposit/${data.depositId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-6 space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Deposit Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
          <input 
            type="number" 
            min={config.minDeposit} 
            max={config.maxDeposit}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-8 pr-4 py-3 rounded-lg border-slate-300 focus:border-primary focus:ring-primary text-lg font-medium"
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Minimum: {formatUsd(config.minDeposit)} {config.maxDeposit ? `| Maximum: ${formatUsd(config.maxDeposit)}` : ''}
        </p>
      </div>

      {config.bonusEnabled && (
        amountNum >= 50 ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <h3 className="font-semibold text-emerald-900 mb-1">Deposit Bonus</h3>
            <p className="text-sm text-emerald-800 flex justify-between">
              <span>You will receive:</span>
              <span className="font-bold">+{formatUsd(bonus)}</span>
            </p>
            <div className="border-t border-emerald-200 mt-3 pt-3 flex justify-between text-emerald-900 font-bold">
              <span>Total Usable Balance:</span>
              <span>{formatUsd(amountNum + bonus)}</span>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">Unlock a {config.bonusRate}% Bonus!</h3>
            <p className="text-sm text-blue-800">
              Deposit <strong>{formatUsd(50 - amountNum)}</strong> more to reach $50.00 and receive double your usable balance instantly!
            </p>
          </div>
        )
      )}

      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Select Payment Method</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paymentMethods.map((method: any) => {
            let conversionDisplay = null;
            if (method.code === "UPI" || method.code === "UPI_MANUAL" || method.code.startsWith("UPI")) {
              conversionDisplay = `~ ${formatInr(amountNum * fxRates.INR)}`;
            } else if (method.code === "BTC") {
              conversionDisplay = `~ ${formatBtc(amountNum * fxRates.BTC)}`;
            } else if (method.code === "USDT_TRC20" || method.code === "USDT") {
              conversionDisplay = `~ ${formatUsdt(amountNum)}`;
            }

            return (
              <label 
                key={method.id} 
                className={`border rounded-lg p-4 flex items-start cursor-pointer transition-all ${
                  selectedMethod === method.code ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-slate-300"
                }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value={method.code} 
                  checked={selectedMethod === method.code}
                  onChange={() => setSelectedMethod(method.code)}
                  className="mt-1 mr-3 text-primary focus:ring-primary h-4 w-4"
                />
                <div>
                  <div className="font-medium text-slate-900">{method.displayName}</div>
                  {conversionDisplay && (
                    <div className="text-xs font-semibold text-emerald-600 mt-1">{conversionDisplay}</div>
                  )}
                  {(method.code === "UPI" || method.code === "UPI_MANUAL" || method.code.startsWith("UPI")) && (
                    <div className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-2 py-0.5 mt-1.5 inline-block">
                      15% tax on UPI Payment
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <button 
        onClick={handleDeposit}
        disabled={loading || amountNum < config.minDeposit || !selectedMethod}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Proceed to Payment"}
      </button>
    </div>
  );
}
