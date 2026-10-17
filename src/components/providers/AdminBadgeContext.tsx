"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";

export interface ActionableItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  href: string;
  time: string;
}

export interface BadgeItem {
  count: number;
  latestAt: string | null;
}

export interface AdminBadgeData {
  badges: {
    orders: number;
    paymentReviews: number;
    customers: number;
    chat: number;
    support: number;
    comments: number;
    reviews: number;
  };
  byPath: Record<string, BadgeItem>;
  byGroup: Record<string, BadgeItem>;
  counts: Record<string, number>;
  total: number;
  unseenTotal: number;
  recentItems: ActionableItem[];
  loading: boolean;
  refreshBadges: () => Promise<void>;
  
  hasUnseen: (path: string) => boolean;
  hasUnseenGroup: (groupLabel: string, items?: Array<{ href: string }>) => boolean;
  getBadgeCount: (path: string) => number;
  markAsSeen: (path: string, timestamp?: number) => void;
  markAllAsSeen: () => void;
}

const defaultBadges: AdminBadgeData = {
  badges: {
    orders: 0,
    paymentReviews: 0,
    customers: 0,
    chat: 0,
    support: 0,
    comments: 0,
    reviews: 0,
  },
  byPath: {},
  byGroup: {},
  counts: {},
  total: 0,
  unseenTotal: 0,
  recentItems: [],
  loading: true,
  refreshBadges: async () => {},
  hasUnseen: () => false,
  hasUnseenGroup: () => false,
  getBadgeCount: () => 0,
  markAsSeen: () => {},
  markAllAsSeen: () => {},
};

const AdminBadgeContext = createContext<AdminBadgeData>(defaultBadges);

const STORAGE_KEY = "admin_seen_badges";

const TRACKED_PATHS = [
  "/admin/orders",
  "/admin/payments/review",
  "/admin/customers",
  "/admin/chat",
  "/admin/support",
  "/admin/blog/comments",
  "/admin/reviews",
];

