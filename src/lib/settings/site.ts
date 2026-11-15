import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { cache } from "react";

/**
 * Cached site settings fetcher.
 * Uses Next.js unstable_cache (cross-request caching for 1 hour with tag "site-settings")
 * combined with React cache() to deduplicate multiple calls during a single request render.
 */
export const getCachedSiteSettings = unstable_cache(
  async () => {
    try {
      return await prisma.siteSettings.findUnique({
        where: { id: "GLOBAL" },
      });
    } catch (error) {
      console.error("Failed to fetch site settings:", error);
      return null;
    }
  },
  ["global-site-settings-v1"],
  { revalidate: 3600, tags: ["site-settings"] }
);

export const getSiteSettings = cache(async () => {
  return getCachedSiteSettings();
});
