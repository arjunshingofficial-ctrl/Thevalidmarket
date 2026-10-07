"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Terminal, Loader2, User as UserIcon, AlertTriangle, Trash2, MoreVertical, Flag } from "lucide-react";
import Image from "next/image";

export default function CommunityChatClient({ user, isAdmin }: { user: any, isAdmin?: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"CONNECTING" | "LIVE" | "OFFLINE">("CONNECTING");
  
  // Admin custom identity
  const [useCustomIdentity, setUseCustomIdentity] = useState(false);
  const [customName, setCustomName] = useState("SYSTEM");
  const [customAvatarSeed, setCustomAvatarSeed] = useState("admin-sys");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [reportingMsgId, setReportingMsgId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [liveCount, setLiveCount] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Poll for messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchMessages = async () => {
      try {
        const res = await fetch("/api/chat");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        setMessages(prev => {
          // simple merge, assuming order is asc in display (but API returns asc)
          // actually API returns reverse (latest last) so they append naturally
          return data;
        });
        setConnectionStatus("LIVE");
        setLoading(false);
      } catch (e) {
        console.error(e);
        setConnectionStatus("OFFLINE");
      }
    };

    fetchMessages();
    interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, []);

  // Fake live counter synchronized globally
  useEffect(() => {
    const getGlobalLiveCount = () => {
      const now = Date.now();
      // Quantize to 5 second intervals so it only changes every 5 seconds
      const epoch5s = Math.floor(now / 5000);
      
      const baseCount = 1800;
      // 24 hour cycle for daily traffic (peaks and valleys)
      const dailyWave = Math.sin((now / 86400000) * Math.PI * 2) * 800; 
      // 30 minute cycle for organic mid-term fluctuations
      const hourlyWave = Math.cos((now / 1800000) * Math.PI * 2) * 150;
      
      // Fast jitter: deterministic pseudo-random noise based on the 5-second epoch
      let hash = epoch5s;
      hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
      hash = ((hash >> 16) ^ hash) * 0x45d9f3b;
      hash = (hash >> 16) ^ hash;
      const jitter = (Math.abs(hash) % 51) - 25; // -25 to +25
      
      return Math.floor(baseCount + dailyWave + hourlyWave + jitter);
    };

    setLiveCount(getGlobalLiveCount());
    const interval = setInterval(() => {
      setLiveCount(getGlobalLiveCount());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (lastMessageIdRef.current !== latestMessage.id) {
        lastMessageIdRef.current = latestMessage.id;
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || sending) return;

    const messageText = inputValue.trim();
    setInputValue("");
    setSending(true);

    try {
      const payload: any = { message: messageText, asAdmin: isAdmin };
      if (isAdmin && useCustomIdentity) {
        payload.customName = customName;
        payload.customRole = "";
        payload.customAvatarSeed = customAvatarSeed || "SYSTEM";
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const avatarPool = [
    "/avatars/cyber_circuit_mask_1791285857583.jpg",
    "/avatars/cyber_faceless_phone_1791285844697.jpg",
    "/avatars/cyber_glitch_1791285411463.jpg",
    "/avatars/cyber_green_grin_1791285973713.jpg",
    "/avatars/cyber_hoodie_1791285382851.jpg",
    "/avatars/cyber_hood_rimlight_1791285833123.jpg",
    "/avatars/cyber_mask_1791285398886.jpg",
    "/avatars/cyber_matrix_face_1791285986628.jpg",
    "/avatars/cyber_mohawk_1791285962975.jpg",
    "/avatars/cyber_neon_1791285425243.jpg",
    "/avatars/cyber_ponytail_1791285821783.jpg",
    "/avatars/cyber_skull_mask_1791285867926.jpg"
  ];

  const generateAvatar = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarPool.length;
    return avatarPool[index];
  };

  const handleReport = async () => {
    if (!reportingMsgId || !reportReason.trim()) return;
    try {
      await fetch("/api/chat/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: reportingMsgId, reason: reportReason })
      });
      alert("Message reported successfully.");
    } catch (e) {
      console.error(e);
    } finally {
      setReportingMsgId(null);
      setReportReason("");
    }
  };

  const handleAdminAction = async (msgId: string, action: 'DELETE' | 'HIDE') => {
    try {
      await fetch("/api/chat/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId, action })
      });
      // optimistically update
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-[700px] max-h-[85vh] w-full bg-[#0a0a0c] text-slate-300 font-sans border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111116] border-b border-slate-800/80 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-emerald-500" />
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-widest font-mono">
              COMMUNITY_CHANNEL
            </h2>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Public community room</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
            {connectionStatus === "LIVE" ? (
              <>
                <span className="text-slate-400 mr-2">{liveCount !== null ? `${liveCount.toLocaleString()} ONLINE` : "..."}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> 
                <span className="text-emerald-500">LIVE</span>
              </>
            ) : connectionStatus === "CONNECTING" ? (
              <><span className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-amber-500">CONNECTING</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-red-500">OFFLINE</span></>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#0a0a0c] custom-scrollbar scroll-smooth"
        style={{ scrollbarColor: '#334155 transparent', scrollbarWidth: 'thin' }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center flex-col text-slate-600 font-mono text-sm">
            <Terminal className="h-8 w-8 mb-2 opacity-50" />
            <p>NO_MESSAGES_FOUND</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            let senderName = msg.user?.name || "USER";
            let avatarSeed = msg.userId;
            
            if (msg.customIdentity) {
              try {
                const parsed = JSON.parse(msg.customIdentity);
                senderName = parsed.name || senderName;
                avatarSeed = parsed.avatarSeed || avatarSeed;
              } catch (e) {}
            }

            const isMe = msg.userId === user.id;
            const isSystemAdmin = msg.isAdmin;
            const showTime = true; // Could conditionally show
            
            return (
              <div key={msg.id} className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className="shrink-0 mt-0.5 relative">
                  <div className={`w-8 h-8 rounded bg-slate-800 overflow-hidden border ${isSystemAdmin ? 'border-amber-500/50' : 'border-slate-700/50'}`}>
                    <img src={generateAvatar(avatarSeed)} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className={`text-xs font-bold font-mono tracking-wide ${isSystemAdmin ? "text-amber-500" : isMe ? "text-emerald-400" : "text-cyan-400"}`}>
                      {senderName}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono font-medium uppercase">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="relative flex items-start gap-2">
                    {isMe && activeMenu !== msg.id && (
                       <button onClick={() => setActiveMenu(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-slate-300">
                         <MoreVertical className="h-3 w-3" />
                       </button>
                    )}

                    <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isSystemAdmin 
                        ? "bg-amber-500/10 text-amber-100 border border-amber-500/20" 
                        : isMe 
                          ? "bg-emerald-950/40 text-emerald-50 border border-emerald-900/50 rounded-tr-sm" 
                          : "bg-slate-900/60 text-slate-200 border border-slate-800/80 rounded-tl-sm"
                    }`}>
                      {msg.message}
                    </div>

                    {!isMe && activeMenu !== msg.id && (
                       <button onClick={() => setActiveMenu(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-slate-300 mt-1">
                         <MoreVertical className="h-3 w-3" />
                       </button>
                    )}

                    {/* Context Menu */}
                    {activeMenu === msg.id && (
                      <div className={`absolute top-8 ${isMe ? 'right-0' : 'left-0'} bg-slate-900 border border-slate-700 rounded shadow-xl z-20 flex flex-col p-1 min-w-[120px]`}>
                        <button onClick={() => setActiveMenu(null)} className="text-right text-[10px] text-slate-500 hover:text-slate-300 px-2 pb-1">close</button>
                        {!isMe && (
                          <button onClick={() => {setReportingMsgId(msg.id); setActiveMenu(null);}} className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded">
                            <Flag className="h-3 w-3 text-amber-500"/> Report
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleAdminAction(msg.id, 'DELETE')} className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-800 rounded">
                            <Trash2 className="h-3 w-3"/> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#111116] border-t border-slate-800/80 shrink-0">
        <form onSubmit={handleSend} className="relative flex flex-col gap-2 max-w-4xl mx-auto">
          {isAdmin && (
            <div className="flex flex-col sm:flex-row gap-2 bg-[#0a0a0c] p-2 rounded-xl border border-slate-800 items-start sm:items-center">
              <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useCustomIdentity} 
                  onChange={(e) => setUseCustomIdentity(e.target.checked)}
                  className="accent-amber-500 rounded bg-slate-900 border-slate-700"
                />
                Use Custom Identity
              </label>
              
              {useCustomIdentity && (
                <div className="flex flex-1 gap-2 items-center w-full sm:w-auto">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Display Name (e.g. SYSTEM)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500/50"
                  />
                  <input
                    type="text"
                    value={customAvatarSeed}
                    onChange={(e) => setCustomAvatarSeed(e.target.value)}
                    placeholder="Avatar Seed"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500/50"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="relative flex-1 bg-[#0a0a0c] border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30 transition-all">
              {isAdmin && !useCustomIdentity && (
                <div className="absolute top-2 left-3 flex items-center gap-1.5">
                  <span className="bg-amber-500/20 text-amber-500 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono border border-amber-500/30">Admin Mode</span>
                </div>
              )}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send)"
              className={`w-full bg-transparent text-slate-200 text-sm placeholder:text-slate-600 outline-none resize-none px-4 py-3 max-h-[120px] min-h-[50px] ${isAdmin ? 'pt-7' : ''}`}
              rows={1}
            />
          </div>
          <button 
            type="submit" 
            disabled={!inputValue.trim() || sending || connectionStatus !== "LIVE"}
            className="h-[50px] w-[50px] shrink-0 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl flex items-center justify-center hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            {inputValue.length}/1000 • connection_secured
          </span>
        </div>
      </div>

      {/* Reporting Modal */}
      {reportingMsgId && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#111116] border border-slate-800 rounded-xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="font-mono text-amber-500 font-bold uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Report Message
            </h3>
            <select 
              value={reportReason} 
              onChange={(e) => setReportReason(e.target.value)}
              className="bg-[#0a0a0c] border border-slate-800 text-sm text-slate-300 rounded p-2 outline-none font-mono focus:border-amber-500/50"
            >
              <option value="">Select reason...</option>
              <option value="spam">Spam / Advertising</option>
              <option value="abuse">Harassment / Abuse</option>
              <option value="scam">Scam / Phishing</option>
              <option value="other">Other</option>
            </select>
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setReportingMsgId(null)} className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 uppercase tracking-widest">Cancel</button>
              <button onClick={handleReport} disabled={!reportReason} className="px-4 py-2 text-xs font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-500/20 uppercase tracking-widest disabled:opacity-50">Submit Report</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