export function AdminBadgeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [data, setData] = useState<{
    badges: typeof defaultBadges.badges;
    byPath: Record<string, BadgeItem>;
    byGroup: Record<string, BadgeItem>;
    counts: Record<string, number>;
    total: number;
    recentItems: ActionableItem[];
  }>({
    badges: defaultBadges.badges,
    byPath: {},
    byGroup: {},
    counts: {},
    total: 0,
    recentItems: [],
  });

  const [loading, setLoading] = useState(true);
  const [seenAt, setSeenAt] = useState<Record<string, number>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Load seen timestamps from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setSeenAt(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load seen badges from localStorage", e);
    }
    setIsHydrated(true);
  }, []);

  const refreshBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/badges", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        
        // Normalize byPath so it always provides { count, latestAt }
        const normalizedByPath: Record<string, BadgeItem> = {};
        if (json.byPath) {
          Object.keys(json.byPath).forEach((k) => {
            const v = json.byPath[k];
            if (typeof v === "number") {
              normalizedByPath[k] = { count: v, latestAt: null };
            } else if (v && typeof v === "object") {
              normalizedByPath[k] = {
                count: Number(v.count) || 0,
                latestAt: v.latestAt || null,
              };
            }
          });
        }

        // Normalize byGroup so it always provides { count, latestAt }
        const normalizedByGroup: Record<string, BadgeItem> = {};
        if (json.byGroup) {
          Object.keys(json.byGroup).forEach((k) => {
            const v = json.byGroup[k];
            if (typeof v === "number") {
              normalizedByGroup[k] = { count: v, latestAt: null };
            } else if (v && typeof v === "object") {
              normalizedByGroup[k] = {
                count: Number(v.count) || 0,
                latestAt: v.latestAt || null,
              };
            }
          });
        }

        const counts = json.counts || {};

        setData({
          badges: json.badges || defaultBadges.badges,
          byPath: normalizedByPath,
          byGroup: normalizedByGroup,
          counts,
          total: json.total || 0,
          recentItems: json.recentItems || [],
        });
      }
    } catch (err) {
      console.error("Failed to load admin badge counts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBadges();
    const timer = setInterval(refreshBadges, 30000);
    return () => clearInterval(timer);
  }, [refreshBadges]);

  // Mark a specific path as seen
  const markAsSeen = useCallback((path: string, timestamp = Date.now()) => {
    setSeenAt((prev) => {
      if (prev[path] && prev[path] >= timestamp) {
        return prev;
      }
      const next = { ...prev, [path]: timestamp };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save seen badges to localStorage", e);
      }
      return next;
    });
  }, []);

  // Mark all paths as seen
  const markAllAsSeen = useCallback(() => {
    const now = Date.now();
    setSeenAt((prev) => {
      const next = { ...prev };
      Object.keys(data.byPath).forEach((p) => {
        next[p] = now;
      });
      TRACKED_PATHS.forEach((p) => {
        next[p] = now;
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save seen badges to localStorage", e);
      }
      return next;
    });
  }, [data.byPath]);

  // Check if a path has unseen updates
  const hasUnseen = useCallback(
    (path: string): boolean => {
      const item = data.byPath[path];
      if (!item) return false;
      const count = typeof item === "number" ? item : item.count;
      if (!count || count <= 0) return false;

      const seenTime = seenAt[path];
      const latestAt = typeof item === "object" ? item.latestAt : null;

      if (!latestAt) {
        return !seenTime;
      }

      const latestTime = new Date(latestAt).getTime();
      if (isNaN(latestTime)) return false;

      // If seenTime is at or after latestTime, it has been seen!
      if (seenTime && seenTime >= latestTime) {
        return false;
      }

      return true;
    },
    [data.byPath, seenAt]
  );

  // Check if a group has any unseen items
  const hasUnseenGroup = useCallback(
    (groupLabel: string, items?: Array<{ href: string }>): boolean => {
      if (items && items.length > 0) {
        return items.some((item) => hasUnseen(item.href));
      }

      const group = data.byGroup[groupLabel];
      if (!group) return false;
      const count = typeof group === "number" ? group : group.count;
      if (!count || count <= 0) return false;

      const seenTime = seenAt[groupLabel];
      const latestAt = typeof group === "object" ? group.latestAt : null;
      if (!latestAt) return !seenTime;

      const latestTime = new Date(latestAt).getTime();
      if (isNaN(latestTime)) return false;

      return !seenTime || seenTime < latestTime;
    },
    [hasUnseen, data.byGroup, seenAt]
  );

  // Get badge count for a path
  const getBadgeCount = useCallback(
    (path: string): number => {
      const item = data.byPath[path];
      if (!item) return 0;
      return typeof item === "number" ? item : item.count || 0;
    },
    [data.byPath]
  );

  // Total unseen count across all sections
  const unseenTotal = useMemo(() => {
    return Object.keys(data.byPath).reduce((acc, p) => {
      if (hasUnseen(p)) {
        const item = data.byPath[p];
        const c = typeof item === "number" ? item : item?.count || 0;
        return acc + c;
      }
      return acc;
    }, 0);
  }, [data.byPath, hasUnseen]);

  // Automatically mark section as seen when admin navigates to or views it
  useEffect(() => {
    if (!pathname) return;

    const matched = TRACKED_PATHS.find(
      (trackPath) =>
        pathname === trackPath ||
        pathname.startsWith(trackPath + "/") ||
        pathname.startsWith(trackPath + "?")
    );

    if (matched) {
      markAsSeen(matched);
    }
  }, [pathname, data.byPath, markAsSeen]);

  return (
    <AdminBadgeContext.Provider
      value={{
        ...data,
        unseenTotal,
        loading,
        refreshBadges,
        hasUnseen,
        hasUnseenGroup,
        getBadgeCount,
        markAsSeen,
        markAllAsSeen,
      }}
    >
      {children}
    </AdminBadgeContext.Provider>
  );
}

export function useAdminBadges() {
  return useContext(AdminBadgeContext);
}
