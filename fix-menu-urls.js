const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.menuItem.findMany();
  
  let updatedCount = 0;
  for (const item of items) {
    if (item.url && !item.url.startsWith('/') && !item.url.startsWith('http')) {
      const newUrl = '/' + item.url;
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { url: newUrl }
      });
      console.log(`Updated menu item "${item.label}" URL from "${item.url}" to "${newUrl}"`);
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} menu items to use absolute paths.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
