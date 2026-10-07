import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let hasPermission = session.user.role === "ADMIN";

    if (!hasPermission) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: session.user.role },
        include: { permissions: true }
      });
      
      const permissions = roleRecord?.permissions || [];
      hasPermission = permissions.some(
        (p) => (p.module === "PAYMENTS" && p.action === "VIEW") || p.action === "PAYMENTS_VIEW"
      );
    }

    if (!hasPermission) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment || !payment.proofUrl) {
      return new NextResponse("Not Found", { status: 404 });
    }

    try {
      const storageKey = payment.proofUrl.replace("private://", "").replace("/uploads/", "");
      
      if (storage.getSignedDownloadUrl) {
        const signedUrl = await storage.getSignedDownloadUrl(storageKey);
        return NextResponse.redirect(signedUrl);
      }

      const fileBuffer = await storage.getFile(storageKey, false);
      const ext = path.extname(storageKey).toLowerCase();
      
      let contentType = "application/octet-stream";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";

      return new NextResponse(fileBuffer as any, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600"
        }
      });
    } catch (err) {
      console.error("Proof storage error:", err);
      return new NextResponse("Payment proof file unavailable.", { status: 404 });
    }
  } catch (error: any) {
    console.error("Proof retrieval error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
