import { prisma } from "@/lib/prisma";
import { Bell, Megaphone, Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, Info, ExternalLink } from "lucide-react";
import { SendNotificationModal } from "@/components/admin/SendNotificationModal";

export const dynamic = "force-dynamic";

export default async function AdminNotifications() {
  const [notifications, users] = await Promise.all([
    prisma.notification.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const totalSent = notifications.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const popupCount = notifications.filter((n) => {
    if (n.priority === "HIGH" || n.priority === "CRITICAL") return true;
    if (n.metadata) {
      try {
        const parsed = JSON.parse(n.metadata);
        return Boolean(parsed.isPopup || parsed.showOnLogin);
      } catch {}
    }
    return false;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage system notifications, broadcast announcements, and configure user login pop-ups.
          </p>
        </div>
        <SendNotificationModal
          users={users}
          triggerButtonText="Send Notification"
        />
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dispatched</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalSent}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pop-up Notifications</span>
            <div className="text-2xl font-black text-indigo-950 mt-0.5">{popupCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Megaphone className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Unread by Users</span>
            <div className="text-2xl font-black text-amber-950 mt-0.5">{unreadCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Notification History &amp; Logs
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Showing latest {notifications.length} entries
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-bold text-slate-900 text-base">No notifications sent yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Click &quot;Send Notification&quot; above to broadcast your first message.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              let isPopup = n.priority === "HIGH" || n.priority === "CRITICAL";
              if (n.metadata) {
                try {
                  const parsed = JSON.parse(n.metadata);
                  if (parsed.isPopup || parsed.showOnLogin) isPopup = true;
                } catch {}
              }

              return (
                <div key={n.id} className="p-5 hover:bg-slate-50/70 transition-colors flex items-start gap-4">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    n.priority === "CRITICAL"
                      ? "bg-rose-100 text-rose-600"
                      : n.type === "PROMOTION"
                      ? "bg-amber-100 text-amber-600"
                      : n.type === "ALERT"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {n.priority === "CRITICAL" ? (
                      <ShieldAlert className="h-5 w-5" />
                    ) : n.type === "PROMOTION" ? (
                      <Sparkles className="h-5 w-5" />
                    ) : n.type === "ALERT" ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Megaphone className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 text-base">{n.title}</span>
                          
                          {/* Type Badge */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 uppercase tracking-wider">
                            {n.type}
                          </span>

                          {/* Pop-up Badge */}
                          {isPopup && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                              ⚡ Pop-up on Login
                            </span>
                          )}

                          {/* Priority Badge */}
                          {n.priority !== "NORMAL" && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              n.priority === "CRITICAL" 
                                ? "bg-rose-100 text-rose-700 border border-rose-200" 
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                            }`}>
                              {n.priority}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                          {n.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
                          <span>
                            To: <strong className="text-slate-700">{n.user ? (n.user.name || n.user.email) : "All Users (Broadcast)"}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(n.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {n.actionUrl && (
                            <>
                              <span>•</span>
                              <a
                                href={n.actionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-1 font-semibold"
                              >
                                Link: {n.actionUrl}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                        n.isRead 
                          ? "bg-slate-100 text-slate-500" 
                          : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}>
                        {n.isRead ? "Read by User" : "Unread"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
