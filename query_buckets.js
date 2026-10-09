const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.$queryRawUnsafe('SELECT id, name, public FROM storage.buckets');
  console.log(res);
}

main().finally(() => prisma.$disconnect());
