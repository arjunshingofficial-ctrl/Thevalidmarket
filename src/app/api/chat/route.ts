import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const beforeId = searchParams.get('beforeId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereClause: any = { status: { not: 'DELETED' } };
    
    // Normal users shouldn't see hidden or pending messages, unless it's their own pending message
    // Normal users should only see messages sent AFTER their first purchase
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN" && session.user.role?.name !== "ADMIN") {
      const firstPaidOrder = await prisma.order.findFirst({
        where: { userId: session.user.id, paymentStatus: 'PAID' },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      });

      // If no paid order, set threshold to current time (they'll see nothing until they buy)
      const thresholdDate = firstPaidOrder ? firstPaidOrder.createdAt : new Date();

      delete whereClause.status;
      whereClause.AND = [
        { status: { not: 'DELETED' } },
        { createdAt: { gte: thresholdDate } },
        {
          OR: [
            { status: { in: ['ACTIVE', 'APPROVED'] } },
            { status: 'PENDING', userId: session.user.id },
            { status: 'REJECTED', userId: session.user.id }
          ]
        }
      ];
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(beforeId ? { cursor: { id: beforeId }, skip: 1 } : {})
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error("Chat GET error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { message, asAdmin, customName, customRole, customAvatarSeed } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new NextResponse("Invalid message", { status: 400 });
    }

    if (message.length > 1000) {
      return new NextResponse("Message too long", { status: 400 });
    }
    
    const allowedRoles = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
    const isAdminUser = allowedRoles.includes(session.user?.role as string);
    const postAsAdmin = asAdmin && isAdminUser;

    let customIdentity: string | null = null;
    if (isAdminUser && customName) {
      customIdentity = JSON.stringify({
        name: customName.substring(0, 50),
        role: customRole !== undefined ? customRole.substring(0, 20) : "ADMIN",
        avatarSeed: customAvatarSeed || "SYSTEM"
      });
    }

    // Check moderation setting
    const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
    let isModerationOn = false;
    if (settings?.chatConfig) {
      try {
        const chatConfig = JSON.parse(settings.chatConfig);
        isModerationOn = chatConfig.moderationMode === true;
      } catch (e) {}
    }

    const initialStatus = (isModerationOn && !isAdminUser) ? 'PENDING' : 'ACTIVE';

    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        message: message.trim(),
        isAdmin: postAsAdmin,
        status: initialStatus,
        customIdentity
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: { select: { name: true } }
          }
        }
      }
    });

    return NextResponse.json(chatMessage);
  } catch (error) {
    console.error("Chat POST error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
