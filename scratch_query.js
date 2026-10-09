const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findFirst({ where: { name: 'Digital Marketingg' } });
  console.log(p?.metadata);
  const m = await prisma.media.findMany({ take: 5 });
  console.log("Media samples:", m.map(x => x.url));
}

main().finally(() => prisma.$disconnect());
