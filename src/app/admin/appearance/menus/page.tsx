import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllMenus } from "@/lib/data/menus";
import MenuBuilderClient from "./MenuBuilderClient";
import { prisma } from "@/lib/prisma";

export default async function MenusPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user?.role ?? "")) {
    redirect("/dashboard");
  }

  // Ensure default menus exist
  const defaultMenus = ["HEADER_MAIN", "FOOTER_LINKS"];
  for (const loc of defaultMenus) {
    await prisma.menu.upsert({
      where: { location: loc },
      update: {},
      create: { name: loc.replace("_", " "), location: loc }
    });
  }

  const allMenus = await getAllMenus();
  
  // Get detailed items for the first menu by default (or just load them all)
  const menusWithItems = await Promise.all(
    allMenus.map(async (m) => {
      const fullMenu = await prisma.menu.findUnique({
        where: { id: m.id },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { children: { orderBy: { sortOrder: "asc" } } }
          }
        }
      });
      return {
        ...m,
        items: fullMenu?.items.filter(i => i.parentId === null) || []
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Menu Builder</h1>
        <p className="text-slate-500 mt-2">Manage your public navigation headers, footers, and sidebars.</p>
      </div>
      
      <MenuBuilderClient initialMenus={menusWithItems} />
    </div>
  );
}
