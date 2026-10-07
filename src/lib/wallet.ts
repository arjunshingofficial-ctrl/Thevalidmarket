import { prisma } from "@/lib/prisma";

export async function getWalletBalance(userId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: { transactions: true }
  });

  if (!wallet) {
    return { cash: 0, bonus: 0, total: 0, exists: false };
  }

  // Calculate authoritative balance from ledger
  const { _sum } = await prisma.walletTransaction.aggregate({
    where: { walletId: wallet.id, status: "COMPLETED" },
    _sum: {
      cashAmount: true,
      bonusAmount: true
    }
  });

  const cash = _sum.cashAmount || 0;
  const bonus = _sum.bonusAmount || 0;

  return {
    cash,
    bonus,
    total: cash + bonus,
    exists: true,
    status: wallet.status
  };
}

export async function createWalletIfNotExists(userId: string) {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.wallet.create({
    data: {
      userId,
      status: "ACTIVE"
    }
  });
}

// Ensure atomicity by wrapping in a transaction
export async function deductWalletFunds(userId: string, amountToDeductUsd: number, referenceType: string, referenceId: string, description: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get wallet
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.status !== "ACTIVE") {
      throw new Error("Wallet is suspended");
    }

    // 2. Re-calculate actual balances inside transaction
    const { _sum } = await tx.walletTransaction.aggregate({
      where: { walletId: wallet.id, status: "COMPLETED" },
      _sum: {
        cashAmount: true,
        bonusAmount: true
      }
    });

    let availableCash = _sum.cashAmount || 0;
    let availableBonus = _sum.bonusAmount || 0;

    if (availableCash + availableBonus < amountToDeductUsd) {
      throw new Error("Insufficient wallet balance");
    }

    // 3. Determine deduction split (Cash preferred, then bonus)
    // Could read priority from settings, default to Cash first
    let cashToDeduct = 0;
    let bonusToDeduct = 0;

    if (availableCash >= amountToDeductUsd) {
      cashToDeduct = amountToDeductUsd;
    } else {
      cashToDeduct = availableCash;
      bonusToDeduct = amountToDeductUsd - availableCash;
    }

    // 4. Create ledger entry
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "PURCHASE",
        cashAmount: -cashToDeduct,
        bonusAmount: -bonusToDeduct,
        referenceType,
        referenceId,
        description,
        status: "COMPLETED"
      }
    });

    return {
      success: true,
      transaction,
      cashDeducted: cashToDeduct,
      bonusDeducted: bonusToDeduct
    };
  });
}

export async function addWalletFunds(userId: string, cashToAdd: number, bonusToAdd: number, referenceType: string, referenceId: string, description: string) {
  return await prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({ data: { userId } });
    }

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT", // Usually DEPOSIT or BONUS or ADJUSTMENT
        cashAmount: cashToAdd,
        bonusAmount: bonusToAdd,
        referenceType,
        referenceId,
        description,
        status: "COMPLETED"
      }
    });

    return transaction;
  });
}
