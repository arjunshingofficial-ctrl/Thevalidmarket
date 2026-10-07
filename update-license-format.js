const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const keys = {
    'socks-5-android': 'D-A8JD3M-P9QW2X',
    'socks-5-windows': 'D-W2K9FL-V4NR8C',
    'socks-5-ios': 'D-I5B7HT-X3MZ1P'
  };

  const prods = await prisma.product.findMany({
    where: { slug: { in: Object.keys(keys) } }
  });

  for (const p of prods) {
    const meta = p.metadata ? JSON.parse(p.metadata) : {};
    meta.staticLicense = keys[p.slug];
    await prisma.product.update({
      where: { id: p.id },
      data: { metadata: JSON.stringify(meta) }
    });

    const licenses = await prisma.licenseKey.findMany({
      where: { productId: p.id }
    });

    for (const l of licenses) {
      // Keep the ###cuid hidden suffix so it remains unique in Prisma but displays beautifully in the frontend
      const newKey = keys[p.slug] + (l.licenseKey.includes('###') ? '###' + l.licenseKey.split('###')[1] : '###' + l.id);
      await prisma.licenseKey.update({
        where: { id: l.id },
        data: { licenseKey: newKey }
      });
    }
  }
  console.log('Updated to new format!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
