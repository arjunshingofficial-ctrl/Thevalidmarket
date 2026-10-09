const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const medias = await prisma.media.findMany({ take: 5 });
  console.log("=== MEDIA ===");
  for (const m of medias) {
    console.log(`URL: ${m.url}`);
  }

  const products = await prisma.product.findMany({ take: 10 });
  console.log("=== PRODUCTS ===");
  for (const p of products) {
    if (p.metadata) {
      let meta;
      try {
        meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
        console.log(`Product ${p.slug} image: ${meta.image}`);
      } catch(e) {}
    }
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
