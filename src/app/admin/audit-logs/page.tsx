import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const actionColors: Record<string, string> = {
    PRODUCT_CREATED: "bg-emerald-100 text-emerald-700",
    PRODUCT_EDITED: "bg-blue-100 text-blue-700",
    PRODUCT_DELETED: "bg-red-100 text-red-700",
    PRODUCT_ARCHIVED: "bg-amber-100 text-amber-700",
    CATEGORY_CREATED: "bg-emerald-100 text-emerald-700",
    CATEGORY_EDITED: "bg-blue-100 text-blue-700",
    CATEGORY_DELETED: "bg-red-100 text-red-700",
    CUSTOMER_SUSPENDED: "bg-red-100 text-red-700",
    PAYMENT_SETTINGS_CHANGED: "bg-purple-100 text-purple-700",
    FIELD_CREATED: "bg-emerald-100 text-emerald-700",
    FIELD_DELETED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">Track all administrative actions performed on this platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Actor</th>
                <th className="px-6 py-4 font-semibold">Entity</th>
                <th className="px-6 py-4 font-semibold">Entity ID</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="font-medium text-slate-900">No audit logs yet</p>
                    <p className="text-sm">Admin actions will be recorded here automatically.</p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || "bg-slate-100 text-slate-700"}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{log.actorEmail || "System"}</td>
                    <td className="px-6 py-4 text-slate-600">{log.entity}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.entityId?.slice(0, 12) || "—"}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {logs.length > 0 && (
          <div className="p-4 border-t bg-slate-50 text-sm text-slate-500">
            Showing last {logs.length} entries. Older entries are retained in database.
          </div>
        )}
      </div>
    </div>
  );
}
