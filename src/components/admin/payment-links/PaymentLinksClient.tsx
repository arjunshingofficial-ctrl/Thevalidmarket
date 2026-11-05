"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Link2, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Trash2, 
  Power,
  ShieldCheck,
  AlertCircle,
  Calendar,
  User,
  Sparkles,
  QrCode
} from "lucide-react";
import { formatUsd, formatInr } from "@/lib/currency";
import { 
  createPaymentLink, 
  togglePaymentLinkStatus, 
  deletePaymentLink 
} from "@/lib/actions/payment-links";
import { useRouter } from "next/navigation";

export interface PaymentLinkItem {
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
  status: string;
  singleUse: boolean;
  expiresAt: string | Date | null;
  paymentsCount: number;
  totalCollected: number;
  createdAt: string | Date;
  createdBy?: {
    name: string | null;
    email: string | null;
  } | null;
}

interface PaymentLinksClientProps {
  initialLinks: PaymentLinkItem[];
  baseUrl: string;
  inrRate: number;
}

export default function PaymentLinksClient({
  initialLinks,
  baseUrl,
  inrRate,
}: PaymentLinksClientProps) {
  const router = useRouter();
  const [links, setLinks] = useState<PaymentLinkItem[]>(initialLinks);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [customSlug, setCustomSlug] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [singleUse, setSingleUse] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number>(0);

  // Filtered links
  const filteredLinks = links.filter((link) => {
    const matchesStatus = statusFilter === "ALL" || link.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      link.title.toLowerCase().includes(q) ||
      link.slug.toLowerCase().includes(q) ||
      (link.customerName && link.customerName.toLowerCase().includes(q)) ||
      (link.customerEmail && link.customerEmail.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const totalLinks = links.length;
  const activeLinks = links.filter((l) => l.status === "ACTIVE").length;
  const totalPaymentsCount = links.reduce((sum, l) => sum + l.paymentsCount, 0);
  const totalCollectedRevenue = links.reduce((sum, l) => sum + (l.totalCollected || (l.status === "PAID" ? l.amount : 0)), 0);

  const handleCopyUrl = (slug: string) => {
    const url = `${baseUrl}/pay/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await togglePaymentLinkStatus(id);
      if (res.success && res.status) {
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: res.status! } : l))
        );
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete or disable this payment link?")) return;
    try {
      const res = await deletePaymentLink(id);
      if (res.success) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError("Please enter a title for the payment link");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError("Please enter a valid amount greater than $0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createPaymentLink({
        title,
        amount: Number(amount),
        customSlug: customSlug.trim() || undefined,
        description: description.trim() || undefined,
        customerName: customerName.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        singleUse,
        expiresInDays: expiresInDays > 0 ? expiresInDays : undefined,
      });

      if (!res.success) {
        setFormError(res.error || "Failed to create payment link");
        return;
      }

      // Close modal and refresh state
      setIsModalOpen(false);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCustomSlug("");
    setDescription("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSingleUse(false);
    setExpiresInDays(0);
    setFormError(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Link2 className="w-8 h-8 text-indigo-600" />
            <span>Payment Links</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Generate custom payment pages with unique URLs for customer orders, private services, and VIP deals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Payment Link</span>
        </button>
      </div>

      {/* ── KPI Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Links</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Link2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalLinks}</div>
          <div className="text-xs text-slate-400 mt-0.5">Created across store</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Links</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeLinks}</div>
          <div className="text-xs text-slate-400 mt-0.5">Accepting payments now</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payments Completed</span>
            <span className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalPaymentsCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Times links were paid</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collected</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatUsd(totalCollectedRevenue)}</div>
          <div className="text-xs text-slate-400 mt-0.5">~ {formatInr(totalCollectedRevenue * inrRate)}</div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, URL slug, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ACTIVE", "PAID", "EXPIRED", "DISABLED"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Links Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLinks.length === 0 ? (
          <div className="py-16 text-center">
            <Link2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No payment links found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first custom payment link to share direct checkout pages with your clients.
            </p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Link</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Title &amp; URL Slug</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Customer Target</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Usage</th>
                  <th className="py-3.5 px-5">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLinks.map((link) => {
                  const url = `${baseUrl}/pay/${link.slug}`;
                  const isCopied = copiedSlug === link.slug;
                  const inrApprox = Math.round(link.amount * inrRate);

                  return (
                    <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Title & Slug */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 text-sm">{link.title}</div>
                        <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-indigo-600">
                          <span>/pay/{link.slug}</span>
                        </div>
                        {link.description && (
                          <div className="text-slate-400 text-xs mt-0.5 line-clamp-1">
                            {link.description}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatUsd(link.amount)}
                        </div>
                        <div className="text-slate-400 text-[11px] font-medium">
                          ~ {formatInr(inrApprox)}
                        </div>
                      </td>

                      {/* Customer Target */}
                      <td className="py-4 px-5">
                        {link.customerName || link.customerEmail ? (
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {link.customerName || "Designated Client"}
                            </div>
                            {link.customerEmail && (
                              <div className="text-slate-400 text-[11px] font-mono">
                                {link.customerEmail}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Anyone with link</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            link.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : link.status === "PAID"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : link.status === "EXPIRED"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {link.status === "ACTIVE" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          <span>{link.status}</span>
                        </span>
                        {link.singleUse && (
                          <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                            Single Use
                          </span>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {link.paymentsCount} {link.paymentsCount === 1 ? "payment" : "payments"}
                        </div>
                        {link.totalCollected > 0 && (
                          <div className="text-[11px] text-emerald-600 font-bold">
                            {formatUsd(link.totalCollected)} collected
                          </div>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-4 px-5 whitespace-nowrap text-xs text-slate-500">
                        {new Date(link.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy URL */}
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(link.slug)}
                            title="Copy Payment Link URL"
                            className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                              isCopied
                                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          {/* View Live */}
                          <a
                            href={`/pay/${link.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Live Payment Page"
                            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Toggle Active */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(link.id)}
                            title={link.status === "ACTIVE" ? "Disable Link" : "Activate Link"}
                            className={`p-2 rounded-lg border transition-colors ${
                              link.status === "ACTIVE"
                                ? "bg-white border-slate-200 hover:bg-amber-50 text-slate-500 hover:text-amber-600"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(link.id)}
                            title="Delete Link"
                            className="p-2 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Payment Link Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Create Payment Link</h3>
                  <p className="text-xs text-slate-500">Generate a custom payment page with a shareable URL.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Payment Title / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Mentorship &amp; Tool Setup, Private Consult, Custom BIN Bundle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Amount (USD $) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="50.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : "")}
                      className="w-full pl-8 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    INR Conversion Preview
                  </label>
                  <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-800">
                    {amount && Number(amount) > 0 ? formatInr(Math.round(Number(amount) * inrRate)) : "₹0 INR"}
                    <span className="text-[10px] text-slate-400 font-normal block">@ ₹{inrRate} / $1 USD FX</span>
                  </div>
                </div>
              </div>

              {/* Custom Slug */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Custom URL Slug <span className="text-slate-400 font-normal normal-case">(optional - auto-generated if blank)</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs text-slate-500 font-mono">
                    /pay/
                  </span>
                  <input
                    type="text"
                    placeholder="vip-mentorship-john"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-r-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Notes / Description for Customer <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  placeholder="Includes 1-month VIP private access, custom setup configuration, and direct mentor support."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Target Customer (Optional) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target Client Info (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Client Name (e.g. John)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                  <input
                    type="email"
                    placeholder="Client Email (e.g. client@mail.com)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              {/* Options: Expiry and Single-use */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Expires In</span>
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value={0}>Never Expires</option>
                    <option value={1}>24 Hours</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="singleUseCheckbox"
                    checked={singleUse}
                    onChange={(e) => setSingleUse(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="singleUseCheckbox" className="text-xs text-slate-700 font-bold cursor-pointer select-none">
                    Single-Use Link
                    <span className="block text-[11px] text-slate-400 font-normal">Deactivates after 1st successful payment</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submitting ? "Generating..." : "Generate Payment Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

