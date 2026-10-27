import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        recipientType: "ADMIN",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        recipientType: "ADMIN",
        isRead: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      message,
      targetType = "ALL", // "ALL" | "USER"
      userId,
      priority = "HIGH", // "NORMAL" | "HIGH" | "CRITICAL"
      type = "ANNOUNCEMENT", // "ANNOUNCEMENT" | "PROMOTION" | "SYSTEM" | "ALERT" | "WALLET"
      actionUrl,
      isPopup = true,
    } = body;

    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    const cleanActionUrl = actionUrl?.trim() || null;

    const metadata = JSON.stringify({
      isPopup: Boolean(isPopup),
      showOnLogin: true,
      senderAdmin: session.user.email || "Admin",
      sentAt: new Date().toISOString(),
    });

    let sentCount = 0;

    if (targetType === "USER") {
      if (!userId) {
        return NextResponse.json({ error: "Specific user must be selected" }, { status: 400 });
      }

      await prisma.notification.create({
        data: {
          userId,
          recipientType: "USER",
          type,
          title: cleanTitle,
          message: cleanMessage,
          priority,
          actionUrl: cleanActionUrl,
          metadata,
        },
      });
      sentCount = 1;
    } else {
      // Broadcast to ALL registered users
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      if (users.length > 0) {
        await prisma.notification.createMany({
          data: users.map((u) => ({
            userId: u.id,
            recipientType: "USER",
            type,
            title: cleanTitle,
            message: cleanMessage,
            priority,
            actionUrl: cleanActionUrl,
            metadata,
          })),
        });
        sentCount = users.length;
      }
    }

    // Record in AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: "NOTIFICATION_DISPATCHED",
        entity: "Notification",
        metadata: JSON.stringify({
          title: cleanTitle,
          targetType,
          sentCount,
          targetUserId: targetType === "USER" ? userId : "ALL",
          isPopup,
          priority,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Notification successfully sent to ${targetType === "USER" ? "1 user" : `${sentCount} users`}.`,
      sentCount,
    });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notification" },
      { status: 500 }
    );
  }
}
