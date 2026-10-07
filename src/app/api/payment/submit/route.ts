import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { createAuditLog } from "@/lib/actions/admin";
import { createUserNotification, createAdminNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.formData();
    const paymentId = data.get("paymentId") as string;
    const transactionId = data.get("transactionId") as string;
    const note = data.get("note") as string;
    const proofFile = data.get("proof") as File | null;

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
    }

    // Lock payment check
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (payment.status !== "PAYMENT_REQUIRED") {
      return NextResponse.json({ error: "Payment is no longer accepting submissions" }, { status: 400 });
    }

    // Check expiry manually on server
    if (payment.expiresAt && new Date() > payment.expiresAt) {
      await prisma.payment.update({ where: { id: paymentId }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "Payment window has expired" }, { status: 400 });
    }

    let proofUrl = null;
    if (proofFile && proofFile.size > 0) {
      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp"].includes(proofFile.type)) {
        return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WEBP allowed." }, { status: 400 });
      }
      
      const arrayBuffer = await proofFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Save proof privately
      const saved = await storage.uploadFile(buffer, proofFile.name, false);
      proofUrl = saved.storageKey; // Store key/url for admin review
    }

    // Update Payment
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    if (note) {
      metadata.customerNote = note;
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "PAYMENT_REVIEW",
          transactionId: transactionId || payment.transactionId,
          proofUrl,
          submittedAt: new Date(),
          metadata: JSON.stringify(metadata)
        }
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "PAYMENT_REVIEW",
          orderStatus: "ON_HOLD"
        }
      })
    ]);

    await createAuditLog({
      action: "PAYMENT_SUBMITTED",
      entity: "Payment",
      entityId: paymentId,
      metadata: { transactionId, actorId: session.user.id }
    });

    // Trigger Notifications
    Promise.all([
      createUserNotification({
        userId: session.user.id,
        type: "PAYMENT",
        title: "Payment Submitted",
        message: `Your payment for Order #${payment.orderId.slice(0,8)} is now awaiting verification.`,
        priority: "NORMAL",
        actionUrl: `/dashboard/orders/${payment.orderId}`,
        entityType: "PAYMENT",
        entityId: payment.id
      }),
      createAdminNotification({
        type: "PAYMENT",
        title: "Payment Proof Submitted",
        message: `${session.user.name || session.user.email} submitted payment proof for Order #${payment.orderId.slice(0,8)}. Review required.`,
        priority: "HIGH",
        actionUrl: `/admin/orders/${payment.orderId}`,
        entityType: "PAYMENT",
        entityId: payment.id
      })
    ]).catch(err => console.error("Notification trigger failed", err));

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Payment submit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
