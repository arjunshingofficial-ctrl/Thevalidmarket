const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const urls = await prisma.menuItem.findMany({
    where: { url: { contains: 'bb' } }
  });
  console.log('MenuItems with url containing bb:', urls);
  
  for (const item of urls) {
    await prisma.menuItem.update({
      where: { id: item.id },
      data: { url: item.url.replace('bb', 'cc') }
    });
    console.log('Updated', item.id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
