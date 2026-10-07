"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { createAdminNotification, createUserNotification } from "@/lib/notifications";

export async function updateUser(userId: string, data: { name?: string, email?: string, roleId?: string }) {
  const session = await getServerSession(authOptions) as any;
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await getServerSession(authOptions) as any;
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

import { getWalletBalance } from "@/lib/wallet";

export async function adjustUserWallet(userId: string, amount: number, type: "ADD" | "REMOVE", reason: string) {
  const session = await getServerSession(authOptions) as any;
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const walletBalance = await getWalletBalance(userId);
  const currentBalance = walletBalance.total;
  
  if (type === "REMOVE" && currentBalance < amount) {
    throw new Error("Cannot remove more than the current balance.");
  }

  await prisma.$transaction(async (tx) => {
    // Ensure wallet exists
    let wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({ data: { userId } });
    }

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "ADJUSTMENT",
        cashAmount: type === "ADD" ? amount : -amount,
        bonusAmount: 0,
        status: "COMPLETED",
        description: `Admin Adjustment: ${reason}`,
      }
    });
  });

  // Notify user
  await createUserNotification({
    userId,
    type: "WALLET",
    title: "Wallet Updated",
    message: `Your wallet balance was updated by Admin. ${type === "ADD" ? "+" : "-"}$${amount.toFixed(2)}. Reason: ${reason}`,
    priority: "NORMAL"
  });

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions) as any;
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/admin/users");
  return { success: true };
}
