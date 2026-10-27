"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Megaphone, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight,
  Info
} from "lucide-react";

interface PopupNotification {
  id: string;
  title: string;
  message: string;
  priority: string;
  type: string;
  actionUrl?: string | null;
  createdAt: string;
  metadata?: string | null;
}

export function UserPopupNotification() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [notifications, setNotifications] = useState<PopupNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    const checkPopupNotifications = async () => {
      try {
        const res = await fetch("/api/notifications/popup", {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data.notifications && data.notifications.length > 0) {
          // Check if already dismissed in current session
          const dismissedIds = JSON.parse(sessionStorage.getItem("dismissed_popups") || "[]");
          const active = data.notifications.filter((n: PopupNotification) => !dismissedIds.includes(n.id));

          if (active.length > 0) {
            setNotifications(active);
            setCurrentIndex(0);
            // Slight delay so the page loads cleanly before popping up
            const timer = setTimeout(() => {
              setIsOpen(true);
            }, 800);
            return () => clearTimeout(timer);
          }
        }
      } catch (err) {
        console.error("Failed to check popup notifications:", err);
      }
    };

    checkPopupNotifications();
  }, [status, session]);

  if (!isOpen || notifications.length === 0) {
    return null;
  }

  const current = notifications[currentIndex];
  if (!current) return null;

  const handleDismiss = async (markRead = true) => {
    setIsDismissing(true);

    // Save to sessionStorage so it doesn't immediately re-open on refresh
    try {
      const dismissedIds = JSON.parse(sessionStorage.getItem("dismissed_popups") || "[]");
      if (!dismissedIds.includes(current.id)) {
        dismissedIds.push(current.id);
        sessionStorage.setItem("dismissed_popups", JSON.stringify(dismissedIds));
      }
    } catch {}

    if (markRead) {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: current.id }),
        });
        window.dispatchEvent(new Event("notification-updated"));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    // Check if there are more popup notifications
    if (currentIndex + 1 < notifications.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsDismissing(false);
    } else {
      setIsOpen(false);
      setIsDismissing(false);
    }
  };

  const handleAction = async () => {
    await handleDismiss(true);
    if (current.actionUrl) {
      if (current.actionUrl.startsWith("http://") || current.actionUrl.startsWith("https://")) {
        window.open(current.actionUrl, "_blank", "noopener,noreferrer");
      } else {
        router.push(current.actionUrl);
      }
    }
  };

  // Determine badge styling and icon based on notification type and priority
  const getTypeConfig = () => {
    switch (current.type?.toUpperCase()) {
      case "PROMOTION":
        return {
          icon: <Sparkles className="w-5 h-5 text-amber-500" />,
          badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
          badgeText: "Special Offer",
          accentColor: "from-amber-500 to-orange-500",
        };
      case "ALERT":
      case "CRITICAL":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
          badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
          badgeText: "Important Notice",
          accentColor: "from-rose-500 to-red-600",
        };
      case "SYSTEM":
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
          badgeText: "System Update",
          accentColor: "from-blue-600 to-indigo-600",
        };
      case "WALLET":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
          badgeText: "Wallet & Payment",
          accentColor: "from-emerald-600 to-teal-600",
        };
      case "ANNOUNCEMENT":
      default:
        return {
          icon: <Megaphone className="w-5 h-5 text-primary" />,
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          badgeText: "Announcement",
          accentColor: "from-primary to-indigo-600",
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Decorative Top Accent Bar */}
        <div className={`h-2 w-full bg-gradient-to-r ${config.accentColor}`} />

        <div className="p-6 sm:p-8">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 shadow-xs border border-slate-200/60">
                {config.icon}
              </div>
              <div>
                <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full border ${config.badgeClass}`}>
                  {config.badgeText}
                </span>
                {notifications.length > 1 && (
                  <span className="ml-2 text-xs font-semibold text-slate-400">
                    {currentIndex + 1} of {notifications.length}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDismiss(true)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Close notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            {current.title}
          </h2>

          {/* Message Body */}
          <div className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100 max-h-60 overflow-y-auto">
            {current.message}
          </div>

          {/* Timestamp */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              Sent on {new Date(current.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {current.priority === "CRITICAL" && (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> High Priority
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => handleDismiss(true)}
              disabled={isDismissing}
              className="w-full sm:w-auto flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all text-center"
            >
              Got it, close
            </button>

            {current.actionUrl && (
              <button
                type="button"
                onClick={handleAction}
                disabled={isDismissing}
                className={`w-full sm:w-auto flex-1 px-5 py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r ${config.accentColor} hover:opacity-95 shadow-md shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
              >
                <span>View Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
