const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function report() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@asiadmarket.com' },
    include: { role: true, wallet: true }
  });

  const cust = await prisma.user.findFirst({
    where: { email: { not: 'admin@asiadmarket.com' } },
    include: { role: true, wallet: true, referralCode: true }
  });

  const prods = await prisma.product.findMany({
    where: { slug: { contains: 'socks' } }
  });

  console.log(JSON.stringify({ admin, cust, prods }, null, 2));
}

report().catch(console.error).finally(() => prisma.$disconnect());
