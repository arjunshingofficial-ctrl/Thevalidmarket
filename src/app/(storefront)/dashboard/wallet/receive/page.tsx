import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CopyUserId from "../CopyUserId";

export default async function WalletReceivePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user || !user.accountId) redirect("/dashboard/wallet");

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
          <h1 className="text-2xl font-bold text-slate-900">Receive Money</h1>
          <p className="text-sm text-slate-500">Share your User ID with others</p>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          
          <h2 className="text-lg font-bold text-slate-900 mb-2">Your User ID</h2>
          <p className="text-sm text-slate-500 mb-6">Share this exact 8-digit number with the sender. They can use it to transfer funds directly to your wallet.</p>
          
          <div className="flex justify-center">
            <CopyUserId accountId={user.accountId} />
          </div>
        </div>
      </div>
    </div>
  );
}
