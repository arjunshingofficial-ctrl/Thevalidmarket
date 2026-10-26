"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Download,
  Key,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

export default function PaymentSuccessClient({
  order,
  initialPayment,
  isGuest,
}: {
  order: any;
  initialPayment: any;
  isGuest: boolean;
}) {
  const router = useRouter();
  const [currentOrder, setCurrentOrder] = useState(order);
  const [polling, setPolling] = useState(order?.paymentStatus !== "PAID");

  const isPaid = currentOrder?.paymentStatus === "PAID";

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/checkout/verify-status?orderId=${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isPaid) {
            setCurrentOrder((prev: any) => ({
              ...prev,
              paymentStatus: "PAID",
              orderStatus: data.orderStatus || "PROCESSING",
            }));
            setPolling(false);
          }
        }
      } catch (e) {
        // quiet error
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, order?.id]);

  const hasDownloads = currentOrder?.items?.some(
    (i: any) => i.product.type === "DIGITAL" || i.product.type === "SOFTWARE"
  );
  const hasLicenses = currentOrder?.items?.some((i: any) => i.product.type === "SOFTWARE");
  const hasCourses = currentOrder?.items?.some((i: any) => i.product.type === "COURSE");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Status Banner */}
        <div
          className={`p-8 text-center transition-all ${
            isPaid ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          }`}
        >
          {isPaid ? (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Payment Confirmed!</h1>
              <p className="text-white/90 text-sm mt-1">
                Your UPI payment was verified and your order has been fulfilled.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                <Clock className="h-10 w-10 text-white animate-spin" />
              </div>
              <h1 className="text-2xl font-bold">Verifying UPI Payment...</h1>
              <p className="text-white/90 text-sm mt-1">
                Awaiting confirmation from BladePay gateway. This page updates automatically.
              </p>
            </div>
          )}
        </div>

        {/* Order Details Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Order Reference</span>
              <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                #{currentOrder?.id?.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Amount Paid</span>
              <span className="text-sm font-semibold text-emerald-600 block mt-0.5">
                {currentOrder?.paymentCurrency === "INR"
                  ? `₹${currentOrder?.paymentAmount?.toFixed(2)}`
                  : `$${currentOrder?.total?.toFixed(2)}`}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Gateway</span>
              <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                BladePay UPI
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Status</span>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full mt-0.5 ${
                  isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {isPaid ? "PAID" : "VERIFYING"}
              </span>
            </div>
          </div>

          {initialPayment?.transactionId && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Transaction Ref / UTR:</span>
              <span className="font-mono font-medium text-slate-700">
                {initialPayment.transactionId}
              </span>
            </div>
          )}

          {/* Items Summary */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Items in this Order ({currentOrder?.items?.length || 0})
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {currentOrder?.items?.map((item: any) => (
                <div key={item.id} className="p-3.5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instant Access Actions */}
          {isPaid && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Instant Access to Your Purchase
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hasDownloads && (
                  <Link
                    href="/dashboard/downloads"
                    className="flex items-center justify-between p-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-200 transition-colors font-medium text-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-blue-600" />
                      Download Files
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                {hasLicenses && (
                  <Link
                    href="/dashboard/licenses"
                    className="flex items-center justify-between p-3.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl border border-purple-200 transition-colors font-medium text-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-purple-600" />
                      View License Keys
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                {hasCourses && (
                  <Link
                    href="/dashboard/courses"
                    className="flex items-center justify-between p-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 transition-colors font-medium text-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      Start Course
                    </span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}

                <Link
                  href={`/dashboard/orders/${currentOrder?.id}`}
                  className="flex items-center justify-between p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 transition-colors font-medium text-sm group"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-slate-600" />
                    View Order Details
                  </span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {!isPaid && (
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => router.refresh()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </button>
            </div>
          )}

          {/* Customer Support Footer */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Need assistance?{" "}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                Contact Customer Support
              </Link>{" "}
              with your order reference #{currentOrder?.id?.slice(0, 8).toUpperCase()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
