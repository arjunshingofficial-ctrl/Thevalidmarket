import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ notification: null, notifications: [] }, { status: 200 });
    }

    // Fetch recent unread notifications for this user
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        recipientType: "USER",
        isRead: false,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (unreadNotifications.length === 0) {
      return NextResponse.json({ notification: null, notifications: [] }, { status: 200 });
    }

    // Filter notifications marked for popup or high priority
    const popupNotifications = unreadNotifications.filter((n) => {
      if (n.metadata) {
        try {
          const parsed = JSON.parse(n.metadata);
          if (parsed.isPopup === true || parsed.showOnLogin === true) {
            return true;
          }
        } catch {
          // Ignore JSON parse error
        }
      }
      // If priority is CRITICAL or HIGH, also treat as popup
      return n.priority === "CRITICAL" || n.priority === "HIGH";
    });

    const primaryNotification = popupNotifications.length > 0 ? popupNotifications[0] : null;

    return NextResponse.json({
      notification: primaryNotification,
      notifications: popupNotifications,
      totalUnread: unreadNotifications.length,
    });
  } catch (error) {
    console.error("Error fetching popup notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
