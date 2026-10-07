"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(session.user?.role ?? "")) {
    throw new Error("Unauthorized");
  }
}

export async function addMenuItem(data: any) {
  await checkAdmin();
  
  // Calculate sort order
  const count = await prisma.menuItem.count({
    where: { menuId: data.menuId, parentId: data.parentId || null }
  });

  const item = await prisma.menuItem.create({
    data: {
      menuId: data.menuId,
      parentId: data.parentId || null,
      label: data.label,
      url: data.url,
      openInNew: data.openInNew || false,
      type: data.type || "CUSTOM_URL",
      referenceId: data.referenceId || null,
      isVisible: data.isVisible !== false,
      authVisibility: data.authVisibility || "EVERYONE",
      badge: data.badge || null,
      sortOrder: count
    }
  });

  revalidatePath("/", "layout");
  return item;
}

export async function updateMenuItem(id: string, data: any) {
  await checkAdmin();
  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      label: data.label,
      url: data.url,
      openInNew: data.openInNew,
      type: data.type,
      referenceId: data.referenceId,
      isVisible: data.isVisible,
      authVisibility: data.authVisibility,
      badge: data.badge,
      parentId: data.parentId || null
    }
  });
  
  revalidatePath("/", "layout");
  return item;
}

export async function deleteMenuItem(id: string) {
  await checkAdmin();
  // Cascade delete handles children
  await prisma.menuItem.delete({ where: { id } });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function reorderMenuItems(items: { id: string, sortOrder: number, parentId: string | null }[]) {
  await checkAdmin();
  
  // Update in a transaction
  await prisma.$transaction(
    items.map(item => 
      prisma.menuItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder, parentId: item.parentId }
      })
    )
  );

  revalidatePath("/", "layout");
  return { success: true };
}
