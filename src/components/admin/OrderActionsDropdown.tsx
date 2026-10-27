"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MoreHorizontal, Eye, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OrderActionsDropdown({ orderId, orderStatus, paymentStatus }: { orderId: string, orderStatus: string, paymentStatus: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: 'cancel' | 'fulfill') => {
    const shortId = orderId.slice(0, 8).toUpperCase();
    if (action === 'cancel') {
      const confirmMsg = `Are you sure you want to CANCEL Order #${shortId}?\n\nThis will mark the order as cancelled, cancel any pending payments, and revoke active entitlements.`;
      if (!window.confirm(confirmMsg)) return;
    } else if (action === 'fulfill') {
      const confirmMsg = `Are you sure you want to FORCE FULFILL Order #${shortId}?`;
      if (!window.confirm(confirmMsg)) return;
    }

    setLoadingAction(action);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action.toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Action failed: " + (data.error || "Unknown error"));
      } else {
        setIsOpen(false);
        router.refresh();
      }
    } catch (e: any) {
      alert("Error: " + (e.message || "Failed to communicate with server"));
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingAction !== null}
        className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-100 focus:outline-none disabled:opacity-50"
      >
        <MoreHorizontal className={`h-4 w-4 ${loadingAction ? 'animate-pulse text-amber-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <Link 
              href={`/admin/orders/${orderId}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              <Eye className="h-4 w-4 text-slate-500" /> View Details
            </Link>
            
            {orderStatus !== 'FULFILLED' && paymentStatus === 'PAID' && (
              <button
                onClick={() => handleAction('fulfill')}
                disabled={loadingAction !== null}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-left disabled:opacity-50"
                role="menuitem"
              >
                <CheckCircle className={`h-4 w-4 text-emerald-500 ${loadingAction === 'fulfill' ? 'animate-spin' : ''}`} />
                {loadingAction === 'fulfill' ? 'Fulfilling...' : 'Force Fulfill'}
              </button>
            )}
            
            {orderStatus !== 'CANCELLED' && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={loadingAction !== null}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium disabled:opacity-50"
                role="menuitem"
              >
                <XCircle className={`h-4 w-4 text-red-500 ${loadingAction === 'cancel' ? 'animate-spin' : ''}`} />
                {loadingAction === 'cancel' ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}

            {paymentStatus !== 'REFUNDED' && (
              <Link
                href={`/admin/orders/${orderId}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium"
                role="menuitem"
              >
                <RotateCcw className="h-4 w-4 text-rose-500" /> Refund Order
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
