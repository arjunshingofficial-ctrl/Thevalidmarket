"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Send, 
  X, 
  Bell, 
  Megaphone, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  User, 
  Loader2,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface SendNotificationModalProps {
  users?: UserOption[];
  triggerButtonText?: string;
  triggerButtonClass?: string;
  defaultOpen?: boolean;
}

export function SendNotificationModal({
  users = [],
  triggerButtonText = "Send Notification",
  triggerButtonClass,
  defaultOpen = false,
}: SendNotificationModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [targetType, setTargetType] = useState<"ALL" | "USER">("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [type, setType] = useState<"ANNOUNCEMENT" | "PROMOTION" | "ALERT" | "SYSTEM" | "WALLET">("ANNOUNCEMENT");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "CRITICAL">("HIGH");
  const [isPopup, setIsPopup] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a notification title." });
      return;
    }
    if (!message.trim()) {
      setStatusMessage({ type: "error", text: "Please enter the notification message." });
      return;
    }
    if (targetType === "USER" && !selectedUserId) {
      setStatusMessage({ type: "error", text: "Please select a specific recipient user." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          targetType,
          userId: targetType === "USER" ? selectedUserId : undefined,
          type,
          priority,
          isPopup,
          actionUrl: actionUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send notification.");
      }

      setStatusMessage({
        type: "success",
        text: data.message || "Notification sent successfully!",
      });

      // Dispatch event to update notification bells immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notification-updated"));
      }

      // Reset form fields after 1.5s and refresh router
      setTimeout(() => {
        setTitle("");
        setMessage("");
        setActionUrl("");
        setSelectedUserId("");
        setStatusMessage(null);
        if (!defaultOpen) {
          setIsOpen(false);
        }
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!defaultOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setStatusMessage(null);
          }}
          className={
            triggerButtonClass ||
            "bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
          }
        >
          <Plus className="h-4 w-4" />
          <span>{triggerButtonText}</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary-foreground border border-white/10">
                  <Megaphone className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">Send Notification</h3>
                  <p className="text-xs text-slate-300">
                    Broadcast announcements or send targeted pop-up alerts to users.
                  </p>
                </div>
              </div>
              {!defaultOpen && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {statusMessage && (
                <div
                  className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${
                    statusMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {statusMessage.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {/* Step 1: Target Audience */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Recipient Audience
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType("ALL")}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      targetType === "ALL"
                        ? "border-primary bg-primary/5 text-primary shadow-xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>All Users (Broadcast)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType("USER")}
                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all cursor-pointer ${
                      targetType === "USER"
                        ? "border-primary bg-primary/5 text-primary shadow-xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Specific User</span>
                  </button>
                </div>

                {targetType === "USER" && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      placeholder="Search user by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    >
                      <option value="">-- Choose a user ({filteredUsers.length} available) --</option>
                      {filteredUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name ? `${u.name} (${u.email})` : u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Step 2: Notification Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Category / Type
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  >
                    <option value="ANNOUNCEMENT">📢 Announcement</option>
                    <option value="PROMOTION">✨ Promotion / Deal</option>
                    <option value="ALERT">⚠️ Important Alert</option>
                    <option value="SYSTEM">⚙️ System Notice</option>
                    <option value="WALLET">💳 Wallet &amp; Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  >
                    <option value="NORMAL">Normal (Standard bell feed)</option>
                    <option value="HIGH">High (Triggers Pop-up)</option>
                    <option value="CRITICAL">Critical (Urgent Attention)</option>
                  </select>
                </div>
              </div>

              {/* Step 3: Pop-up Option Checkbox */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isPopupCheckbox"
                  checked={isPopup}
                  onChange={(e) => setIsPopup(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isPopupCheckbox" className="text-xs text-slate-700 cursor-pointer">
                  <strong className="block font-bold text-indigo-950">
                    Show as Pop-up Dialog when user logs in / visits the website
                  </strong>
                  Users will receive an interactive modal dialog immediately on screen until acknowledged, in addition to the notification bell icon.
                </label>
              </div>

              {/* Step 4: Content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Notification Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50% Off VIP Drops This Weekend! 🎉"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter full details of the notification here. You can explain the updates, coupon codes, or instructions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed font-normal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Action Button Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /store or /dashboard/wallet or https://t.me/..."
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    If provided, a &quot;View Details&quot; button will navigate directly to this destination.
                  </p>
                </div>
              </div>

              {/* Step 5: Live Pop-up Preview */}
              {showPreview && (title.trim() || message.trim()) && (
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Live User Pop-up Preview
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                      Preview
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {type}
                      </span>
                      {priority === "CRITICAL" && (
                        <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Critical
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {title.trim() || "Notification Title Preview"}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                      {message.trim() || "Your notification body will display here..."}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg border text-xs text-slate-600 font-medium">
                        Got it, close
                      </div>
                      {actionUrl.trim() && (
                        <div className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1">
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t flex items-center justify-end gap-3">
                {!defaultOpen && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Notification...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send to {targetType === "ALL" ? "All Users" : "Selected User"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
