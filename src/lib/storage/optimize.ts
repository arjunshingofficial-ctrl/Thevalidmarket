import sharp from "sharp";
import path from "path";

const OPTIMIZABLE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".bmp",
  ".tiff",
]);

export interface OptimizedImageResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export function getMimeTypeFromExt(ext: string): string {
  const types: Record<string, string> = {
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
  };
  return types[ext.toLowerCase()] || "application/octet-stream";
}

/**
 * Automatically converts and compresses uploaded images into modern, lightweight WebP format.
 * - Resizes large images to max width/height of 1600px (retina-ready, fast load)
 * - Compresses with WebP quality 80
 * - Reduces file size by 85-95% without visible loss in sharpness
 * - Keeps non-images, SVGs, and GIFs untouched
 */
export async function optimizeImageBuffer(
  buffer: Buffer,
  originalName: string,
  options?: { maxWidth?: number; quality?: number }
): Promise<OptimizedImageResult> {
  const ext = path.extname(originalName).toLowerCase();

  // If not an image (or SVG/GIF), keep untouched
  if (!OPTIMIZABLE_EXTENSIONS.has(ext)) {
    return {
      buffer,
      filename: originalName,
      mimeType: getMimeTypeFromExt(ext),
      size: buffer.length,
    };
  }

  const maxWidth = options?.maxWidth || 1600;
  const quality = options?.quality || 80;

  try {
    const optimizedBuffer = await sharp(buffer)
      .rotate() // auto-orient camera/phone EXIF
      .resize({
        width: maxWidth,
        height: maxWidth,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 })
      .toBuffer();

    const baseName = path.basename(originalName, ext);
    const newFilename = `${baseName}.webp`;

    return {
      buffer: optimizedBuffer,
      filename: newFilename,
      mimeType: "image/webp",
      size: optimizedBuffer.length,
    };
  } catch (err) {
    console.warn(`[ImageOptimizer] Failed to optimize image ${originalName}, falling back to original:`, err);
    return {
      buffer,
      filename: originalName,
      mimeType: getMimeTypeFromExt(ext),
      size: buffer.length,
    };
  }
}
