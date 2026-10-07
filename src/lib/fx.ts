import { prisma } from "./prisma";

let cachedRates: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function getUsdToInrRate(): Promise<number> {
  const now = Date.now();
  
  // Check memory cache first
  if (cachedRates["USD_INR"] && (now - cachedRates["USD_INR"].timestamp < CACHE_TTL)) {
    return cachedRates["USD_INR"].rate;
  }

  // Check database configuration
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "GLOBAL" }
  });

  let config = { mode: "MANUAL", manualRate: 96 };
  
  if (settings?.fxConfig) {
    try {
      config = JSON.parse(settings.fxConfig);
    } catch (e) {}
  }

  if (config.mode === "MANUAL" && config.manualRate) {
    const rate = config.manualRate;
    cachedRates["USD_INR"] = { rate, timestamp: now };
    return rate;
  }

  // If AUTOMATIC, attempt to fetch from an API (mocked for now, fallback to manual)
  if (config.mode === "AUTO") {
    try {
      // In a real app, call a currency API like OpenExchangeRates or FreeCurrencyAPI here
      // const res = await fetch("...");
      // const data = await res.json();
      // const rate = data.rates.INR;
      
      // MOCK AUTO RATE
      const rate = 83.25; 
      
      cachedRates["USD_INR"] = { rate, timestamp: now };
      return rate;
    } catch (err) {
      console.error("Failed to fetch FX rate, falling back to manual", err);
      return config.manualRate || 96;
    }
  }

  return 96; // Fallback safe default
}

export async function getUsdToBtcRate(): Promise<number> {
  // Similar logic could be implemented for BTC
  return 1 / 65000; // Mock rate: 1 BTC = $65,000
}

export async function convertUsdToInr(usdAmount: number): Promise<{ rate: number; inrAmount: number }> {
  const rate = await getUsdToInrRate();
  const inrAmount = usdAmount * rate;
  return { rate, inrAmount };
}
