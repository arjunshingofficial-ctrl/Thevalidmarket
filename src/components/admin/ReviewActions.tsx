"use client";

import { moderateReview } from "@/lib/actions/admin-reviews";
import { Check, X, Eye, EyeOff, Trash2, MoreVertical } from "lucide-react";
import { useState } from "react";

export function ReviewActions({ reviewId, currentStatus }: { reviewId: string; currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = async (action: string) => {
    if (action === "DELETE" && !confirm("Delete this review permanently?")) return;
    
    setLoading(true);
    setIsOpen(false);
    try {
      await moderateReview(reviewId, action);
    } catch (e: any) {
      console.error("Moderation Error:", e);
      alert(`Failed to moderate review: ${e?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        {currentStatus === "PENDING" && (
          <>
            <button onClick={() => handleAction("APPROVED")} disabled={loading} className="p-1 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50" title="Approve">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => handleAction("REJECTED")} disabled={loading} className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50" title="Reject">
              <X className="w-4 h-4" />
            </button>
          </>
        )}
        
        {currentStatus === "APPROVED" && (
          <button onClick={() => handleAction("HIDDEN")} disabled={loading} className="p-1 text-slate-600 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50" title="Hide">
            <EyeOff className="w-4 h-4" />
          </button>
        )}
        
        {currentStatus === "HIDDEN" && (
          <button onClick={() => handleAction("APPROVED")} disabled={loading} className="p-1 text-slate-600 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50" title="Show">
            <Eye className="w-4 h-4" />
          </button>
        )}
        
        {currentStatus === "REJECTED" && (
          <button onClick={() => handleAction("APPROVED")} disabled={loading} className="p-1 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50" title="Approve">
            <Check className="w-4 h-4" />
          </button>
        )}

        <button onClick={() => handleAction("DELETE")} disabled={loading} className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
