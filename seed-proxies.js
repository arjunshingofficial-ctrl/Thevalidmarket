const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Ensure "Proxies" category exists
  let category = await prisma.category.findUnique({
    where: { slug: "proxies" }
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Proxies",
        slug: "proxies",
        description: "High quality proxies"
      }
    });
    console.log("Created Proxies category");
  } else {
    console.log("Proxies category exists");
  }

  // 2. Create individual products
  const productsData = [
    { name: "Socks 5 For Android", slug: "socks-5-android", price: 50, type: "SOFTWARE", platform: "Android" },
    { name: "Socks 5 For Windows", slug: "socks-5-windows", price: 100, type: "SOFTWARE", platform: "Windows" },
    { name: "Socks 5 For IOS", slug: "socks-5-ios", price: 70, type: "SOFTWARE", platform: "iOS" },
  ];

  const createdProducts = [];

  for (const p of productsData) {
    let product = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          price: p.price,
          categoryId: category.id,
          type: p.type,
          status: "PUBLISHED",
          metadata: JSON.stringify({ platform: p.platform })
        }
      });
      console.log(`Created product: ${p.name}`);
    } else {
      console.log(`Product exists: ${p.name}`);
    }
    createdProducts.push(product);

    // Create a dummy file for the product so Download button works
    const file = await prisma.productFile.findFirst({ where: { productId: product.id } });
    if (!file) {
      await prisma.productFile.create({
        data: {
          productId: product.id,
          filename: `socks5-${p.platform.toLowerCase()}.zip`,
          originalName: `socks5-${p.platform.toLowerCase()}.zip`,
          fileSize: 1024,
          mimeType: "application/zip",
          storageKey: `local://socks5-${p.platform.toLowerCase()}.zip`,
          isActive: true,
          isLatest: true
        }
      });
    }

    // Pre-generate 100 license keys for this product
    const keysCount = await prisma.licenseKey.count({ where: { productId: product.id } });
    if (keysCount === 0) {
      const keysToCreate = [];
      for (let i = 0; i < 100; i++) {
        keysToCreate.push({
          productId: product.id,
          licenseKey: `${p.platform.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: "AVAILABLE"
        });
      }
      await prisma.licenseKey.createMany({ data: keysToCreate });
      console.log(`Generated 100 keys for ${p.name}`);
    }
  }

  // 3. Create Bundle
  const bundleSlug = "socks-5-all-platforms";
  let bundle = await prisma.product.findUnique({ where: { slug: bundleSlug } });
  
  if (!bundle) {
    bundle = await prisma.product.create({
      data: {
        name: "Socks 5 All Platforms",
        slug: bundleSlug,
        price: 120,
        categoryId: category.id,
        type: "SOFTWARE", // So it goes through the fulfillment flow
        status: "PUBLISHED",
        metadata: JSON.stringify({ 
          platform: "Android, Windows, iOS",
          isBundle: true,
          bundledProductIds: createdProducts.map(p => p.id)
        })
      }
    });
    console.log(`Created bundle: Socks 5 All Platforms`);
  } else {
    console.log(`Bundle exists: Socks 5 All Platforms`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
