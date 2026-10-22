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

  const handleAction = async (action: string) => {
    setIsOpen(false);
    
    // In a full implementation, you would call an API route here
    // For now, this provides the UI foundation
    if (action === 'fulfill') {
      try {
        await fetch(`/api/admin/payments/system-fulfill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        });
        router.refresh();
      } catch (e) {}
    } else if (action === 'cancel') {
      try {
        await fetch(`/api/admin/orders/${orderId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'CANCEL' })
        });
        router.refresh();
      } catch (e) {}
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-100 focus:outline-none"
      >
        <MoreHorizontal className="h-4 w-4" />
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
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-left"
                role="menuitem"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500" /> Force Fulfill
              </button>
            )}
            
            {orderStatus !== 'CANCELLED' && (
              <button
                onClick={() => handleAction('cancel')}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                role="menuitem"
              >
                <XCircle className="h-4 w-4 text-red-500" /> Cancel Order
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
