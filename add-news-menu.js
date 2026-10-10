const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const headerMenu = await prisma.menu.findUnique({
    where: { location: 'HEADER_MAIN' }
  });

  if (headerMenu) {
    const existingNews = await prisma.menuItem.findFirst({
      where: { menuId: headerMenu.id, url: '/blog' }
    });

    if (!existingNews) {
      await prisma.menuItem.create({
        data: {
          menuId: headerMenu.id,
          label: 'News',
          url: '/blog',
          sortOrder: 10,
          isVisible: true,
          authVisibility: 'EVERYONE',
          type: 'PAGE'
        }
      });
      console.log('Added News menu item to HEADER_MAIN');
    } else {
      await prisma.menuItem.update({
        where: { id: existingNews.id },
        data: { label: 'News' }
      });
      console.log('Updated existing blog menu item to News');
    }
  } else {
    console.log('HEADER_MAIN menu not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
