"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickMarkPaidButtonProps {
  orderId: string;
  orderNumber: string;
}

export default function QuickMarkPaidButton({
  orderId,
  orderNumber,
}: QuickMarkPaidButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarkPaid = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const confirmMsg = `Are you sure you want to mark Order #${orderNumber} as PAID?\n\nThis will confirm payment, deliver download files, generate licenses/courses, and notify the customer.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MARK_PAID" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Failed to mark order as paid: " + (data.error || "Unknown error"));
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to communicate with server"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMarkPaid}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors disabled:opacity-50"
      title={`Mark Order #${orderNumber} as Paid`}
    >
      <CheckCircle2 className={`w-3.5 h-3.5 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
      <span className="hidden xl:inline">{loading ? "Marking..." : "Mark Paid"}</span>
    </button>
  );
}

