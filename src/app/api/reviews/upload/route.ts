import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate mime type
    const validMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/bmp",
    ];
    if (!file.type.startsWith("image/") && !validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only image files (JPG, PNG, WebP, GIF) are allowed." },
        { status: 400 }
      );
    }

    // Validate size (10 MB maximum)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum size is 10 MB per image." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, storageKey } = await storage.uploadFile(buffer, file.name, true);

    return NextResponse.json({
      success: true,
      url,
      storageKey,
    });
  } catch (err: any) {
    console.error("Error uploading review image:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

