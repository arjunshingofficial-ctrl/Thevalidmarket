import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { createAdminNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const depositId = formData.get("depositId") as string;
    const transactionId = formData.get("transactionId") as string;
    const proofFile = formData.get("proof") as File | null;

    if (!depositId || !transactionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const deposit = await prisma.walletDeposit.findFirst({
      where: { id: depositId, wallet: { userId: session.user.id } }
    });

    if (!deposit || deposit.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid deposit or already submitted" }, { status: 400 });
    }

    let proofUrl = null;
    if (proofFile && proofFile.size > 0) {
      // Validate file size (max 5MB)
      if (proofFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
      }

      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp"].includes(proofFile.type)) {
        return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, and WEBP images allowed." }, { status: 400 });
      }

      const bytes = await proofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      try {
        const { storageKey } = await storage.uploadFile(buffer, proofFile.name, false);
        proofUrl = `private://${storageKey}`;
      } catch (e) {
        console.error("Failed to upload proof to storage", e);
        return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
      }
    }

    await prisma.walletDeposit.update({
      where: { id: deposit.id },
      data: {
        status: "PAYMENT_REVIEW",
        transactionId,
        proofUrl,
        submittedAt: new Date()
      }
    });

    // Notify admins about the pending manual payment
    await createAdminNotification({
      type: "WALLET",
      title: "Wallet Deposit Review",
      message: `User submitted manual proof for a $${deposit.amountUsd} wallet deposit.`,
      actionUrl: `/admin/wallets/deposits/${deposit.id}`,
      entityType: "WALLET_DEPOSIT",
      entityId: deposit.id,
      priority: "HIGH"
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Deposit submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
