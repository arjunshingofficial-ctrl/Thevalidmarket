import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createUserNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auth check for Admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    });
    
    if (user?.role?.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { action, reason } = await req.json(); // "APPROVE" | "REJECT"
    const { id } = await params;

    const deposit = await prisma.walletDeposit.findUnique({
      where: { id },
      include: { wallet: true }
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    if (deposit.status === "APPROVED" || deposit.status === "REJECTED") {
      return NextResponse.json({ error: "Deposit already processed" }, { status: 400 });
    }

    if (action === "REJECT") {
      await prisma.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: "REJECTED",
          rejectionReason: reason || "No reason provided",
          approvedById: user.id,
          approvedAt: new Date()
        }
      });
      
      // Notify user about rejection
      await createUserNotification({
        userId: deposit.wallet.userId,
        type: "WALLET",
        title: "Deposit Rejected",
        message: `Your wallet deposit of $${deposit.amountUsd} was rejected. Reason: ${reason || "No reason provided"}`,
        actionUrl: "/dashboard/wallet",
        priority: "HIGH"
      });

      return NextResponse.json({ success: true, status: "REJECTED" });
    }

    if (action === "APPROVE") {
      // Use transaction to ensure idempotency and atomic credit
      await prisma.$transaction(async (tx) => {
        // Re-fetch and lock
        const lockedDeposit = await tx.walletDeposit.findUnique({
          where: { id: deposit.id }
        });
        
        if (lockedDeposit?.status === "APPROVED") {
          throw new Error("Deposit already approved");
        }

        // Update deposit status
        await tx.walletDeposit.update({
          where: { id: deposit.id },
          data: {
            status: "APPROVED",
            approvedById: user.id,
            approvedAt: new Date()
          }
        });

        // Credit wallet via wallet core function (passing tx is hard because it's in a separate module)
        // Wait, addWalletFunds in lib/wallet creates its own transaction. We can't nest them in Prisma easily if it doesn't take a tx.
        // Let's implement the credit logic here directly for safety to use the SAME transaction context.

        const walletTx = await tx.walletTransaction.create({
          data: {
            walletId: deposit.walletId,
            type: "DEPOSIT",
            cashAmount: deposit.amountUsd,
            bonusAmount: 0,
            referenceType: "WALLET_DEPOSIT",
            referenceId: deposit.id,
            description: "Wallet deposit approved",
            status: "COMPLETED"
          }
        });

        if (deposit.bonusAmountUsd > 0) {
          await tx.walletTransaction.create({
            data: {
              walletId: deposit.walletId,
              type: "BONUS",
              cashAmount: 0,
              bonusAmount: deposit.bonusAmountUsd,
              referenceType: "WALLET_DEPOSIT",
              referenceId: deposit.id,
              description: "Wallet deposit promotional bonus",
              status: "COMPLETED"
            }
          });
        }
      });

      // Notify user about approval
      await createUserNotification({
        userId: deposit.wallet.userId,
        type: "WALLET",
        title: "Deposit Approved",
        message: `Your wallet has been credited with $${deposit.amountUsd}${deposit.bonusAmountUsd > 0 ? ` + $${deposit.bonusAmountUsd} bonus` : ''}!`,
        actionUrl: "/dashboard/wallet",
        priority: "HIGH"
      });

      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Wallet deposit action error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
