"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface MarkPaidButtonProps {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  orderStatus: string;
  total: number;
}

export function MarkPaidButton({
  orderId,
  orderNumber,
  paymentStatus,
  orderStatus,
  total,
}: MarkPaidButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (paymentStatus === "PAID" || orderStatus === "CANCELLED") {
    return null;
  }

  const handleMarkPaid = async () => {
    const confirmMsg = `Are you sure you want to MARK Order #${orderNumber} ($${total}) as PAID?\n\nThis will confirm payment, fulfill digital downloads, create licenses, enroll in courses, and notify the customer.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_PAID" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Order marked as PAID and fulfilled successfully!");
        router.refresh();
      } else {
        alert("Failed to mark order as paid: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to communicate with server"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleMarkPaid}
      disabled={loading}
      className="flex items-center gap-1.5 px-3.5 py-2 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
      title="Mark this order as paid and fulfill items"
    >
      <CheckCircle2 className={`h-4 w-4 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Marking Paid..." : "Mark as Paid"}
    </button>
  );
}

