import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, all } = await req.json();

    if (all) {
      await prisma.notification.updateMany({
        where: {
          recipientType: "ADMIN",
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    } else if (id) {
      await prisma.notification.updateMany({
        where: {
          id: id,
          recipientType: "ADMIN",
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating admin notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
