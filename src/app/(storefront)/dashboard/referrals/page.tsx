import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Copy, Users, DollarSign, Wallet, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import ReferralLinkClient from "@/components/referrals/ReferralLinkClient";

export const dynamic = "force-dynamic";

export default async function ReferralsDashboard() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Ensure user has a referral code
  let refCode = await prisma.referralCode.findUnique({
    where: { userId }
  });

  if (!refCode) {
    // Generate one if it doesn't exist
    const username = session.user.name || session.user.email.split("@")[0] || "USER";
    const baseCode = username.substring(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    try {
      refCode = await prisma.referralCode.create({
        data: { userId, code: `${baseCode}${randomSuffix}` }
      });
    } catch (e) {
      refCode = await prisma.referralCode.create({
        data: { userId, code: `REF${userId.substring(userId.length - 6).toUpperCase()}` }
      });
    }
  }

  // Get commissions
  const commissions = await prisma.referralCommission.findMany({
    where: { referrerId: userId },
    include: {
      referred: { select: { id: true, name: true, createdAt: true } },
      order: { select: { id: true, total: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // Calculate stats
  let pending = 0;
  let available = 0;
  let paid = 0;
  let totalEarned = 0;
  
  const now = new Date();

  commissions.forEach(c => {
    if (c.status === "PAID") {
      paid += c.amount * c.rate;
      totalEarned += c.amount * c.rate;
    } else if (c.status === "PENDING") {
      // Check if hold period is over
      if (c.availableAt && c.availableAt <= now) {
        available += c.amount * c.rate;
        totalEarned += c.amount * c.rate;
      } else {
        pending += c.amount * c.rate;
        totalEarned += c.amount * c.rate;
      }
    } else if (c.status === "AVAILABLE") {
      available += c.amount * c.rate;
      totalEarned += c.amount * c.rate;
    }
  });

  // Get total referrals (people who signed up using code)
  const totalReferrals = await prisma.referral.count({
    where: { referrerId: userId }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
        <p className="text-muted-foreground mt-1">Invite friends and earn 30% commission on eligible purchases.</p>
      </div>

      <ReferralLinkClient referralCode={refCode.code} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Earned</p>
              <h3 className="text-2xl font-bold">${totalEarned.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <h3 className="text-2xl font-bold">${pending.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Available</p>
              <h3 className="text-2xl font-bold text-emerald-700">${available.toFixed(2)}</h3>
            </div>
          </div>
          {available >= 500 && (
            <div className="absolute top-4 right-4 z-10">
              <Link href="/dashboard/referrals/withdraw" className="text-xs bg-emerald-600 text-white px-2 py-1 rounded shadow-sm hover:bg-emerald-700">
                Withdraw
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Referrals</p>
              <h3 className="text-2xl font-bold">{totalReferrals}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Referral History</h3>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Referred User</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Commission</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p>No successful referrals yet. Share your link to start earning!</p>
                </td>
              </tr>
            ) : (
              commissions.map(c => {
                const isPending = c.status === "PENDING" && c.availableAt && c.availableAt > now;
                const isAvailable = c.status === "AVAILABLE" || (c.status === "PENDING" && c.availableAt && c.availableAt <= now);
                const displayStatus = c.status === "PAID" ? "PAID" : isAvailable ? "AVAILABLE" : isPending ? "PENDING" : c.status;
                const earned = (c.amount * c.rate).toFixed(2);
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      Customer #{c.referred.id.substring(c.referred.id.length - 4).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-semibold text-emerald-600">${earned}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        displayStatus === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" :
                        displayStatus === "PAID" ? "bg-slate-100 text-slate-700" :
                        displayStatus === "PENDING" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {displayStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 rounded-xl p-6 border text-sm text-slate-700 space-y-3">
        <h4 className="font-semibold text-slate-900 text-base">How it works</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>Share your unique referral link with your friends and followers.</li>
          <li>When someone creates a new account using your link, they become your referral.</li>
          <li>You earn a <strong>10% commission</strong> on every purchase.</li>
          <li>Commissions are added <strong>instantly</strong> to your balance (purchases made with bonus money do not count).</li>
          <li>You can withdraw your earnings (Minimum withdrawal: $10).</li>
        </ol>
      </div>
    </div>
  );
}
