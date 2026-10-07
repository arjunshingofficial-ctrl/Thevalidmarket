import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { message, isInternal } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Check permissions (must be ticket owner or admin)
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
    if (ticket.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        message,
        isInternal: isAdmin ? (isInternal || false) : false
      }
    });

    // Update ticket status
    // If admin replies, status might be PENDING (waiting on user). If user replies, status OPEN.
    await prisma.supportTicket.update({
      where: { id },
      data: {
        status: isAdmin ? "PENDING" : "OPEN",
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error("Reply ticket error:", error);
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}
