import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { amount, method, details } = await req.json();

    if (!amount || isNaN(amount) || amount < 10) {
      return NextResponse.json({ error: "Invalid amount. Minimum is $10." }, { status: 400 });
    }

    if (!method || !details) {
      return NextResponse.json({ error: "Method and details are required." }, { status: 400 });
    }

    // Wrap in a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Calculate available balance
      const commissions = await tx.referralCommission.findMany({
        where: { referrerId: userId }
      });

      const now = new Date();
      let available = 0;
      
      commissions.forEach(c => {
        if (c.status === "AVAILABLE" || (c.status === "PENDING" && c.availableAt && c.availableAt <= now)) {
          available += (c.amount * c.rate);
        }
      });

      // Subtract previous withdrawals
      const withdrawals = await tx.withdrawalRequest.findMany({
        where: { 
          userId,
          status: { notIn: ["REJECTED", "CANCELLED"] }
        }
      });

      withdrawals.forEach(w => {
        available -= w.amount;
      });

      if (amount > available) {
        throw new Error("Insufficient available balance.");
      }

      // Create withdrawal request
      const request = await tx.withdrawalRequest.create({
        data: {
          userId,
          amount,
          method,
          details,
          status: "PENDING"
        }
      });

      return request;
    });

    return NextResponse.json({ success: true, withdrawal: result });

  } catch (error: any) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process withdrawal request" },
      { status: 400 }
    );
  }
}
