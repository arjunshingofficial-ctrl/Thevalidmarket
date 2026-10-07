"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTelegramUrl(formData: FormData) {
  const url = formData.get("telegramUrl")?.toString() || "";

  let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
  }

  let footerConfig = {};
  try {
    footerConfig = settings.footerConfig ? JSON.parse(settings.footerConfig) : {};
  } catch (e) {}

  footerConfig = { ...footerConfig, telegramUrl: url };

  await prisma.siteSettings.update({
    where: { id: "GLOBAL" },
    data: { footerConfig: JSON.stringify(footerConfig) }
  });

  revalidatePath("/login");
  revalidatePath("/admin/settings");
}
