import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { messageId, reason } = await req.json();

    if (!messageId || !reason || reason.trim().length === 0) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    const report = await prisma.chatReport.create({
      data: {
        messageId,
        reporterId: session.user.id,
        reason: reason.trim(),
        status: "PENDING"
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Chat Report POST error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
