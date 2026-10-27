"use client";

import { moderateReview, updateReviewDate } from "@/lib/actions/admin-reviews";
import { Check, X, Eye, EyeOff, Trash2, Calendar, Clock } from "lucide-react";
import { useState } from "react";

function toDatetimeLocal(isoOrDateStr?: string | Date | null): string {
  if (!isoOrDateStr) return "";
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return "";
  }
}

export function ReviewActions({
  reviewId,
  currentStatus,
  initialCreatedAt,
}: {
  reviewId: string;
  currentStatus: string;
  initialCreatedAt?: string | Date;
}) {
  const [loading, setLoading] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateValue, setDateValue] = useState(toDatetimeLocal(initialCreatedAt || new Date()));

  const handleAction = async (action: string, customDate?: string) => {
    if (action === "DELETE" && !confirm("Delete this review permanently?")) return;

    setLoading(true);
    try {
      await moderateReview(reviewId, action, customDate);
    } catch (e: any) {
      console.error("Moderation Error:", e);
      alert(`Failed to moderate review: ${e?.message || e}`);
    } finally {
      setLoading(false);
      setShowDateModal(false);
    }
  };

  const handleSaveDateOnly = async () => {
    if (!dateValue) return;
    setLoading(true);
    try {
      const res = await updateReviewDate(reviewId, new Date(dateValue).toISOString());
      if (res && !res.success) {
        alert(res.error || "Failed to update date");
      }
    } catch (e: any) {
      alert(e?.message || "Failed to update date");
    } finally {
      setLoading(false);
      setShowDateModal(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5">
        {currentStatus === "PENDING" && (
          <>
            <button
              onClick={() => handleAction("APPROVED")}
              disabled={loading}
              className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction("REJECTED")}
              disabled={loading}
              className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}

        {currentStatus === "APPROVED" && (
          <button
            onClick={() => handleAction("HIDDEN")}
            disabled={loading}
            className="p-1.5 text-slate-600 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
            title="Hide"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        )}

        {currentStatus === "HIDDEN" && (
          <button
            onClick={() => handleAction("APPROVED")}
            disabled={loading}
            className="p-1.5 text-slate-600 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
            title="Show"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}

        {currentStatus === "REJECTED" && (
          <button
            onClick={() => handleAction("APPROVED")}
            disabled={loading}
            className="p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50"
            title="Approve"
          >
            <Check className="w-4 h-4" />
          </button>
        )}

        {/* Date Edit Button */}
        <button
          onClick={() => setShowDateModal(true)}
          disabled={loading}
          className="p-1.5 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 disabled:opacity-50"
          title="Edit Review Date"
        >
          <Calendar className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleAction("DELETE")}
          disabled={loading}
          className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Date Edit Modal */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Adjust Review Date</h4>
              </div>
              <button onClick={() => setShowDateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Timestamp
              </label>
              <input
                type="datetime-local"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleSaveDateOnly}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
              >
                Save Date Only
              </button>

              {currentStatus !== "APPROVED" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleAction("APPROVED", dateValue ? new Date(dateValue).toISOString() : undefined)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Date &amp; Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
