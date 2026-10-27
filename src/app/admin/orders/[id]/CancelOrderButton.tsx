"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
}

export function CancelOrderButton({
  orderId,
  orderNumber,
  orderStatus,
}: CancelOrderButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (orderStatus === "CANCELLED") {
    return null;
  }

  const handleCancel = async () => {
    const confirmMsg = `Are you sure you want to CANCEL Order #${orderNumber}?\n\nThis will mark the order as cancelled, cancel any pending payments, and revoke active entitlements.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Order cancelled successfully.");
        router.refresh();
      } else {
        alert("Failed to cancel order: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to communicate with server"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="flex items-center gap-2 px-3.5 py-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
      title="Cancel this order"
    >
      <XCircle className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Cancelling..." : "Cancel Order"}
    </button>
  );
}
