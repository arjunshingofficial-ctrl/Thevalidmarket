"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function ReconcileButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReconcile = async () => {
    if (!confirm("Run fulfillment reconciliation for this order? This will safely assign missing entitlements.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/reconcile`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("Fulfillment reconciliation successful!");
        router.refresh();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReconcile}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      Reconcile Fulfillment
    </button>
  );
}
