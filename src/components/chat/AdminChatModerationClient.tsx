"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { 
  getChatModerationSettings, 
  updateChatModerationSettings, 
  getPendingMessages, 
  moderateMessage 
} from "@/app/admin/chat/actions";

export default function AdminChatModerationClient() {
  const [moderationOn, setModerationOn] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchPendingMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const settings = await getChatModerationSettings();
      setModerationOn(settings.moderationMode);
      await fetchPendingMessages();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingMessages = async () => {
    try {
      const msgs = await getPendingMessages();
      setPendingMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async () => {
    setUpdating(true);
    try {
      const newVal = !moderationOn;
      await updateChatModerationSettings(newVal);
      setModerationOn(newVal);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleModerate = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      const newMsg = editedMessages[id];
      await moderateMessage(id, action, newMsg);
      setPendingMessages(prev => prev.filter(m => m.id !== id));
      
      if (editedMessages[id]) {
        const newEdited = { ...editedMessages };
        delete newEdited[id];
        setEditedMessages(newEdited);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>;

  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">LIVE CHAT MODERATION</h2>
          <p className="text-sm text-slate-500 mt-1">
            {moderationOn 
              ? "All user messages require admin approval before appearing in the live community chat." 
              : "User messages are published to the live community chat immediately without approval."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm text-slate-700">Status: [{moderationOn ? "ON" : "OFF"}]</span>
          <button 
            onClick={handleToggle}
            disabled={updating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${moderationOn ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${moderationOn ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            Pending Messages: {pendingMessages.length}
          </h3>
        </div>
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {pendingMessages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No pending messages in the queue.
            </div>
          ) : (
            pendingMessages.map(msg => (
              <div key={msg.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">{msg.user?.name || msg.user?.email || "User"}</span>
                    <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">PENDING</span>
                  </div>
                  <textarea
                    className="text-sm text-slate-700 bg-slate-100 p-2 rounded border border-slate-200 mt-1 w-full outline-none focus:border-emerald-500 transition-colors resize-y min-h-[40px]"
                    value={editedMessages[msg.id] !== undefined ? editedMessages[msg.id] : msg.message}
                    onChange={(e) => setEditedMessages(prev => ({ ...prev, [msg.id]: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleModerate(msg.id, "APPROVE")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded text-sm font-medium transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </button>
                  <button 
                    onClick={() => handleModerate(msg.id, "REJECT")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-sm font-medium transition-colors"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
