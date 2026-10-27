import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { SendNotificationModal } from "@/components/admin/SendNotificationModal";

export const dynamic = "force-dynamic";

export default async function NewNotificationPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/notifications"
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Dispatch Notification
          </h1>
          <p className="text-slate-500 text-sm">
            Send high-visibility notifications or login pop-up announcements.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <SendNotificationModal users={users} defaultOpen={true} />
      </div>
    </div>
  );
}
