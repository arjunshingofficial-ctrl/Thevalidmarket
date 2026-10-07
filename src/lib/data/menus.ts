import { prisma } from "@/lib/prisma";

export async function getMenu(location: string) {
  try {
    const menu = await prisma.menu.findUnique({
      where: { location },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
          include: {
            children: {
              where: { isVisible: true },
              orderBy: { sortOrder: "asc" }
            }
          }
        }
      }
    });
    
    // Filter out top-level items that are children of something else (already included in children array above)
    // Actually, Prisma might fetch all items and children. We should only get parentId = null.
    if (!menu) return null;
    
    const rootItems = menu.items.filter(item => item.parentId === null);
    
    return { ...menu, items: rootItems };
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    return null;
  }
}

export async function getAllMenus() {
  return prisma.menu.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { items: true }
      }
    }
  });
}
