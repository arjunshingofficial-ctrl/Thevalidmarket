import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getMenu = unstable_cache(
  async (location: string) => {
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
      
      if (!menu) return null;
      
      const rootItems = menu.items.filter(item => item.parentId === null);
      
      return { ...menu, items: rootItems };
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      return null;
    }
  },
  ["menu-data-v2"],
  { revalidate: 3600, tags: ["menus", "menus-v2"] }
);

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
