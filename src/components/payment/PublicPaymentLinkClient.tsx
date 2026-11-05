"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  Smartphone,
  QrCode,
  Printer,
  ChevronRight,
  HelpCircle,
  Building2,
} from "lucide-react";
import { processPaymentLinkCheckout } from "@/lib/actions/payment-links";
import { formatInr } from "@/lib/currency";

interface PublicPaymentLinkClientProps {
  link: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    amount: number;
    currency: string;
    allowedMethods: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    singleUse: boolean;
    expiresAt: string | Date | null;
    status: string;
    paymentsCount: number;
    createdBy?: {
      name: string | null;
      email: string | null;
    } | null;
  };
  amountInr: number;
  fxRates: {
    INR: number;
    BTC: number;
    USDT: number;
  };
  methods: Record<string, any>;
  bladePayEnabled: boolean;
  supportSettings?: {
    telegramUrl?: string;
    whatsappUrl?: string;
    supportEmail?: string;
  };
}

export function PublicPaymentLinkClient({
  link,
  amountInr,
  fxRates,
  methods,
  bladePayEnabled,
  supportSettings,
}: PublicPaymentLinkClientProps) {
  // Form State
  const [email, setEmail] = useState(link.customerEmail || "");

  // Determine available UPI methods (Only UPI)
  const availableMethods: Array<{
    id: "BLADEPAY" | "UPI_MANUAL";
    label: string;
    badge?: string;
    icon: any;
    desc: string;
  }> = [];

  // BladePay Instant UPI
  if (bladePayEnabled) {
    availableMethods.push({
      id: "BLADEPAY",
      label: "Instant Automated UPI",
      badge: "⚡ FASTEST",
      icon: Smartphone,
      desc: "GPay, PhonePe, Paytm, CRED - Auto Verified",
    });
  }

  // Manual UPI
  availableMethods.push({
    id: "UPI_MANUAL",
    label: "Direct UPI Transfer",
    badge: "QR / VPA",
    icon: QrCode,
    desc: "Scan QR or Transfer to UPI ID & submit UTR",
  });

  const defaultMethod = availableMethods[0]?.id || "UPI_MANUAL";
  const [selectedMethod, setSelectedMethod] = useState<"BLADEPAY" | "UPI_MANUAL">(defaultMethod);
  const [transactionRef, setTransactionRef] = useState("");

  // UI status
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Success result state
  const [successOrder, setSuccessOrder] = useState<{
    orderId: string;
    paymentId?: string;
    paymentStatus?: string;
    submittedAt?: string;
  } | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Addresses & Configurations
  const upiSettings = methods.UPI || methods.UPI_MANUAL || {};
  const upiVpa = upiSettings.vpa || "eqw@upi";
  const upiReceiver = upiSettings.receiverName || "The Valid Market";

  // UPI QR String
  const upiQrString = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(upiReceiver)}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(link.title)}`;

  // WhatsApp Support Config
  const whatsappNumber = upiSettings.whatsappNumber || "+916389458286";
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}`;
  const telegramUrl = supportSettings?.telegramUrl || "https://t.me/+xpN22t7nSkk4ZWJl";

  // Checkout submission handler
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address to receive your receipt & order confirmation.");
      return;
    }

    if (selectedMethod === "UPI_MANUAL" && !transactionRef.trim()) {
      setErrorMessage("Please enter your 12-digit UPI UTR number after making the transfer.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await processPaymentLinkCheckout({
        slug: link.slug,
        name: email.split("@")[0] || "Customer",
        email: email.trim(),
        paymentMethod: selectedMethod,
        utrTransactionId: transactionRef.trim() || undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Payment submission failed. Please try again or contact support.");
        setSubmitting(false);
        return;
      }

      if (res.type === "REDIRECT" && res.cashierUrl) {
        // Redirect to BladePay Gateway Cashier
        window.location.href = res.cashierUrl;
        return;
      }

      // Direct submission success
      setSuccessOrder({
        orderId: res.orderId || "ORD-SUCCESS",
        paymentId: res.paymentId,
        paymentStatus: res.paymentStatus,
        submittedAt: new Date().toLocaleTimeString(),
      });
      setSubmitting(false);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please contact support.");
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (successOrder) {
    const waSupportMsg = `Hello The Valid Market Support,%0A%0AI have submitted payment for *${encodeURIComponent(link.title)}*.%0A%0A*Order ID:* ${successOrder.orderId}%0A*Amount:* ₹${amountInr.toLocaleString()} INR%0A*Method:* ${selectedMethod === "BLADEPAY" ? "Instant Automated UPI" : "Direct UPI Transfer"}%0A${transactionRef ? `*UTR:* ${transactionRef}%0A` : ""}*Email:* ${email}%0A%0APlease verify my transaction.`;
    const waHref = `https://wa.me/${cleanPhone}?text=${waSupportMsg}`;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> PAYMENT RECORDED
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Payment Under Verification
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Your transaction details have been securely recorded. Our automated system and support team are verifying the funds.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 mb-6 space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400">Order ID:</span>
              <span className="font-mono font-bold text-white flex items-center gap-2">
                {successOrder.orderId}
                <button
                  type="button"
                  onClick={() => copyToClipboard(successOrder.orderId, "orderId")}
                  className="text-slate-400 hover:text-white"
                  title="Copy Order ID"
                >
                  {copiedKey === "orderId" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400">Item / Service:</span>
              <span className="font-medium text-white">{link.title}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400">Amount Paid:</span>
              <span className="font-bold text-emerald-400">
                ₹{amountInr.toLocaleString()} INR
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
              <span className="text-slate-400">Payment Method:</span>
              <span className="font-medium text-slate-200">{selectedMethod === "BLADEPAY" ? "Instant Automated UPI" : "Direct UPI Transfer"}</span>
            </div>

            {transactionRef && (
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                <span className="text-slate-400">UTR / TxID:</span>
                <span className="font-mono text-xs text-amber-300 break-all">{transactionRef}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Receipt Sent To:</span>
              <span className="text-slate-300">{email}</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-950"
            >
              <span>Instant Support & Verification on WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <a
                href="/"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
              >
                <span>Back to Store</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-500">
            <p>Verification typically takes 2 to 10 minutes during active hours.</p>
            <p className="mt-1">Official WhatsApp Support: {whatsappNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Trust & Guarantee Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-6 py-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Secure Invoice</p>
              <p className="text-sm font-semibold text-white">The Valid Market Official Checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted
            </span>
            <span className="hidden sm:inline-block">•</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> Escrow Protected
            </span>
          </div>
        </div>

        {/* Main Grid: Details Left, Payment Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Link Information & Customer Form */}
          <div className="lg:col-span-5 space-y-6">
            {/* Payment Summary Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3 uppercase tracking-wider">
                Custom Invoice
              </span>

              <h1 className="text-2xl font-bold text-white tracking-tight leading-snug">
                {link.title}
              </h1>

              {link.description && (
                <p className="text-sm text-slate-300 mt-3 whitespace-pre-line leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                  {link.description}
                </p>
              )}

              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Due</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                    ₹{amountInr.toLocaleString()}
                  </span>
                  <span className="text-sm font-extrabold text-slate-400">INR</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400">Payment Mode:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Direct UPI (Instant)
                  </span>
                </div>
              </div>

              {link.expiresAt && (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Expires on: {new Date(link.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Customer Contact Details (Only Email) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">1</span>
                Your Email Address
              </h2>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Order confirmation, invoice receipt, and access details will be sent directly to this email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Method Selection & Payment Execution */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">2</span>
                UPI Payment Method
              </h2>

              {/* Method Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {availableMethods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`relative text-left p-4 rounded-xl border transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/60 text-white shadow-md shadow-emerald-950"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-5 h-5 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                          <span className="font-bold text-sm">{m.label}</span>
                        </div>
                        {m.badge && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                              isSelected
                                ? "bg-emerald-500 text-slate-950 font-bold"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-snug">{m.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* METHOD 1: BLADEPAY AUTOMATED */}
              {selectedMethod === "BLADEPAY" && (
                <div className="space-y-5 bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Instant Automated UPI Payment</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Pay using PhonePe, Google Pay, Paytm, BHIM, or CRED. Clicking proceed will open the automated gateway cashier where your payment is verified in real-time.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Payable Amount in INR</p>
                      <p className="text-2xl font-extrabold text-emerald-400">₹{amountInr.toLocaleString()} INR</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>Auto-Exchange</p>
                      <p>${link.amount.toFixed(2)} USD</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCheckout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl transition shadow-lg shadow-emerald-950 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span>Redirecting to UPI Cashier...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Proceed to Instant UPI (₹{amountInr.toLocaleString()})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* METHOD 2: MANUAL UPI (VPA & QR) */}
              {selectedMethod === "UPI_MANUAL" && (
                <div className="space-y-6 bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
                    <div className="bg-white p-3 rounded-2xl shadow-xl shrink-0">
                      <QRCode value={upiQrString} size={150} level="M" />
                    </div>
                    <div className="space-y-3 w-full">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Official UPI ID / VPA</p>
                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-2.5 mt-1">
                          <span className="font-mono text-sm font-bold text-white break-all mr-2">{upiVpa}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(upiVpa, "upiVpa")}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Copy UPI ID"
                          >
                            {copiedKey === "upiVpa" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Receiver Name:</span>
                        <span className="font-medium text-white">{upiReceiver}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Exact Amount:</span>
                        <span className="font-extrabold text-emerald-400 text-sm">₹{amountInr.toLocaleString()} INR</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Enter 12-Digit UPI Reference Number (UTR) <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g., 430129381923"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Find the 12-digit UTR in your Google Pay, PhonePe, or Paytm receipt after sending.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleCheckout}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-950 disabled:opacity-50"
                    >
                      {submitting ? "Verifying..." : "Submit UTR & Complete Payment"}
                    </button>
                  </div>
                </div>
              )}



              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Need Direct Assistance Box */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Need Live Payment Assistance?</h4>
                  <p className="text-xs text-slate-400">Contact admin or support directly on WhatsApp or Telegram.</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <span>WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <span>Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

