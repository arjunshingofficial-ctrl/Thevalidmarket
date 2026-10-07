import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { action } = await req.json();

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id }
    });

    if (!withdrawal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let newStatus = withdrawal.status;

    if (action === "APPROVE" && withdrawal.status === "PENDING") {
      newStatus = "APPROVED";
    } else if (action === "MARK_PAID" && (withdrawal.status === "APPROVED" || withdrawal.status === "PROCESSING" || withdrawal.status === "PENDING")) {
      newStatus = "PAID";
    } else if (action === "REJECT" && withdrawal.status !== "PAID" && withdrawal.status !== "REJECTED") {
      newStatus = "REJECTED";
    } else {
      return NextResponse.json({ error: "Invalid action or state transition" }, { status: 400 });
    }

    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: newStatus }
    });

    await createAuditLog({
      action: `WITHDRAWAL_${newStatus}`,
      entity: "WithdrawalRequest",
      entityId: id,
      metadata: { actorEmail: session.user.email, amount: withdrawal.amount }
    });

    return NextResponse.json({ success: true, status: newStatus });

  } catch (error: any) {
    console.error("Withdrawal action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
