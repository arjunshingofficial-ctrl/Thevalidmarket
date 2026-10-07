import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const media = await prisma.media.findMany();
  const mediaLocal = media.filter(m => m.url.includes("/uploads/"));
  console.log(`Media: ${mediaLocal.length} records use local /uploads/ out of ${media.length}`);

  const productFiles = await prisma.productFile.findMany();
  const pfLocal = productFiles.filter(pf => !pf.storageKey.startsWith("private/"));
  console.log(`ProductFiles: ${pfLocal.length} records use old paths out of ${productFiles.length}`);

  const payments = await prisma.payment.findMany({ where: { proofUrl: { not: null } } });
  const pLocal = payments.filter(p => p.proofUrl!.includes("/uploads/"));
  console.log(`Payments: ${pLocal.length} records use local /uploads/ out of ${payments.length}`);

  const deposits = await prisma.walletDeposit.findMany({ where: { proofUrl: { not: null } } });
  const dLocal = deposits.filter(d => d.proofUrl!.includes("/uploads/"));
  console.log(`WalletDeposits: ${dLocal.length} records use local /uploads/ out of ${deposits.length}`);

  console.log("Check complete.");
}

check().finally(() => prisma.$disconnect());
