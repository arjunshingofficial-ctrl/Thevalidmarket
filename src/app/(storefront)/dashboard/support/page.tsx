import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessageSquare, Plus, Send } from "lucide-react";
import Link from "next/link";
import { getSupportSettings } from "@/lib/settings/support";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const [tickets, { telegramUrl }] = await Promise.all([
    prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" }
    }),
    getSupportSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Desk</h1>
          <p className="text-muted-foreground mt-1">Get dedicated technical help with your orders, licenses, and account.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Telegram VIP Support</span>
            </a>
          )}
          <Link href="/dashboard/support/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 shadow-sm">
            <Plus className="h-4 w-4" /> New Ticket
          </Link>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Subject</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900">No support tickets</h3>
                  <p className="mt-1 text-slate-500">You haven&apos;t opened any support tickets yet.</p>
                  {telegramUrl && (
                    <div className="mt-4">
                      <a
                        href={telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 font-semibold text-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Chat directly on Telegram Support</span>
                      </a>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/support/${ticket.id}`} className="block">
                      <div className="font-medium text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{ticket.subject}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      ticket.status === "OPEN" ? "bg-emerald-50 text-emerald-700" :
                      ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "bg-slate-100 text-slate-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {ticket.status === "PENDING" ? "RESPONDED" : ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
