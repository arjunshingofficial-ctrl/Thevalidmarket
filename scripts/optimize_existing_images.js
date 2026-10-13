const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { PrismaClient } = require("@prisma/client");
const sharp = require("sharp");
const path = require("path");

const prisma = new PrismaClient();
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: "99b4bfe0987dd87a9a9bb03d86f0025c",
    secretAccessKey: "34fac3c2efd8969e87ee84029c49bb22d17beaea442c46d6854353f5f00f0dfd"
  },
  forcePathStyle: true,
});

const BUCKET = "asia-d-market";

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function main() {
  console.log("=== STEP 1: Scanning Supabase Storage for PNG/JPG files ===");
  const listRes = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "public/uploads/" }));
  const allObjects = listRes.Contents || [];
  
  const existingKeys = new Set(allObjects.map(o => o.Key));
  const imagesToConvert = allObjects.filter(o => {
    const ext = path.extname(o.Key).toLowerCase();
    return (ext === ".png" || ext === ".jpg" || ext === ".jpeg") && o.Size > 50 * 1024; // >50KB
  });

  console.log(`Found ${imagesToConvert.length} heavy images to convert to WebP.`);
  const urlReplacements = [];

  for (const item of imagesToConvert) {
    const ext = path.extname(item.Key);
    const webpKey = item.Key.replace(/\.(png|jpe?g)$/i, ".webp");
    console.log(`\nProcessing ${item.Key} (${(item.Size / 1024).toFixed(1)} KiB)...`);

    try {
      // Download original
      const getRes = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: item.Key }));
      const originalBuffer = await streamToBuffer(getRes.Body);

      // Compress to WebP (max 1400px width, quality 80)
      const webpBuffer = await sharp(originalBuffer)
        .rotate()
        .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      console.log(`  -> Converted to ${webpKey} (${(webpBuffer.length / 1024).toFixed(1)} KiB, saved ${((1 - webpBuffer.length / item.Size) * 100).toFixed(1)}%)`);

      // Upload WebP to Supabase
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: webpKey,
        Body: webpBuffer,
        ContentType: "image/webp",
      }));
      console.log(`  ✓ Uploaded ${webpKey} to Supabase`);

      // Track replacement for DB
      const originalFilename = path.basename(item.Key);
      const webpFilename = path.basename(webpKey);
      urlReplacements.push({
        oldFilename: originalFilename,
        newFilename: webpFilename,
        oldKey: item.Key,
        newKey: webpKey,
      });
    } catch (err) {
      console.error(`  ✗ Error converting ${item.Key}:`, err);
    }
  }

  console.log("\n=== STEP 2: Updating Database references to use .webp ===");

  // 1. Products
  const products = await prisma.product.findMany();
  let updatedProducts = 0;
  for (const p of products) {
    let descChanged = false;
    let newDesc = p.description || "";
    let metaChanged = false;
    let newMeta = p.metadata || "";

    for (const r of urlReplacements) {
      if (newDesc.includes(r.oldFilename)) {
        newDesc = newDesc.replaceAll(r.oldFilename, r.newFilename);
        descChanged = true;
      }
      if (newMeta.includes(r.oldFilename)) {
        newMeta = newMeta.replaceAll(r.oldFilename, r.newFilename);
        metaChanged = true;
      }
    }

    if (descChanged || metaChanged) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          description: newDesc,
          metadata: newMeta,
        },
      });
      console.log(`  ✓ Updated Product: ${p.name} (${p.slug})`);
      updatedProducts++;
    }
  }
  console.log(`Updated ${updatedProducts} products.`);

  // 2. Blog Posts
  const blogs = await prisma.blogPost.findMany();
  let updatedBlogs = 0;
  for (const b of blogs) {
    let contentChanged = false;
    let newContent = b.content || "";
    let featuredChanged = false;
    let newFeatured = b.featuredImage || "";

    for (const r of urlReplacements) {
      if (newContent.includes(r.oldFilename)) {
        newContent = newContent.replaceAll(r.oldFilename, r.newFilename);
        contentChanged = true;
      }
      if (newFeatured.includes(r.oldFilename)) {
        newFeatured = newFeatured.replaceAll(r.oldFilename, r.newFilename);
        featuredChanged = true;
      }
    }

    if (contentChanged || featuredChanged) {
      await prisma.blogPost.update({
        where: { id: b.id },
        data: {
          content: newContent,
          featuredImage: newFeatured,
        },
      });
      console.log(`  ✓ Updated BlogPost: ${b.title} (${b.slug})`);
      updatedBlogs++;
    }
  }
  console.log(`Updated ${updatedBlogs} blog posts.`);

  // 3. Categories
  const categories = await prisma.category.findMany();
  let updatedCategories = 0;
  for (const c of categories) {
    let imgChanged = false;
    let newImg = c.image || "";
    for (const r of urlReplacements) {
      if (newImg.includes(r.oldFilename)) {
        newImg = newImg.replaceAll(r.oldFilename, r.newFilename);
        imgChanged = true;
      }
    }
    if (imgChanged) {
      await prisma.category.update({
        where: { id: c.id },
        data: { image: newImg },
      });
      updatedCategories++;
    }
  }
  console.log(`Updated ${updatedCategories} categories.`);

  // 4. Courses
  const courses = await prisma.course.findMany();
  let updatedCourses = 0;
  for (const c of courses) {
    let thumbChanged = false;
    let newThumb = c.thumbnailUrl || "";
    for (const r of urlReplacements) {
      if (newThumb.includes(r.oldFilename)) {
        newThumb = newThumb.replaceAll(r.oldFilename, r.newFilename);
        thumbChanged = true;
      }
    }
    if (thumbChanged) {
      await prisma.course.update({
        where: { id: c.id },
        data: { thumbnailUrl: newThumb },
      });
      updatedCourses++;
    }
  }
  console.log(`Updated ${updatedCourses} courses.`);

  // 5. Media Library
  const mediaItems = await prisma.media.findMany();
  let updatedMedia = 0;
  for (const m of mediaItems) {
    for (const r of urlReplacements) {
      if (m.filename.includes(r.oldFilename) || m.url.includes(r.oldFilename)) {
        await prisma.media.update({
          where: { id: m.id },
          data: {
            filename: m.filename.replaceAll(r.oldFilename, r.newFilename),
            url: m.url.replaceAll(r.oldFilename, r.newFilename),
            mimeType: "image/webp",
          },
        });
        updatedMedia++;
      }
    }
  }
  console.log(`Updated ${updatedMedia} media library items.`);

  console.log("\n=== ALL EXISTING IMAGES OPTIMIZED SUCCESSFULLY! ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
