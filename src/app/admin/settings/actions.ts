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
  const supportEmail = formData.get("supportEmail")?.toString() || "support@thevalidmarket.com";
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
  try {
    const { requireAdmin, createAuditLog } = await import("@/lib/actions/admin");
    await requireAdmin("Settings", "Manage");

    const siteName = formData.get("siteName")?.toString()?.trim() || "Asia D Market";
    const siteDescription = formData.get("siteDescription")?.toString()?.trim() || "";
    const defaultOgImage = formData.get("defaultOgImage")?.toString()?.trim() || "/og-image.jpg";
    const twitterHandle = formData.get("twitterHandle")?.toString()?.trim() || "@AsiaDMarket";

    let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
    }

    let footerConfig: any = {};
    try {
      footerConfig = settings.footerConfig ? JSON.parse(settings.footerConfig) : {};
    } catch {
      footerConfig = {};
    }
    footerConfig.twitterHandle = twitterHandle.startsWith("@") ? twitterHandle : `@${twitterHandle}`;

    await prisma.siteSettings.update({
      where: { id: "GLOBAL" },
      data: {
        siteName,
        siteDescription,
        defaultOgImage,
        footerConfig: JSON.stringify(footerConfig),
      }
    });

    await createAuditLog({
      action: "SETTINGS_UPDATED",
      entity: "SiteSettings",
      entityId: "GLOBAL",
      metadata: {
        siteName,
        siteDescriptionLength: siteDescription.length,
        defaultOgImage,
        twitterHandle: footerConfig.twitterHandle,
      }
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/store");
    revalidatePath("/admin/settings/seo");

    return { 
      success: true, 
      message: "Global SEO settings saved and updated across the site!",
      data: {
        siteName,
        siteDescription,
        defaultOgImage,
        twitterHandle: footerConfig.twitterHandle,
      }
    };
  } catch (error: any) {
    console.error("Failed to update global SEO settings:", error);
    return {
      success: false,
      message: error?.message || "Failed to update global SEO settings. Please try again.",
    };
  }
}
