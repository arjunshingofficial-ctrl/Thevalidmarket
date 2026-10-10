const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.category.updateMany({
    where: { slug: 'bb' },
    data: { name: 'CC', slug: 'cc', seoTitle: 'CC', seoDescription: 'Browse premium CC products' }
  });
  console.log('Updated DB');
}

main().catch(console.error).finally(() => prisma.$disconnect());
