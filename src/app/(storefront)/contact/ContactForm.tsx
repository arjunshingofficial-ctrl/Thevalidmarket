"use client";

import React, { useState, useTransition } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  User,
  HelpCircle,
  Hash,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { submitContactInquiry } from "@/lib/actions/contact";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("ORDER");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    referenceId?: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    formData.set("category", category);
    formData.set("orderId", orderId);
    formData.set("subject", subject);
    formData.set("message", message);

    startTransition(async () => {
      const res = await submitContactInquiry(formData);
      setResult(res);
      if (res.success) {
        setName("");
        setEmail("");
        setOrderId("");
        setSubject("");
        setMessage("");
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xl shadow-slate-100">
      <div className="mb-8">
        <span className="text-[11px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Priority Help Desk</span>
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Send Us a Direct Message
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Fill out the details below and our technical support team will review and reply within 2–4 hours.
        </p>
      </div>

      {result && (
        <div
          className={`p-5 rounded-2xl mb-8 border transition-all animate-in fade-in zoom-in-95 ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-sm">
                {result.success ? "Message Dispatched Successfully!" : "Submission Failed"}
              </h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">{result.message}</p>
              {result.referenceId && (
                <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-700">
                    Inquiry Reference: <strong>{result.referenceId}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name <span className="text-red-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Vance"
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 bg-slate-50/50"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address <span className="text-red-500">*</span></span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Inquiry Department <span className="text-red-500">*</span></span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 bg-slate-50/50"
            >
              <option value="ORDER">Order &amp; Delivery Verification</option>
              <option value="PAYMENT">Wallet Deposit &amp; Payment Review</option>
              <option value="COURSES">Course Syllabus &amp; Video Player Access</option>
              <option value="LICENSE">License Keys &amp; Software Activation</option>
              <option value="BUSINESS">Partnership &amp; Custom Orders</option>
              <option value="GENERAL">General Inquiries &amp; Other</option>
            </select>
          </div>

          {/* Order ID / Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>Order / Transaction ID <span className="text-slate-400 font-normal">(Optional)</span></span>
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-98124 or Trx Hash"
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Subject Line</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your question..."
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 bg-slate-50/50"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Your Detailed Message <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            required
            minLength={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe your issue, order details, or questions in detail..."
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60 bg-slate-50/50 resize-y"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transmitting Inquiry to Support Desk...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Priority Message</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-400 mt-2">
          🔒 Encrypted transmission. By submitting, you will receive responses via email and user dashboard.
        </p>
      </form>
    </div>
  );
}
