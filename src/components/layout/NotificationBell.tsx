"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminBadges } from "@/components/providers/AdminBadgeContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export function NotificationBell({ isAdmin = false }: { isAdmin?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { recentItems, unseenTotal, hasUnseen, markAsSeen, markAllAsSeen } = useAdminBadges();

  const fetchNotifications = async () => {
    try {
      const url = isAdmin ? "/api/admin/notifications" : "/api/notifications";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    const handleUpdate = () => fetchNotifications();
    window.addEventListener("notification-updated", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notification-updated", handleUpdate);
    };
  }, [isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string, actionUrl?: string) => {
    try {
      const url = isAdmin ? "/api/admin/notifications/read" : "/api/notifications/read";
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (actionUrl) {
        setIsOpen(false);
        router.push(actionUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (isAdmin) {
        markAllAsSeen();
      }
      const url = isAdmin ? "/api/admin/notifications/read" : "/api/notifications/read";
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const totalActionCount = isAdmin ? (unseenTotal + unreadCount) : unreadCount;
  const unseenRecentItems = isAdmin ? recentItems.filter(item => hasUnseen(item.href)) : [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {totalActionCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full border-2 border-white leading-none shadow-xs">
            {totalActionCount > 99 ? "99+" : totalActionCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between p-4 border-b bg-slate-50/80">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Notifications &amp; Activity</h3>
              {totalActionCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {totalActionCount} new
                </span>
              )}
            </div>
            {(unreadCount > 0 || (isAdmin && unseenTotal > 0)) && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Mark read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {/* Admin Action Center for Pending Items */}
            {isAdmin && unseenRecentItems.length > 0 && (
              <div className="p-3 bg-gradient-to-b from-indigo-50/60 to-slate-50/30">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    Needs Action ({unseenRecentItems.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {unseenRecentItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => {
                        markAsSeen(item.href);
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-indigo-100/80 hover:border-indigo-300 hover:shadow-xs transition-all group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        Open →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Notifications Feed */}
            <div className="p-2 space-y-1">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center flex flex-col items-center justify-center text-slate-400">
                  <Bell className="w-7 h-7 mb-1.5 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No recent alerts</p>
                  <p className="text-[10px] text-slate-400">You are all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.actionUrl)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors ${
                      notif.isRead ? "bg-white hover:bg-slate-50" : "bg-blue-50/60 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex gap-2.5">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.isRead ? "bg-slate-200" : "bg-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${notif.isRead ? "text-slate-700 font-medium" : "text-slate-900 font-bold"}`}>
                          {notif.title}
                        </p>
                        <p className={`text-[11px] mt-0.5 line-clamp-2 ${notif.isRead ? "text-slate-500" : "text-slate-600"}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {notif.actionUrl && (
                            <span className="text-[10px] text-primary flex items-center gap-0.5 font-bold">
                              View <ExternalLink className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-2.5 border-t bg-slate-50">
            <Link
              href={isAdmin ? "/admin/notifications" : "/dashboard/notifications"}
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-xs text-slate-600 hover:text-primary font-bold py-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              View Full History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
