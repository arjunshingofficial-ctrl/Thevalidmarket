import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Clock, CheckCircle2, ArrowLeft, ShieldAlert } from "lucide-react";
import { getPaymentLinkPublic } from "@/lib/actions/payment-links";
import { PublicPaymentLinkClient } from "@/components/payment/PublicPaymentLinkClient";

interface PayPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await getPaymentLinkPublic(slug);

  if (!res.success || !res.link) {
    return {
      title: "Invoice Not Found | The Valid Market",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Payment: ${res.link.title} | The Valid Market`,
    description: res.link.description || `Secure checkout for ${res.link.title}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PayPage({ params }: PayPageProps) {
  const { slug } = await params;
  const res = await getPaymentLinkPublic(slug);

  if (!res.success || !res.link) {
    return (
      <div className="min-h-[70vh] bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invoice Not Found</h1>
          <p className="text-sm text-slate-400 mb-6">
            The payment link you are trying to access does not exist or may have been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>
    );
  }

  const { link, amountInr, fxRates, methods, bladePayEnabled, supportSettings } = res;

  // Handle Inactive / Expired / Already Paid
  if (link.status === "EXPIRED" || (link.expiresAt && new Date() > new Date(link.expiresAt))) {
    return (
      <div className="min-h-[70vh] bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Payment Link Expired</h1>
          <p className="text-sm text-slate-400 mb-6">
            This invoice link has expired. Please contact the administrator or support team to request an updated payment link.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>
    );
  }

  if (link.status === "DISABLED") {
    return (
      <div className="min-h-[70vh] bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invoice Disabled</h1>
          <p className="text-sm text-slate-400 mb-6">
            This payment link has been temporarily disabled by the administrator.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>
    );
  }

  if (link.singleUse && (link.status === "PAID" || link.paymentsCount > 0)) {
    return (
      <div className="min-h-[70vh] bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invoice Already Paid</h1>
          <p className="text-sm text-slate-400 mb-6">
            This was a single-use payment link and has already been successfully settled.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PublicPaymentLinkClient
      link={link}
      amountInr={amountInr || 0}
      fxRates={fxRates || { INR: 92, BTC: 0.00001, USDT: 1 }}
      methods={methods || {}}
      bladePayEnabled={Boolean(bladePayEnabled)}
      supportSettings={supportSettings}
    />
  );
}

