import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import WithdrawalActionClient from "@/components/admin/WithdrawalActionClient";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalView({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("Referrals", "Manage");
  
  const { id } = await params;

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      user: true
    }
  });

  if (!withdrawal) {
    redirect("/admin/referrals");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/referrals" className="p-2 border rounded-md hover:bg-slate-50 transition-colors">
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Review Withdrawal</h1>
          <p className="text-sm text-slate-500 mt-1">Review and process affiliate payout.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Request Details</h3>
          
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-bold text-emerald-600 text-lg">${withdrawal.amount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-slate-500">Status</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              withdrawal.status === "PENDING" ? "bg-amber-50 text-amber-700" :
              withdrawal.status === "APPROVED" || withdrawal.status === "PROCESSING" ? "bg-blue-50 text-blue-700" :
              withdrawal.status === "PAID" ? "bg-emerald-50 text-emerald-700" :
              "bg-red-50 text-red-700"
            }`}>
              {withdrawal.status}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Method</span>
            <span className="font-medium">{withdrawal.method}</span>
          </div>
          
          <div>
            <span className="text-slate-500 block mb-1">Payment Details</span>
            <div className="p-3 bg-slate-50 rounded border text-sm font-mono whitespace-pre-wrap">
              {withdrawal.details}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2">User Details</h3>
          
          <div className="flex justify-between">
            <span className="text-slate-500">Name</span>
            <span className="font-medium">{withdrawal.user.name || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-medium">{withdrawal.user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Registered</span>
            <span className="font-medium">{new Date(withdrawal.user.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t mt-6">
            <h4 className="font-semibold text-slate-900 mb-4">Actions</h4>
            <WithdrawalActionClient withdrawalId={withdrawal.id} currentStatus={withdrawal.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
