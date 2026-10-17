"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "@/lib/actions/admin";

function normalizeTelegramUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "");
  return `https://t.me/${clean}`;
}

function normalizeWhatsAppUrl(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export async function updateSupportChannels(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return { success: false, message: "Unauthorized. Please log in as an administrator." };
    }
    const allowed = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
    if (!allowed.includes(session.user?.role as string)) {
      return { success: false, message: "Forbidden. You do not have permissions to modify settings." };
    }

    const rawTelegram = formData.get("telegramUrl")?.toString()?.trim() || "";
    const telegramUrl = normalizeTelegramUrl(rawTelegram);
    const telegramActive = formData.get("telegramActive") === "true" || formData.get("telegramActive") === "on";

    const rawWhatsApp = formData.get("whatsappUrl")?.toString()?.trim() || "";
    const whatsappUrl = normalizeWhatsAppUrl(rawWhatsApp);
    const whatsappActive = formData.get("whatsappActive") === "true" || formData.get("whatsappActive") === "on";

    let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
    }

    let footerConfig: any = {};
    try {
      footerConfig = settings.footerConfig ? JSON.parse(settings.footerConfig) : {};
    } catch (e) {
      footerConfig = {};
    }

    footerConfig = {
      ...footerConfig,
      telegramUrl,
      telegramActive,
      whatsappUrl,
      whatsappActive,
    };

    await prisma.siteSettings.update({
      where: { id: "GLOBAL" },
      data: { footerConfig: JSON.stringify(footerConfig) }
    });

    await createAuditLog({
      action: "SUPPORT_CHANNELS_UPDATED",
      entity: "SiteSettings",
      entityId: "GLOBAL",
      metadata: { telegramUrl, telegramActive, whatsappUrl, whatsappActive }
    });

    revalidatePath("/login");
    revalidatePath("/admin/settings");
    revalidatePath("/contact");
    revalidatePath("/");
    revalidatePath("/store");

    return { 
      success: true, 
      message: "Telegram & WhatsApp support channels updated successfully!",
      data: { telegramUrl, telegramActive, whatsappUrl, whatsappActive }
    };
  } catch (error: any) {
    console.error("Failed to update support channels:", error);
    return {
      success: false,
      message: error?.message || "Failed to update support channels. Please try again.",
    };
  }
}

export async function updateTelegramUrl(formData: FormData) {
  return updateSupportChannels(formData);
}

export async function updateGeneralSettings(formData: FormData) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return { success: false, message: "Unauthorized. Please log in as an administrator." };
    }
    const allowed = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
    if (!allowed.includes(session.user?.role as string)) {
      return { success: false, message: "Forbidden. You do not have permissions to modify settings." };
    }

    const storeName = formData.get("storeName")?.toString()?.trim() || "The Valid Market";
    const supportEmail = formData.get("supportEmail")?.toString()?.trim() || "support@thevalidmarket.com";
    const primaryCurrency = formData.get("primaryCurrency")?.toString()?.trim() || "USD";
    const defaultOrderStatus = formData.get("defaultOrderStatus")?.toString()?.trim() || "COMPLETED";

    let settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "GLOBAL" } });
    }

    let fxConfig: any = {};
    try {
      fxConfig = settings.fxConfig ? JSON.parse(settings.fxConfig) : {};
    } catch (e) {
      fxConfig = {};
    }

    fxConfig = { 
      ...fxConfig, 
      primaryCurrency,
      defaultOrderStatus
    };

    let footerConfig: any = {};
    try {
      footerConfig = settings.footerConfig ? JSON.parse(settings.footerConfig) : {};
    } catch (e) {
      footerConfig = {};
    }

    footerConfig = {
      ...footerConfig,
      supportEmail,
    };

    await prisma.siteSettings.update({
      where: { id: "GLOBAL" },
      data: { 
        siteName: storeName,
        fxConfig: JSON.stringify(fxConfig),
        footerConfig: JSON.stringify(footerConfig),
      }
    });

    await createAuditLog({
      action: "PLATFORM_SETTINGS_UPDATED",
      entity: "SiteSettings",
      entityId: "GLOBAL",
      metadata: {
        siteName: storeName,
        supportEmail,
        primaryCurrency,
        defaultOrderStatus,
      }
    });

    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/store");
    revalidatePath("/admin/dashboard");

    return { 
      success: true, 
      message: "Platform settings updated successfully!",
      data: {
        storeName,
        supportEmail,
        primaryCurrency,
        defaultOrderStatus,
      }
    };
  } catch (error: any) {
    console.error("Failed to update platform settings:", error);
    return {
      success: false,
      message: error?.message || "Failed to update platform settings. Please try again.",
    };
  }
}

export async function updateGlobalSEOSettings(formData: FormData) {
  try {
    const { requireAdmin, createAuditLog } = await import("@/lib/actions/admin");
    await requireAdmin("Settings", "Manage");

    const siteName = formData.get("siteName")?.toString()?.trim() || "The Valid Market";
    const siteDescription = formData.get("siteDescription")?.toString()?.trim() || "";
    const defaultOgImage = formData.get("defaultOgImage")?.toString()?.trim() || "/og-image.jpg";
    const twitterHandle = formData.get("twitterHandle")?.toString()?.trim() || "@TheValidMarket";

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
