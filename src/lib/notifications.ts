import { prisma } from "@/lib/prisma";

export async function createUserNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}) {
  try {
    // Basic idempotency check if entityId is provided
    if (data.entityId && data.entityType) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: data.userId,
          recipientType: "USER",
          type: data.type,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      });
      if (existing) return existing;
    }

    return await prisma.notification.create({
      data: {
        userId: data.userId,
        recipientType: "USER",
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || "NORMAL",
        actionUrl: data.actionUrl,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create user notification:", error);
    return null;
  }
}

export async function createAdminNotification(data: {
  type: string;
  title: string;
  message: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}) {
  try {
    if (data.entityId && data.entityType) {
      const existing = await prisma.notification.findFirst({
        where: {
          recipientType: "ADMIN",
          type: data.type,
          entityType: data.entityType,
          entityId: data.entityId,
        },
      });
      if (existing) return existing;
    }

    return await prisma.notification.create({
      data: {
        recipientType: "ADMIN",
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || "NORMAL",
        actionUrl: data.actionUrl,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create admin notification:", error);
    return null;
  }
}
