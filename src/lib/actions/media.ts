"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAuditLog, requireAdmin } from "./admin";
import path from "path";
import crypto from "crypto";
import { storage } from "@/lib/storage";

// ---------- MEDIA LIBRARY (PUBLIC) ----------
export async function uploadMedia(data: FormData) {
  const session = await requireAdmin("Media", "Create");
  const file = data.get("file") as File;
  if (!file) throw new Error("No file provided");

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, storageKey, mimeType, size } = await storage.uploadFile(buffer, file.name, true);

  const media = await prisma.media.create({
    data: {
      filename: storageKey,
      originalName: file.name,
      mimeType: mimeType || file.type,
      size: size || file.size,
      url,
    }
  });

  await createAuditLog({ action: "MEDIA_UPLOADED", entity: "Media", entityId: media.id, metadata: { filename: storageKey } });
  revalidatePath("/admin/media");
  return media;
}

export async function deleteMedia(id: string) {
  await requireAdmin("Media", "Delete");
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Media not found");

  await storage.deleteFile(media.filename, true);

  await prisma.media.delete({ where: { id } });
  await createAuditLog({ action: "MEDIA_DELETED", entity: "Media", entityId: id });
  revalidatePath("/admin/media");
}

// ---------- PRODUCT FILES (PRIVATE) ----------
export async function uploadProductFile(data: FormData) {
  const session = await requireAdmin("Products", "Edit");
  const productId = data.get("productId") as string;
  const file = data.get("file") as File;
  const version = (data.get("version") as string) || "1.0.0";
  
  if (!file || !productId) throw new Error("Missing required fields");

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
  
  // Store securely outside public root using storage abstraction
  const { storageKey } = await storage.uploadFile(buffer, file.name, false);

  // If this is the new latest, update others
  await prisma.productFile.updateMany({
    where: { productId, isLatest: true },
    data: { isLatest: false }
  });

  const productFile = await prisma.productFile.create({
    data: {
      productId,
      filename: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageKey,
      version,
      hash: fileHash,
      isLatest: true,
      isActive: true,
    }
  });

  await createAuditLog({ action: "PRODUCT_FILE_UPLOADED", entity: "ProductFile", entityId: productFile.id, metadata: { version } });
  revalidatePath(`/admin/products/${productId}/edit`);
  return productFile;
}

export async function deleteProductFile(id: string, productId: string) {
  await requireAdmin("Products", "Edit");
  const file = await prisma.productFile.findUnique({ where: { id } });
  if (!file) throw new Error("File not found");

  await storage.deleteFile(file.storageKey, false);

  await prisma.productFile.delete({ where: { id } });
  
  // Re-elect latest if we deleted it
  if (file.isLatest) {
    const nextLatest = await prisma.productFile.findFirst({
      where: { productId },
      orderBy: { createdAt: "desc" }
    });
    if (nextLatest) {
      await prisma.productFile.update({ where: { id: nextLatest.id }, data: { isLatest: true } });
    }
  }

  await createAuditLog({ action: "PRODUCT_FILE_DELETED", entity: "ProductFile", entityId: id });
  revalidatePath(`/admin/products/${productId}/edit`);
}
