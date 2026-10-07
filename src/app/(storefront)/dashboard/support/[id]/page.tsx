import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, User, ShieldAlert } from "lucide-react";
import Link from "next/link";
import TicketReplyForm from "@/components/support/TicketReplyForm";

export const dynamic = "force-dynamic";

export default async function TicketViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      replies: {
        include: { user: { include: { role: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  if (!ticket || ticket.userId !== session.user.id) {
    redirect("/dashboard/support");
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/support" className="p-2 border rounded-md hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{ticket.subject}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-500">Ticket #{ticket.id.slice(-8).toUpperCase()}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                ticket.status === "OPEN" ? "bg-emerald-50 text-emerald-700" :
                ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "bg-slate-100 text-slate-700" :
                "bg-blue-50 text-blue-700"
              }`}>
                {ticket.status === "PENDING" ? "RESPONDED" : ticket.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Original Message */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 border">
              <User className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">You (Customer)</div>
              <div className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
            {ticket.message}
          </div>
        </div>

        {/* Replies */}
        {ticket.replies.map((reply: any) => {
          const isStaff = reply.user?.role?.name === "ADMIN" || reply.user?.role?.name === "SUPER_ADMIN";
          
          return (
            <div key={reply.id} className={`rounded-xl border shadow-sm p-6 ${isStaff ? 'bg-primary/5 border-primary/20' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${isStaff ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                  {isStaff ? <ShieldAlert className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {isStaff ? "Support Team" : "You (Customer)"}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(reply.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                {reply.message}
              </div>
            </div>
          );
        })}

        {/* Reply Form */}
        {ticket.status !== "CLOSED" && (
          <TicketReplyForm ticketId={ticket.id} />
        )}
        
        {ticket.status === "CLOSED" && (
          <div className="p-4 bg-slate-50 text-slate-500 text-center rounded-lg border text-sm">
            This ticket is closed and cannot receive new replies.
          </div>
        )}
      </div>
    </div>
  );
}
