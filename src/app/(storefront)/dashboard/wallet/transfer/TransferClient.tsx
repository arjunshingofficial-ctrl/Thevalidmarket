"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { lookupUserForTransfer, transferFunds } from "@/lib/actions/wallet";
import { Search, Send, User, CheckCircle, ArrowRight } from "lucide-react";

export default function TransferClient({ currentBalance }: { currentBalance: number }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState<{ id: string; name: string | null; accountId: string | null } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!/^\d{8}$/.test(identifier.trim())) {
      setError("User ID must be exactly 8 digits.");
      setLoading(false);
      return;
    }

    try {
      const user = await lookupUserForTransfer(identifier.trim());
      if (!user) {
        setError("User not found. Please check the ID and try again.");
      } else {
        setRecipient(user);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (numAmount > currentBalance) {
      setError("Insufficient balance");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await transferFunds(recipient.id, numAmount);
      router.push("/dashboard/wallet?transfer=success");
    } catch (err: any) {
      setError(err.message || "Failed to transfer funds");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Transfer Funds
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleLookup} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Recipient User ID</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 62753867"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono tracking-widest text-lg"
                />
              </div>
              <p className="text-xs text-slate-500">Enter the recipient's 8-digit User ID.</p>
            </div>
            
            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-primary transition-colors disabled:opacity-50"
            >
              {loading ? "Searching..." : "Find User"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-4 flex items-start justify-between border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Recipient</div>
                  <div className="font-bold text-slate-900">{recipient?.name || "User"}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {recipient?.accountId}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 text-lg rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Available Balance:</span>
                <span className="text-primary">${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !amount}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:translate-y-0.5 disabled:opacity-50"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Confirm Transfer
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
