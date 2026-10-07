import { prisma } from "@/lib/prisma";
import { MessageSquare } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSupport() {
  await requireAdmin("Support", "View");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: true,
      replies: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Support Tickets</h1>
        <p className="text-slate-500 mt-1">Manage customer inquiries and issues.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Subject / Customer</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No support tickets found</p>
                </td>
              </tr>
            ) : (
              tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/admin/support/${ticket.id}`} className="block">
                      <div className="font-medium text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">{ticket.subject}</div>
                      <div className="text-xs text-slate-500 mt-1">{ticket.user.email}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      ticket.priority === "HIGH" ? "bg-red-50 text-red-700" :
                      ticket.priority === "URGENT" ? "bg-red-100 text-red-800 font-bold" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      ticket.status === "OPEN" ? "bg-emerald-50 text-emerald-700" :
                      ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "bg-slate-100 text-slate-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {new Date(ticket.updatedAt).toLocaleString()}
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
