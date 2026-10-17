"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export interface ContactInquiryResult {
  success: boolean;
  message: string;
  referenceId?: string;
}

export async function submitContactInquiry(formData: FormData): Promise<ContactInquiryResult> {
  try {
    const name = formData.get("name")?.toString()?.trim() || "";
    const email = formData.get("email")?.toString()?.trim() || "";
    const subject = formData.get("subject")?.toString()?.trim() || "";
    const category = formData.get("category")?.toString()?.trim() || "GENERAL";
    const orderId = formData.get("orderId")?.toString()?.trim() || "";
    const message = formData.get("message")?.toString()?.trim() || "";

    // Validation
    if (!name || name.length < 2) {
      return { success: false, message: "Please provide your full name." };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: "Please enter a valid email address." };
    }
    if (!message || message.length < 10) {
      return { success: false, message: "Message must be at least 10 characters long." };
    }

    const session = (await getServerSession(authOptions)) as any;
    let ticket = null;

    // Build formatted message body
    const fullMessage = [
      `Name: ${name}`,
      `Email: ${email}`,
      orderId ? `Order / License Reference: ${orderId}` : null,
      `Category: ${category}`,
      `\nMessage:\n${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    // If user is logged in or user with this email exists, link to SupportTicket
    let targetUserId = session?.user?.id;
    if (!targetUserId) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        targetUserId = existingUser.id;
      }
    }

    if (targetUserId) {
      try {
        ticket = await prisma.supportTicket.create({
          data: {
            userId: targetUserId,
            subject: subject || `Inquiry from ${name} (${category})`,
            category: category.toUpperCase(),
            priority: category === "PAYMENT" || category === "ORDER" ? "HIGH" : "NORMAL",
            status: "OPEN",
            message: fullMessage,
          },
        });
      } catch (err) {
        console.error("Failed to create support ticket:", err);
      }
    }

    // Always create an Admin Notification to alert moderators & staff
    const referenceId = ticket ? `TKT-${ticket.id.slice(-6).toUpperCase()}` : `INQ-${Date.now().toString().slice(-6)}`;

    await prisma.notification.create({
      data: {
        recipientType: "ADMIN",
        type: "SUPPORT",
        title: `New Support Inquiry: ${name} [${referenceId}]`,
        message: `${email} (${category}): ${subject || message.slice(0, 80)}`,
        actionUrl: ticket ? `/admin/support/${ticket.id}` : "/admin/support",
        entityType: "ContactInquiry",
        entityId: referenceId,
        metadata: JSON.stringify({
          name,
          email,
          subject,
          category,
          orderId,
          message,
          ticketId: ticket?.id,
          referenceId,
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    return {
      success: true,
      message: "Thank you for reaching out! Your inquiry has been dispatched to our technical support desk.",
      referenceId,
    };
  } catch (error: any) {
    console.error("Error submitting contact inquiry:", error);
    return {
      success: false,
      message: error?.message || "Failed to submit inquiry. Please try contacting us via Telegram or WhatsApp.",
    };
  }
}
