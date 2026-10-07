import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWalletBalance } from "@/lib/wallet";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import TransferClient from "./TransferClient";

export const dynamic = "force-dynamic";

export default async function WalletTransferPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const walletBalance = await getWalletBalance(session.user.id);

  if (walletBalance.status === "SUSPENDED") {
    redirect("/dashboard/wallet?error=suspended");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/wallet" 
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transfer Funds</h1>
          <p className="text-sm text-slate-500">Send money instantly to other users</p>
        </div>
      </div>

      <div className="py-6">
        <TransferClient currentBalance={walletBalance.total} />
      </div>
    </div>
  );
}
