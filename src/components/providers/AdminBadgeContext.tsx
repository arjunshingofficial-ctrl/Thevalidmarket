"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ActionableItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  href: string;
  time: string;
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
  byPath: Record<string, number>;
  byGroup: Record<string, number>;
  total: number;
  recentItems: ActionableItem[];
  loading: boolean;
  refreshBadges: () => Promise<void>;
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
  total: 0,
  recentItems: [],
  loading: true,
  refreshBadges: async () => {},
};

const AdminBadgeContext = createContext<AdminBadgeData>(defaultBadges);

export function AdminBadgeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{
    badges: typeof defaultBadges.badges;
    byPath: Record<string, number>;
    byGroup: Record<string, number>;
    total: number;
    recentItems: ActionableItem[];
  }>({
    badges: defaultBadges.badges,
    byPath: {},
    byGroup: {},
    total: 0,
    recentItems: [],
  });
  const [loading, setLoading] = useState(true);

  const refreshBadges = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/badges", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData({
          badges: json.badges || defaultBadges.badges,
          byPath: json.byPath || {},
          byGroup: json.byGroup || {},
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
    // Poll every 30 seconds for live updates
    const timer = setInterval(refreshBadges, 30000);
    return () => clearInterval(timer);
  }, [refreshBadges]);

  return (
    <AdminBadgeContext.Provider
      value={{
        ...data,
        loading,
        refreshBadges,
      }}
    >
      {children}
    </AdminBadgeContext.Provider>
  );
}

export function useAdminBadges() {
  return useContext(AdminBadgeContext);
}
