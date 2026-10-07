import { prisma } from "@/lib/prisma";
import { Bell, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminNotifications() {
  const notifications = await prisma.notification.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">Manage system and user notifications.</p>
        </div>
        <a href="/admin/notifications/new"
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Send Notification
        </a>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="divide-y">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-medium text-slate-900">No notifications sent</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-5 hover:bg-slate-50 flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-900">{n.title}</div>
                      <div className="text-sm text-slate-600 mt-0.5">{n.message}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        To: {n.user ? (n.user.name || n.user.email) : "All Users"} · {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                      n.isRead ? "bg-slate-100 text-slate-500" : "bg-blue-100 text-blue-700"
                    }`}>{n.isRead ? "Read" : "Unread"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
