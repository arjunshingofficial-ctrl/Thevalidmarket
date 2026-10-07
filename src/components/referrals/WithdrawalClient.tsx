"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";

export default function WithdrawalPage({ availableAmount }: { availableAmount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [formData, setFormData] = useState({
    amount: availableAmount.toString(),
    method: "UPI",
    details: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const amountNum = parseFloat(formData.amount);
    
    if (isNaN(amountNum) || amountNum < 500) {
      setError("Minimum withdrawal amount is $10.");
      setLoading(false);
      return;
    }

    if (amountNum > availableAmount) {
      setError("Cannot withdraw more than available balance.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/referrals/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          method: formData.method,
          details: formData.details
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process withdrawal");

      setSuccess("Withdrawal request submitted successfully!");
      setFormData({ ...formData, amount: "", details: "" });
      
      // Refresh the page data after a short delay
      setTimeout(() => {
        router.push("/dashboard/referrals");
        router.refresh();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/referrals" className="p-2 border rounded-md hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Request Withdrawal</h1>
          <p className="text-slate-500 text-sm mt-1">Withdraw your available referral earnings.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
          <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <Wallet className="h-6 w-6 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Available Balance</p>
            <h3 className="text-2xl font-bold text-emerald-700">${availableAmount.toFixed(2)}</h3>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-100 font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Withdrawal Amount ($)</label>
            <input 
              type="number" 
              required
              min="500"
              step="0.01"
              max={availableAmount}
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">Minimum withdrawal: $10</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payout Method</label>
            <select 
              value={formData.method}
              onChange={e => setFormData({...formData, method: e.target.value})}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="USDT_TRC20">USDT (TRC20)</option>
              <option value="BTC">Bitcoin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Details</label>
            <textarea 
              required
              rows={3}
              value={formData.details}
              onChange={e => setFormData({...formData, details: e.target.value})}
              placeholder={
                formData.method === "UPI" ? "Enter your UPI ID (e.g. name@bank)" : 
                formData.method === "BANK_TRANSFER" ? "Account Name, Account Number, IFSC Code" : 
                "Enter your wallet address"
              }
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">Please ensure your payment details are accurate.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={loading || availableAmount < 500}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium text-sm flex items-center justify-center min-w-[140px] hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Withdrawal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
