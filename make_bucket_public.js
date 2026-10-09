const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe("UPDATE storage.buckets SET public = true WHERE id = 'asia-d-market'");
  console.log("Bucket made public.");
}

main().finally(() => prisma.$disconnect());
