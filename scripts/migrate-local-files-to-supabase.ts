// @ts-nocheck
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.STORAGE_REGION || "auto",
  endpoint: process.env.STORAGE_ENDPOINT || undefined,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
    secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const bucket = process.env.STORAGE_BUCKET || "";

async function objectExists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };
  return types[ext.toLowerCase()] || "application/octet-stream";
}

async function uploadToS3(localPath: string, targetKey: string, isPublic: boolean) {
  const buffer = await fs.readFile(localPath);
  const ext = path.extname(localPath);
  const contentType = getContentType(ext);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: targetKey,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);

  const cleanEndpoint = (process.env.STORAGE_ENDPOINT || "").replace(/\/$/, "");
  const publicUrl = `${cleanEndpoint}/${bucket}/${targetKey}`;

  return { storageKey: targetKey, url: isPublic ? publicUrl : `private://${targetKey}` };
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/\.{2,}/g, ".");
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--migrate");

  console.log(`Starting migration... Dry run: ${dryRun}`);

  let filesFound = 0;
  let filesMigrated = 0;
  let filesAlreadyInCloud = 0;
  let missingLocalFiles = 0;
  let failedMigrations = 0;

  // 1. Media
  const mediaRecords = await prisma.media.findMany({ where: { url: { contains: "/uploads/" } } });
  for (const media of mediaRecords) {
    filesFound++;
    const filename = media.url.replace("/uploads/", "");
    const localPath = path.join(process.cwd(), "public", "uploads", filename);
    const safeFilename = sanitizeFilename(media.originalName || filename);
    const targetKey = `public/uploads/${safeFilename}`;

    console.log(`\n[Media] ID: ${media.id}`);
    console.log(`Old path: ${media.url}`);
    console.log(`Local file: ${localPath}`);
    console.log(`Target S3 key: ${targetKey}`);

    try {
      await fs.access(localPath);
      console.log(`Local file exists: YES`);

      if (await objectExists(targetKey)) {
        console.log("File already in cloud.");
        filesAlreadyInCloud++;
        if (!dryRun) {
          await prisma.media.update({ where: { id: media.id }, data: { filename: targetKey, url: `${(process.env.STORAGE_ENDPOINT || "").replace(/\/$/, "")}/${bucket}/${targetKey}` } });
          console.log("Database updated.");
        }
      } else {
        if (!dryRun) {
          const res = await uploadToS3(localPath, targetKey, true);
          await prisma.media.update({ where: { id: media.id }, data: { filename: res.storageKey, url: res.url } });
          console.log("Uploaded and Database updated.");
          filesMigrated++;
        } else {
          console.log("Would upload and update.");
        }
      }
    } catch (e: any) {
      if (e.code === "ENOENT") {
        console.log(`Local file exists: NO (Missing)`);
        missingLocalFiles++;
      } else {
        console.error(`Error:`, e);
        failedMigrations++;
      }
    }
  }

  // 2. ProductFiles
  const productFiles = await prisma.productFile.findMany();
  for (const pf of productFiles) {
    if (pf.storageKey.startsWith("private/")) continue;
    
    filesFound++;
    const localPath = path.join(process.cwd(), "private", "uploads", pf.storageKey);
    const safeFilename = sanitizeFilename(pf.originalName || pf.storageKey);
    const targetKey = `private/uploads/${safeFilename}`;

    console.log(`\n[ProductFile] ID: ${pf.id}`);
    console.log(`Old path: ${pf.storageKey}`);
    console.log(`Local file: ${localPath}`);
    console.log(`Target S3 key: ${targetKey}`);

    try {
      await fs.access(localPath);
      console.log(`Local file exists: YES`);

      if (await objectExists(targetKey)) {
        console.log("File already in cloud.");
        filesAlreadyInCloud++;
        if (!dryRun) {
          await prisma.productFile.update({ where: { id: pf.id }, data: { storageKey: targetKey } });
          console.log("Database updated.");
        }
      } else {
        if (!dryRun) {
          const res = await uploadToS3(localPath, targetKey, false);
          await prisma.productFile.update({ where: { id: pf.id }, data: { storageKey: res.storageKey } });
          console.log("Uploaded and Database updated.");
          filesMigrated++;
        } else {
          console.log("Would upload and update.");
        }
      }
    } catch (e: any) {
      if (e.code === "ENOENT") {
        console.log(`Local file exists: NO (Missing)`);
        missingLocalFiles++;
      } else {
        console.error(`Error:`, e);
        failedMigrations++;
      }
    }
  }

  // 3. WalletDeposits
  const deposits = await prisma.walletDeposit.findMany({ where: { proofUrl: { not: null, contains: "/uploads/" } } });
  for (const dep of deposits) {
    filesFound++;
    const filename = dep.proofUrl!.replace("/uploads/", "");
    const localPath = path.join(process.cwd(), "public", "uploads", filename);
    const safeFilename = sanitizeFilename(filename);
    const targetKey = `private/uploads/payment-proofs/${safeFilename}`;

    console.log(`\n[WalletDeposit] ID: ${dep.id}`);
    console.log(`Old path: ${dep.proofUrl}`);
    console.log(`Local file: ${localPath}`);
    console.log(`Target S3 key: ${targetKey}`);

    try {
      await fs.access(localPath);
      console.log(`Local file exists: YES`);

      if (await objectExists(targetKey)) {
        console.log("File already in cloud.");
        filesAlreadyInCloud++;
        if (!dryRun) {
          await prisma.walletDeposit.update({ where: { id: dep.id }, data: { proofUrl: `private://${targetKey}` } });
          console.log("Database updated.");
        }
      } else {
        if (!dryRun) {
          const res = await uploadToS3(localPath, targetKey, false);
          await prisma.walletDeposit.update({ where: { id: dep.id }, data: { proofUrl: res.url } });
          console.log("Uploaded and Database updated.");
          filesMigrated++;
        } else {
          console.log("Would upload and update.");
        }
      }
    } catch (e: any) {
      if (e.code === "ENOENT") {
        console.log(`Local file exists: NO (Missing)`);
        missingLocalFiles++;
      } else {
        console.error(`Error:`, e);
        failedMigrations++;
      }
    }
  }

  // 4. Payments
  const payments = await prisma.payment.findMany({ where: { proofUrl: { not: null, contains: "/uploads/" } } });
  for (const pay of payments) {
    filesFound++;
    const filename = pay.proofUrl!.replace("/uploads/", "");
    const localPath = path.join(process.cwd(), "public", "uploads", filename);
    const safeFilename = sanitizeFilename(filename);
    const targetKey = `private/uploads/payment-proofs/${safeFilename}`;

    console.log(`\n[Payment] ID: ${pay.id}`);
    console.log(`Old path: ${pay.proofUrl}`);
    console.log(`Local file: ${localPath}`);
    console.log(`Target S3 key: ${targetKey}`);

    try {
      await fs.access(localPath);
      console.log(`Local file exists: YES`);

      if (await objectExists(targetKey)) {
        console.log("File already in cloud.");
        filesAlreadyInCloud++;
        if (!dryRun) {
          await prisma.payment.update({ where: { id: pay.id }, data: { proofUrl: `private://${targetKey}` } });
          console.log("Database updated.");
        }
      } else {
        if (!dryRun) {
          const res = await uploadToS3(localPath, targetKey, false);
          await prisma.payment.update({ where: { id: pay.id }, data: { proofUrl: res.url } });
          console.log("Uploaded and Database updated.");
          filesMigrated++;
        } else {
          console.log("Would upload and update.");
        }
      }
    } catch (e: any) {
      if (e.code === "ENOENT") {
        console.log(`Local file exists: NO (Missing)`);
        missingLocalFiles++;
      } else {
        console.error(`Error:`, e);
        failedMigrations++;
      }
    }
  }

  console.log("\n--------------------------------------------------");
  console.log("MIGRATION SUMMARY:");
  console.log(`FILES FOUND: ${filesFound}`);
  console.log(`FILES MIGRATED: ${filesMigrated}`);
  console.log(`FILES ALREADY IN CLOUD: ${filesAlreadyInCloud}`);
  console.log(`MISSING LOCAL FILES: ${missingLocalFiles}`);
  console.log(`FAILED MIGRATIONS: ${failedMigrations}`);

  if (!dryRun) {
    // Re-check
    const mediaCount = await prisma.media.count({ where: { url: { contains: "/uploads/" } } });
    const pfList = await prisma.productFile.findMany();
    const pfCount = pfList.filter(pf => !pf.storageKey.startsWith("private/")).length;
    const depCount = await prisma.walletDeposit.count({ where: { proofUrl: { contains: "/uploads/" } } });
    const payCount = await prisma.payment.count({ where: { proofUrl: { contains: "/uploads/" } } });
    
    console.log(`OLD LOCAL PATHS REMAINING IN DATABASE: ${mediaCount + pfCount + depCount + payCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
