import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/wallet";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatUsd, formatInr } from "@/lib/currency";
import { PlusCircle, History, Info, AlertTriangle, Send, ArrowDownToLine } from "lucide-react";
import CopyUserId from "./CopyUserId";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const walletBalance = await getWalletBalance(session.user.id);
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  const walletConfig = settings?.walletConfig ? JSON.parse(settings.walletConfig) : { bonusRate: 100, depositEnabled: true };
  
  const { getUsdToInrRate } = await import("@/lib/fx");
  const inrMultiplier = await getUsdToInrRate();

  const recentTransactions = await prisma.walletTransaction.findMany({
    where: { wallet: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountId: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Wallet</h1>
          <p className="text-sm text-slate-500">Your User ID</p>
        </div>
        {currentUser?.accountId && (
          <CopyUserId accountId={currentUser.accountId} />
        )}
      </div>

      {walletBalance.status === "SUSPENDED" && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Your wallet is currently suspended. You cannot add funds or spend balance.</span>
        </div>
      )}

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-sm font-medium text-slate-400">Total Usable Balance</h2>
            <p className="text-4xl font-bold mt-2">{formatUsd(walletBalance.total)}</p>
            <p className="text-sm font-medium text-emerald-400 mt-2 flex items-center gap-1.5">
              <span>{formatInr(walletBalance.total * inrMultiplier)}</span>
              <span className="text-slate-500 text-xs font-normal">equivalent</span>
            </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
        </div>
        <div className="bg-white border p-6 rounded-xl shadow-sm">
          <h2 className="text-sm font-medium text-slate-500">Cash Balance</h2>
          <p className="text-3xl font-bold text-slate-900 mt-2">{formatUsd(walletBalance.cash)}</p>
          <p className="text-xs text-slate-400 mt-1">Added via deposits</p>
        </div>
        <div className="bg-white border p-6 rounded-xl shadow-sm">
          <h2 className="text-sm font-medium text-slate-500">Bonus Balance</h2>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{formatUsd(walletBalance.bonus)}</p>
          <p className="text-xs text-slate-400 mt-1">Promotional credit</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link 
          href="/dashboard/wallet/deposit" 
          className={`bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors ${walletBalance.status === "SUSPENDED" || !walletConfig.depositEnabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <PlusCircle className="w-5 h-5" />
          Add Funds
        </Link>
        <Link 
          href="/dashboard/wallet/transfer" 
          className={`bg-slate-900 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors ${walletBalance.status === "SUSPENDED" ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Send className="w-5 h-5" />
          Send Money
        </Link>
        <Link 
          href="/dashboard/wallet/receive" 
          className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <ArrowDownToLine className="w-5 h-5" />
          Receive Money
        </Link>
        <Link 
          href="/dashboard/wallet/transactions" 
          className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <History className="w-5 h-5" />
          Transaction History
        </Link>
      </div>

      {walletConfig.bonusRate > 0 && walletConfig.depositEnabled && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <div className="flex gap-3">
            <Info className="w-6 h-6 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Current Promotion: {walletConfig.bonusRate}% Deposit Bonus</h3>
              <p className="text-sm text-blue-800 mt-1">
                Deposit $50 or more today and receive an additional {walletConfig.bonusRate}% promotional credit! 
                Bonus credit can be used on eligible purchases.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
          <Link href="/dashboard/wallet/transactions" className="text-sm text-primary font-medium hover:underline">View All</Link>
        </div>
        <div className="divide-y">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No transactions yet. Add funds to get started.
            </div>
          ) : (
            recentTransactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-900">{tx.description || tx.type}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(tx.createdAt).toLocaleDateString()} &bull; {tx.referenceType}</div>
                </div>
                <div className="text-right">
                  {tx.cashAmount !== 0 && (
                    <div className={`font-semibold ${tx.cashAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.cashAmount > 0 ? '+' : ''}{formatUsd(tx.cashAmount)}
                    </div>
                  )}
                  {tx.bonusAmount !== 0 && (
                    <div className={`text-sm ${tx.bonusAmount > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {tx.bonusAmount > 0 ? '+' : ''}{formatUsd(tx.bonusAmount)} Bonus
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
