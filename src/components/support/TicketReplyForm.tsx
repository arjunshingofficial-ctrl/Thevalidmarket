"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

export default function TicketReplyForm({ ticketId, isAdmin = false }: { ticketId: string, isAdmin?: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/support/${ticketId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, isInternal: false })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post reply");

      setMessage("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 bg-white border rounded-xl overflow-hidden shadow-sm">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {error}
        </div>
      )}
      <div className="p-4 border-b bg-slate-50">
        <h3 className="font-semibold text-slate-900 text-sm">Post a Reply</h3>
      </div>
      <div className="p-4">
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isAdmin ? "Type your response to the customer..." : "Type your reply..."}
          className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
        />
      </div>
      <div className="px-4 py-3 bg-slate-50 border-t flex justify-end">
        <button 
          type="submit" 
          disabled={loading || !message.trim()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Reply</>}
        </button>
      </div>
    </form>
  );
}
