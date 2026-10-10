"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const roleId = formData.get("roleId") as string;
  const accountId = formData.get("accountId") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "Email is already in use" };
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        accountId: accountId || null,
        ...(roleId ? { roleId } : {}),
      },
    });

    // Also create a wallet for the new user automatically
    await prisma.wallet.create({
      data: {
        userId: user.id
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message || "Failed to create user" };
  }
}
