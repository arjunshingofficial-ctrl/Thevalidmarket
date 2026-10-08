import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { normalizeImageUrl } from "./client";

export interface StorageProvider {
  uploadFile(buffer: Buffer, originalName: string, isPublic: boolean): Promise<{ storageKey: string; url: string }>;
  deleteFile(storageKey: string, isPublic: boolean): Promise<void>;
  getFile(storageKey: string, isPublic: boolean): Promise<Buffer>;
  getPublicUrl(storageKey: string): string;
  getSignedDownloadUrl?(storageKey: string): Promise<string>;
}

export class LocalStorageProvider implements StorageProvider {
  private publicDir = path.join(process.cwd(), "public", "uploads");
  private privateDir = path.join(process.cwd(), "private", "uploads");

  async init() {
    await fs.mkdir(this.publicDir, { recursive: true });
    await fs.mkdir(this.privateDir, { recursive: true });
  }

  async uploadFile(buffer: Buffer, originalName: string, isPublic: boolean) {
    await this.init();
    const ext = path.extname(originalName);
    const hash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 8);
    const filename = `${path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, "-")}-${hash}${ext}`;
    
    const targetDir = isPublic ? this.publicDir : this.privateDir;
    await fs.writeFile(path.join(targetDir, filename), buffer);

    return {
      storageKey: filename,
      url: isPublic ? `/uploads/${filename}` : `private://${filename}`,
    };
  }

  async deleteFile(storageKey: string, isPublic: boolean) {
    const targetDir = isPublic ? this.publicDir : this.privateDir;
    try {
      await fs.unlink(path.join(targetDir, storageKey));
    } catch (e) {
      console.error(`Failed to delete file from storage: ${storageKey}`);
    }
  }

  async getFile(storageKey: string, isPublic: boolean) {
    const targetDir = isPublic ? this.publicDir : this.privateDir;
    return await fs.readFile(path.join(targetDir, storageKey));
  }

  getPublicUrl(storageKey: string) {
    return `/uploads/${storageKey}`;
  }

  async getSignedDownloadUrl(storageKey: string): Promise<string> {
    return this.getPublicUrl(storageKey); // Just return local URL for dev
  }
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET || "";
    this.endpoint = process.env.STORAGE_ENDPOINT || "";
    
    if (!this.bucket || !process.env.STORAGE_ACCESS_KEY || !process.env.STORAGE_SECRET_KEY) {
      console.error("Missing required S3/Supabase storage environment variables.");
    }

    this.client = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint: this.endpoint || undefined,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
        secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(buffer: Buffer, originalName: string, isPublic: boolean) {
    const ext = path.extname(originalName);
    const hash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 8);
    // Sanitize filename
    const safeName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, "-");
    const filename = `${safeName}-${hash}${ext}`;
    
    const prefix = isPublic ? "public/uploads" : "private/uploads";
    const storageKey = `${prefix}/${filename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      Body: buffer,
      ContentType: this.getContentType(ext),
    });

    await this.client.send(command);

    return {
      storageKey,
      url: isPublic ? this.getPublicUrl(storageKey) : `private://${storageKey}`,
    };
  }

  async deleteFile(storageKey: string, isPublic: boolean) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });
    try {
      await this.client.send(command);
    } catch (e) {
      console.error(`Failed to delete file from S3: ${storageKey}`, e);
    }
  }

  async getFile(storageKey: string, isPublic: boolean): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });
    const response = await this.client.send(command);
    const stream = response.Body as any;
    if (!stream) throw new Error("No body returned from S3");
    
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      stream.on("data", (chunk: any) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  getPublicUrl(storageKey: string): string {
    return normalizeImageUrl(storageKey);
  }

  async getSignedDownloadUrl(storageKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });
    // URL expires in 1 hour (3600 seconds)
    return await getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  private getContentType(ext: string): string {
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
}

export const storage = process.env.NODE_ENV === "production" || process.env.STORAGE_PROVIDER === "s3"
  ? new S3StorageProvider()
  : new LocalStorageProvider();
