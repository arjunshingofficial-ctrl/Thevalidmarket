"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function WithdrawalActionClient({ withdrawalId, currentStatus }: { withdrawalId: string, currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAction = async (action: string) => {
    if (action === "REJECT" && !confirm("Are you sure you want to reject this request? The funds will be returned to the user's available balance.")) {
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/referrals/withdrawals/${withdrawalId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-red-600 text-sm">{error}</div>}
      
      <div className="flex flex-col gap-2">
        {currentStatus === "PENDING" && (
          <>
            <button 
              disabled={loading}
              onClick={() => handleAction("APPROVE")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 flex justify-center"
            >
              Approve Request
            </button>
            <button 
              disabled={loading}
              onClick={() => handleAction("REJECT")}
              className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-100 flex justify-center"
            >
              Reject Request
            </button>
          </>
        )}

        {(currentStatus === "APPROVED" || currentStatus === "PROCESSING") && (
          <>
            <button 
              disabled={loading}
              onClick={() => handleAction("MARK_PAID")}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-emerald-700 flex justify-center"
            >
              Mark as Paid
            </button>
            <button 
              disabled={loading}
              onClick={() => handleAction("REJECT")}
              className="bg-red-50 text-red-700 border border-red-200 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-100 flex justify-center"
            >
              Cancel / Reject
            </button>
          </>
        )}

        {currentStatus === "PAID" && (
          <div className="text-emerald-700 font-medium bg-emerald-50 p-3 rounded text-center text-sm border border-emerald-100">
            This withdrawal has been paid successfully.
          </div>
        )}

        {currentStatus === "REJECTED" && (
          <div className="text-red-700 font-medium bg-red-50 p-3 rounded text-center text-sm border border-red-100">
            This withdrawal was rejected.
          </div>
        )}
      </div>
    </div>
  );
}
