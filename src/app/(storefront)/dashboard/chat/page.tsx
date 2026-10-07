import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommunityChatClient from "@/components/chat/CommunityChatClient";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Lock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community Chat | Dashboard",
};

export default async function DashboardChatPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  let canAccessChat = false;
  if (session.user.role === "ADMIN") {
    canAccessChat = true;
  } else {
    const paidOrders = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        paymentStatus: "PAID"
      }
    });
    if (paidOrders) {
      canAccessChat = true;
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Community Chat</h1>
        <p className="text-sm text-slate-500">Connect with other members in real-time.</p>
      </div>
      
      {!canAccessChat ? (
        <div className="flex-1 w-full max-w-5xl flex items-center justify-center p-8 bg-[#0a0a0c] border border-slate-800 rounded-xl mt-4 relative overflow-hidden shadow-2xl">
          {/* Cyberpunk grid background effect */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          
          <div className="flex flex-col items-center justify-center text-center max-w-md relative z-10">
            <div className="h-20 w-20 bg-slate-900/80 rounded flex items-center justify-center mb-6 border border-amber-500/30 relative">
              <div className="absolute inset-0 bg-amber-500/10 animate-pulse rounded"></div>
              <Lock className="h-8 w-8 text-amber-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-100 mb-2 font-mono uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="text-amber-500">{"//"}</span> ACCESS_DENIED
            </h2>
            
            <p className="text-slate-400 mb-8 font-mono text-sm leading-relaxed">
              <span className="text-slate-600 text-[10px] tracking-widest mt-1 mb-3 block">ERR_UNAUTHORIZED_ACCOUNT</span>
              The live community chat is restricted to active customers only. <br/>
              <span className="text-emerald-400 mt-2 block">Please purchase at least one product from the store to unlock live chat access.</span>
            </p>
            
            <Link 
              href="/store" 
              className="group relative px-8 py-3 bg-[#111116] text-emerald-400 font-mono font-bold border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all uppercase tracking-widest text-sm flex items-center gap-2"
            >
              <span className="absolute left-0 top-0 w-2 h-2 border-t border-l border-emerald-500"></span>
              <span className="absolute right-0 bottom-0 w-2 h-2 border-b border-r border-emerald-500"></span>
              BROWSE STORE TO UNLOCK
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full max-w-5xl mt-2">
          <CommunityChatClient user={session.user} isAdmin={session.user.role === "ADMIN"} />
        </div>
      )}
    </div>
  );
}
