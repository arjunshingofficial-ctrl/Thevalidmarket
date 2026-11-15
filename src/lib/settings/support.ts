import { getSiteSettings } from "./site";

export const DEFAULT_TELEGRAM_SUPPORT_URL = "https://t.me/+xpN22t7nSkk4ZWJl";
export const DEFAULT_SUPPORT_EMAIL = "support@thevalidmarket.com";

export interface SupportSettings {
  telegramUrl: string;
  telegramActive: boolean;
  whatsappUrl: string;
  whatsappActive: boolean;
  supportEmail: string;
}

export function formatTelegramUrl(input?: string | null): string {
  if (!input) return DEFAULT_TELEGRAM_SUPPORT_URL;
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_TELEGRAM_SUPPORT_URL;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const clean = trimmed.replace(/^@/, "");
  return `https://t.me/${clean}`;
}

export function formatWhatsAppUrl(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export async function getSupportSettings(): Promise<SupportSettings> {
  let telegramUrl = DEFAULT_TELEGRAM_SUPPORT_URL;
  let telegramActive = true;
  let whatsappUrl = "";
  let whatsappActive = true;
  let supportEmail = DEFAULT_SUPPORT_EMAIL;

  try {
    const settings = await getSiteSettings();
    if (settings?.footerConfig) {
      const parsed = JSON.parse(settings.footerConfig);
      if (parsed.telegramUrl !== undefined && typeof parsed.telegramUrl === "string" && parsed.telegramUrl.trim()) {
        telegramUrl = formatTelegramUrl(parsed.telegramUrl);
      }
      if (parsed.telegramActive !== undefined) {
        telegramActive = !!parsed.telegramActive;
      }
      if (parsed.whatsappUrl !== undefined && typeof parsed.whatsappUrl === "string") {
        whatsappUrl = parsed.whatsappUrl.trim();
      }
      if (parsed.whatsappActive !== undefined) {
        whatsappActive = !!parsed.whatsappActive;
      }
      if (parsed.supportEmail && typeof parsed.supportEmail === "string") {
        supportEmail = parsed.supportEmail.trim();
      }
    }
  } catch (err) {
    console.error("Failed to load support settings:", err);
  }

  return {
    telegramUrl: formatTelegramUrl(telegramUrl),
    telegramActive,
    whatsappUrl,
    whatsappActive,
    supportEmail,
  };
}
