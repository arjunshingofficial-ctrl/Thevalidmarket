"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/+xpN22t7nSkk4ZWJl");
  
  useEffect(() => {
    fetch("/api/support/channels")
      .then((res) => res.json())
      .then((data) => {
        if (data?.telegramUrl) setTelegramUrl(data.telegramUrl);
      })
      .catch(() => {});
  }, []);
  
  const [formData, setFormData] = useState({
    subject: "",
    category: "GENERAL",
    priority: "NORMAL",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      setError("Subject and message are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");

      router.push("/dashboard/support");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/support" className="p-2 border rounded-md hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Support Ticket</h1>
          <p className="text-slate-500 text-sm mt-1">Describe your issue in detail so we can help you.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        {telegramUrl && (
          <div className="mb-6 p-4 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0088cc] text-white flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 -ml-0.5" />
              </div>
              <span className="text-slate-700 font-medium">Need immediate assistance? Our mentors are online 24/7 on Telegram.</span>
            </div>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0088cc] text-white font-bold hover:bg-[#0077b5] transition-colors shrink-0 shadow-xs"
            >
              <span>Open Telegram</span>
              <span className="text-[10px]">&rarr;</span>
            </a>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input 
              type="text" 
              required
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="GENERAL">General Inquiry</option>
                <option value="BILLING">Billing & Payments</option>
                <option value="TECHNICAL">Technical Support</option>
                <option value="ACCOUNT">Account Issue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select 
                value={formData.priority}
                onChange={e => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea 
              required
              rows={6}
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
              placeholder="Provide as much detail as possible..."
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-medium text-sm flex items-center justify-center min-w-[140px] hover:bg-primary/90 disabled:opacity-70 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
