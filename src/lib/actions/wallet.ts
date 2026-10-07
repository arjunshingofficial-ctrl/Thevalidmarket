"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function lookupUserForTransfer(identifier: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!/^\d{8}$/.test(identifier)) {
    throw new Error("User ID must be exactly 8 digits.");
  }

  const recipient = await prisma.user.findUnique({
    where: { accountId: identifier },
    select: { id: true, name: true, accountId: true }
  });

  if (!recipient) {
    return null;
  }

  if (recipient.id === session.user.id) {
    throw new Error("Cannot transfer to yourself");
  }

  return recipient;
}

export async function transferFunds(recipientId: string, amount: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const senderId = session.user.id;
  if (senderId === recipientId) throw new Error("Cannot transfer to yourself");

  await prisma.$transaction(async (tx) => {
    // Check sender wallet
    let senderWallet = await tx.wallet.findUnique({ where: { userId: senderId } });
    if (!senderWallet || senderWallet.status !== "ACTIVE") {
      throw new Error("Your wallet is not active");
    }

    // Check sender balance
    const senderLedger = await tx.walletTransaction.aggregate({
      where: { walletId: senderWallet.id, status: "COMPLETED" },
      _sum: { cashAmount: true, bonusAmount: true }
    });
    
    // For transfers, we only allow transferring cash, or we can allow transferring total balance.
    // Let's assume total balance for now, prioritizing cash.
    const availableCash = senderLedger._sum.cashAmount || 0;
    const availableBonus = senderLedger._sum.bonusAmount || 0;

    if (availableCash + availableBonus < amount) {
      throw new Error("Insufficient wallet balance");
    }

    let cashToDeduct = 0;
    let bonusToDeduct = 0;
    if (availableCash >= amount) {
      cashToDeduct = amount;
    } else {
      cashToDeduct = availableCash;
      bonusToDeduct = amount - availableCash;
    }

    // Check recipient wallet
    let recipientWallet = await tx.wallet.findUnique({ where: { userId: recipientId } });
    if (!recipientWallet) {
      // Create wallet if recipient doesn't have one
      recipientWallet = await tx.wallet.create({
        data: { userId: recipientId, status: "ACTIVE" }
      });
    } else if (recipientWallet.status !== "ACTIVE") {
      throw new Error("Recipient wallet is not active");
    }

    // Create sender deduction transaction
    await tx.walletTransaction.create({
      data: {
        walletId: senderWallet.id,
        type: "ADJUSTMENT",
        cashAmount: -cashToDeduct,
        bonusAmount: -bonusToDeduct,
        referenceType: "TRANSFER_OUT",
        referenceId: recipientId,
        description: `Transfer to user`,
        status: "COMPLETED"
      }
    });

    // Create recipient addition transaction
    await tx.walletTransaction.create({
      data: {
        walletId: recipientWallet.id,
        type: "ADJUSTMENT",
        cashAmount: cashToDeduct,
        bonusAmount: bonusToDeduct,
        referenceType: "TRANSFER_IN",
        referenceId: senderId,
        description: `Transfer from user`,
        status: "COMPLETED"
      }
    });
  });

  revalidatePath("/dashboard/wallet");
  return { success: true };
}
