const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({ select: { metadata: true } });
  const urls = new Set();
  
  for (const p of products) {
    if (p.metadata) {
      try {
        const meta = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
        if (meta && meta.image) {
          urls.add(meta.image);
        }
      } catch (e) {}
    }
  }

  let hasExternal = false;
  for (const url of urls) {
    if (url.startsWith('http')) {
      if (!url.includes('.supabase.co')) {
        console.log('EXTERNAL URL FOUND:', url);
        hasExternal = true;
      }
    }
  }
  if (!hasExternal) {
    console.log('NO EXTERNAL ARBITRARY URLS FOUND');
  }
}

main().finally(() => prisma.$disconnect());
