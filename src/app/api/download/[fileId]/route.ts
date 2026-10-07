import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { storage } from "@/lib/storage";
import path from "path";

export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const { fileId } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await prisma.productFile.findUnique({
      where: { id: fileId },
      include: { product: true }
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check entitlement: 
    // Is admin/staff?
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role);
    
    let hasEntitlement = isAdmin;

    if (!isAdmin) {
      // Check if user has an active entitlement for this file
      const entitlementCount = await prisma.entitlement.count({
        where: {
          userId: session.user.id,
          productId: file.productId,
          type: "DOWNLOAD",
          status: "ACTIVE"
        }
      });
      if (entitlementCount > 0) hasEntitlement = true;
    }

    if (!hasEntitlement) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this file" }, { status: 403 });
    }

    // Log the download for metrics
    if (!isAdmin) {
      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorEmail: session.user.email,
          action: "FILE_DOWNLOADED",
          entity: "ProductFile",
          entityId: file.id
        }
      });
      
      // Update Download tracking record
      const activeEntitlement = await prisma.entitlement.findFirst({
        where: { userId: session.user.id, productId: file.productId, type: "DOWNLOAD", status: "ACTIVE" }
      });
      
      if (activeEntitlement) {
        const existingDownload = await prisma.download.findFirst({
          where: { userId: session.user.id, productFileId: file.id, orderId: activeEntitlement.orderId }
        });
        
        if (existingDownload) {
          await prisma.download.update({
            where: { id: existingDownload.id },
            data: { downloadCount: { increment: 1 }, lastDownload: new Date() }
          });
        } else {
          await prisma.download.create({
            data: {
              userId: session.user.id,
              productFileId: file.id,
              orderId: activeEntitlement.orderId,
              downloadCount: 1,
              lastDownload: new Date()
            }
          });
        }
      }
    }

    try {
      if (storage.getSignedDownloadUrl) {
        const signedUrl = await storage.getSignedDownloadUrl(file.storageKey);
        return NextResponse.redirect(signedUrl);
      }

      const fileBuffer = await storage.getFile(file.storageKey, false);
      const headers = new Headers();
      headers.set("Content-Disposition", `attachment; filename="${file.originalName}"`);
      if (file.mimeType) headers.set("Content-Type", file.mimeType);
      headers.set("Content-Length", file.fileSize.toString());

      return new NextResponse(fileBuffer as any, {
        status: 200,
        headers
      });
    } catch (e) {
      console.error("Storage error:", e);
      return NextResponse.json({ error: "File currently unavailable." }, { status: 404 });
    }

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
