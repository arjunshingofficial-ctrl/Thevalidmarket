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

export async function updateGeneralSettings(formData: FormData) {
  const storeName = formData.get("storeName")?.toString() || "Asia D Market";
  const supportEmail = formData.get("supportEmail")?.toString() || "support@asiadmarket.com";
  const primaryCurrency = formData.get("primaryCurrency")?.toString() || "USD";
  const defaultOrderStatus = formData.get("defaultOrderStatus")?.toString() || "COMPLETED";

  let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
  }

  let fxConfig: any = {};
  try {
    fxConfig = settings.fxConfig ? JSON.parse(settings.fxConfig) : {};
  } catch (e) {}

  fxConfig = { 
    ...fxConfig, 
    primaryCurrency,
    defaultOrderStatus
  };

  await prisma.siteSettings.update({
    where: { id: "GLOBAL" },
    data: { 
      siteName: storeName,
      fxConfig: JSON.stringify(fxConfig)
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/store");
  revalidatePath("/admin/dashboard");
}

export async function updateGlobalSEOSettings(formData: FormData) {
  const siteName = formData.get("siteName")?.toString() || "Asia D Market";
  const siteDescription = formData.get("siteDescription")?.toString() || "";
  const defaultOgImage = formData.get("defaultOgImage")?.toString() || "";

  let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
  }

  await prisma.siteSettings.update({
    where: { id: "GLOBAL" },
    data: {
      siteName,
      siteDescription,
      defaultOgImage,
    }
  });

  revalidatePath("/");
  revalidatePath("/store");
  revalidatePath("/admin/settings/seo");
}
