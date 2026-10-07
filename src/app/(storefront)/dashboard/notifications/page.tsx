import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1">Stay updated with your orders and account.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="text-muted-foreground mb-4">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map(notif => (
              <div key={notif.id} className={`p-4 flex flex-col gap-1 transition-colors ${notif.isRead ? 'bg-white' : 'bg-slate-50'}`}>
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`font-semibold text-slate-900 ${!notif.isRead && 'text-primary'}`}>{notif.title}</h4>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-600">{notif.message}</p>
                {notif.actionUrl && (
                  <Link href={notif.actionUrl} className="text-xs font-medium text-primary mt-2 hover:underline w-fit">
                    View Details &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
