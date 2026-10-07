"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getChatModerationSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  if (!settings?.chatConfig) return { moderationMode: false };
  try {
    return JSON.parse(settings.chatConfig);
  } catch {
    return { moderationMode: false };
  }
}

export async function updateChatModerationSettings(moderationMode: boolean) {
  const session = await getServerSession(authOptions) as any;
  const allowedRoles = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session?.user?.role)) throw new Error("Unauthorized");

  const settings = await prisma.siteSettings.upsert({
    where: { id: "GLOBAL" },
    update: { chatConfig: JSON.stringify({ moderationMode }) },
    create: { id: "GLOBAL", chatConfig: JSON.stringify({ moderationMode }) }
  });
  return true;
}

export async function getPendingMessages() {
  const session = await getServerSession(authOptions) as any;
  const allowedRoles = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session?.user?.role)) throw new Error("Unauthorized");

  const messages = await prisma.chatMessage.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, role: { select: { name: true } } }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
  return messages;
}

export async function moderateMessage(messageId: string, action: "APPROVE" | "REJECT", newMessage?: string) {
  const session = await getServerSession(authOptions) as any;
  const allowedRoles = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session?.user?.role)) throw new Error("Unauthorized");

  const status = action === "APPROVE" ? "APPROVED" : "REJECTED";
  
  const data: any = { 
    status,
    moderatedAt: new Date(),
    moderatedById: session.user.id
  };

  if (newMessage && newMessage.trim().length > 0) {
    data.message = newMessage.trim();
  }

  await prisma.chatMessage.update({
    where: { id: messageId },
    data
  });
  
  return true;
}
