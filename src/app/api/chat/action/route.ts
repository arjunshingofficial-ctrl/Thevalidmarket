import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    const allowedRoles = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
    const isAdminUser = allowedRoles.includes(session.user?.role as string);
    
    if (!isAdminUser) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { messageId, action } = await req.json();

    if (!messageId || !action) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    if (action === 'DELETE' || action === 'HIDE') {
      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: { status: action === 'DELETE' ? 'DELETED' : 'HIDDEN' }
      });
      return NextResponse.json(updated);
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Chat Action POST error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
