"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import CharacterCount from "@tiptap/extension-character-count";
import { Extension, Node as TipTapNode, mergeAttributes } from "@tiptap/core";

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  Bold, Italic, Underline, Strikethrough, Code, Code2, Quote,
  List, ListOrdered, ListChecks, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Undo, Redo, Minus, Table as TableIcon, Video,
  Subscript as SubIcon, Superscript as SupIcon, Highlighter,
  X, Upload, Check, Search, Loader2, Maximize2, Minimize2,
  Eye, Code as HtmlIcon, ChevronDown, AlertCircle, Info,
  Lightbulb, CheckCircle, AlertTriangle, Columns, Grid3X3,
  Pilcrow, Palette, Type, LayoutGrid, Plus, Trash2,
  PanelTop, Image as ImgIcon, Sparkles, Smartphone, Monitor,
  HelpCircle, ShieldCheck, Zap
} from "lucide-react";

// ─── Custom extension: YouTube / Vimeo embed ─────────────────────────────────
const VideoEmbed = TipTapNode.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      provider: { default: "youtube" },
      caption: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-video-embed]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-video-embed": "" }, HTMLAttributes), 0];
  },
  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-video-embed", "");
      wrapper.setAttribute("contenteditable", "false");
      wrapper.style.cssText = "position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1rem 0;background:#000";

      const iframe = document.createElement("iframe");
      iframe.setAttribute("src", node.attrs.src || "");
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allowfullscreen", "true");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%";
      wrapper.appendChild(iframe);

      if (node.attrs.caption) {
        const cap = document.createElement("p");
        cap.textContent = node.attrs.caption;
        cap.style.cssText = "text-align:center;font-size:0.875rem;color:#64748b;margin-top:0.5rem";
        wrapper.appendChild(cap);
      }

      return { dom: wrapper };
    };
  },
});

// ─── Custom Callout Node ─────────────────────────────────────────────────────
const Callout = TipTapNode.create({
  name: "callout",
  group: "block",
  content: "block+",
  addAttributes() {
    return {
      type: { default: "info" }, // info | warning | success | error | tip
    };
  },
  parseHTML() { return [{ tag: "div[data-callout]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-callout": "" }, HTMLAttributes), 0];
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

type CalloutType = "info" | "warning" | "success" | "tip" | "error";
const CALLOUT_STYLES: Record<CalloutType, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  info:    { bg: "bg-blue-50",   border: "border-blue-400",  icon: <Info className="w-4 h-4 text-blue-600" />,     label: "Info" },
  warning: { bg: "bg-amber-50",  border: "border-amber-400", icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, label: "Warning" },
  success: { bg: "bg-green-50",  border: "border-green-400", icon: <CheckCircle className="w-4 h-4 text-green-600" />,  label: "Success" },
  tip:     { bg: "bg-purple-50", border: "border-purple-400",icon: <Lightbulb className="w-4 h-4 text-purple-600" />,   label: "Tip" },
  error:   { bg: "bg-red-50",    border: "border-red-400",   icon: <AlertCircle className="w-4 h-4 text-red-600" />,    label: "Error" },
};

// ─── Utility ─────────────────────────────────────────────────────────────────
function getYoutubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v");
    else if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  } catch { return null; }
}

function getVimeoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    const id = u.pathname.split("/").filter(Boolean).pop();
    if (!id || isNaN(Number(id))) return null;
    return `https://player.vimeo.com/video/${id}?dnt=1`;
  } catch { return null; }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick, active, title, disabled, children
}: {
  onClick?: () => void;
  active?: boolean;
  title?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded text-sm transition-colors select-none ${
        disabled ? "opacity-30 cursor-not-allowed" :
        active ? "bg-primary text-white shadow-sm" :
        "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-300/80 mx-0.5 shrink-0" />;
}

function DropMenu({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(o => !o); }}
        title={label}
        className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors select-none"
      >
        {icon}<span className="hidden sm:inline">{label}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[200px] py-1.5 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div onClick={() => setOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, icon, label, shortcut }: { onClick: () => void; icon?: React.ReactNode; label: string; shortcut?: string }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
    >
      {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-slate-400 font-mono">{shortcut}</span>}
    </button>
  );
}

// ─── Image Upload Modal ───────────────────────────────────────────────────────
function ImageModal({ onInsert, onClose }: { onInsert: (url: string, alt: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"upload" | "url" | "library">("upload");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = async () => {
    setLoadingMedia(true);
    const res = await fetch("/api/admin/media");
    if (res.ok) setMedia(await res.json());
    setLoadingMedia(false);
  };

  useEffect(() => { if (tab === "library") fetchMedia(); }, [tab]);

  const doUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Only image files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File size must be under 10MB."); return; }
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
      const data = await res.json();
      setPreview(data.url);
      setUrl(data.url);
    } catch (e: any) { setError(e.message); }
    setUploading(false);
  };

  const handleFile = (f: File) => { setPreview(URL.createObjectURL(f)); doUpload(f); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-900">Insert Image</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex border-b">
          {(["upload", "url", "library"] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
              {t === "url" ? "URL" : t === "library" ? "Media Library" : "Upload"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {tab === "upload" && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-slate-300 hover:border-slate-400"}`}
                onClick={() => document.getElementById("rte-file-input")?.click()}
              >
                <input id="rte-file-input" type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                {uploading ? (
                  <><Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" /><p className="text-sm text-slate-500">Uploading...</p></>
                ) : preview ? (
                  <><img src={preview} className="mx-auto max-h-40 rounded-lg mb-3 object-contain" alt="preview" /><p className="text-xs text-slate-400">Click to replace</p></>
                ) : (
                  <><Upload className="w-10 h-10 mx-auto mb-3 text-slate-400" /><p className="text-sm text-slate-600 font-medium">Drag & drop or click to upload</p><p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF, WebP — max 10MB</p></>
                )}
              </div>
              {error && <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
            </>
          )}
          {tab === "url" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Image URL</label>
                <input type="url" value={url} onChange={e => { setUrl(e.target.value); setPreview(e.target.value); }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              {preview && <img src={preview} onError={() => setPreview(null)} className="max-h-48 rounded-lg object-contain border" alt="preview" />}
            </div>
          )}
          {tab === "library" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media..."
                  className="w-full pl-9 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              {loadingMedia ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div> :
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {media.filter(m => m.mimeType?.startsWith("image/") && m.filename.toLowerCase().includes(search.toLowerCase())).map(m => (
                    <div key={m.id} onClick={() => { setUrl(m.url); setPreview(m.url); }}
                      className={`aspect-square border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${url === m.url ? "border-primary ring-2 ring-primary/30" : "border-slate-200 hover:border-slate-400"}`}>
                      <img src={m.url} className="w-full h-full object-cover" alt={m.filename} />
                    </div>
                  ))}
                </div>
              }
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Alt Text</label>
              <input value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describe the image..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100 transition-colors">Cancel</button>
          <button type="button" disabled={!url || uploading} onClick={() => { if (url) onInsert(url, alt); onClose(); }}
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
            Insert Image
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Video Modal ──────────────────────────────────────────────────────────────
function VideoModal({ onInsert, onClose }: { onInsert: (src: string, provider: string, caption: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInsert = () => {
    const ytUrl = getYoutubeEmbedUrl(url);
    if (ytUrl) { onInsert(ytUrl, "youtube", caption); onClose(); return; }
    const vimeoUrl = getVimeoEmbedUrl(url);
    if (vimeoUrl) { onInsert(vimeoUrl, "vimeo", caption); onClose(); return; }
    setError("Please enter a valid YouTube or Vimeo URL.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-900">Embed Video</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Video URL</label>
            <input value={url} onChange={e => { setUrl(e.target.value); setError(null); }} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          {error && <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</p>}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Caption (optional)</label>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Video caption..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <p className="text-xs text-slate-400">Supports: YouTube (youtube.com, youtu.be) and Vimeo (vimeo.com). Privacy-enhanced mode enabled.</p>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100 transition-colors">Cancel</button>
          <button type="button" disabled={!url} onClick={handleInsert}
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium">
            Embed Video
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Link Modal ───────────────────────────────────────────────────────────────
function LinkModal({ currentUrl, onInsert, onClose }: { currentUrl?: string; onInsert: (url: string, newTab: boolean) => void; onClose: () => void }) {
  const [url, setUrl] = useState(currentUrl || "");
  const [newTab, setNewTab] = useState(true);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-bold text-slate-900">Insert Link</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" autoFocus
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={newTab} onChange={e => setNewTab(e.target.checked)} className="rounded" />
            Open in new tab
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={() => { if (url) { onInsert(url, newTab); onClose(); } }}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">Insert</button>
        </div>
      </div>
    </div>
  );
}

// ─── HTML Source Modal ────────────────────────────────────────────────────────
function HtmlModal({ html, onApply, onClose }: { html: string; onApply: (html: string) => void; onClose: () => void }) {
  const [src, setSrc] = useState(html);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-bold text-slate-900">HTML Source</h3>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <textarea value={src} onChange={e => setSrc(e.target.value)}
            className="w-full h-full min-h-[400px] font-mono text-sm border rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 bg-slate-950 text-green-400"
            spellCheck={false} />
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={() => { onApply(src); onClose(); }}
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">Apply HTML</button>
        </div>
      </div>
    </div>
  );
}

// ─── Templates Definition ──────────────────────────────────────────────────
const PRODUCT_TEMPLATES = [
  {
    id: "software",
    title: "Software & Digital Tools",
    icon: "💻",
    description: "Overview, 3-column features, specifications table, setup guide, and FAQs.",
    html: `<h2>🚀 Overview & Core Highlights</h2>
<p>Get instant access to this high-performance software designed to streamline your workflow and deliver unmatched reliability.</p>

<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:1rem;margin:1.5rem 0">
  <div style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
    <div style="font-size:1.5rem;margin-bottom:0.5rem">⚡</div>
    <h4 style="font-weight:700;margin:0 0 0.25rem">High Performance</h4>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Engineered for speed, efficiency, and minimal resource consumption.</p>
  </div>
  <div style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
    <div style="font-size:1.5rem;margin-bottom:0.5rem">🛡️</div>
    <h4 style="font-weight:700;margin:0 0 0.25rem">100% Virus-Free & Safe</h4>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Clean files verified and tested prior to immediate delivery.</p>
  </div>
  <div style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">
    <div style="font-size:1.5rem;margin-bottom:0.5rem">🔄</div>
    <h4 style="font-weight:700;margin:0 0 0.25rem">Regular Updates</h4>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Receive continuous updates and improvements through your dashboard.</p>
  </div>
</div>

<h2>📋 System Requirements & Compatibility</h2>
<table>
  <thead>
    <tr>
      <th>Specification</th>
      <th>Minimum Requirement</th>
      <th>Recommended</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Operating System</td>
      <td>Windows 10 / macOS 11+</td>
      <td>Windows 11 / macOS 14+</td>
    </tr>
    <tr>
      <td>RAM</td>
      <td>4 GB</td>
      <td>8 GB or higher</td>
    </tr>
    <tr>
      <td>Internet Connection</td>
      <td>Required for activation</td>
      <td>Stable broadband connection</td>
    </tr>
  </tbody>
</table>

<h2>🛠️ Quick 3-Step Setup Guide</h2>
<div style="margin:1.5rem 0">
  <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1rem">
    <div style="width:2rem;height:2rem;background:#6366f1;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;flex-shrink:0">1</div>
    <div><h4 style="margin:0 0 0.25rem;font-weight:700">Download the Files</h4><p style="margin:0;color:#64748b;font-size:0.875rem">Grab the installer instantly from your order confirmation email or dashboard.</p></div>
  </div>
  <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1rem">
    <div style="width:2rem;height:2rem;background:#6366f1;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;flex-shrink:0">2</div>
    <div><h4 style="margin:0 0 0.25rem;font-weight:700">Install & Enter License</h4><p style="margin:0;color:#64748b;font-size:0.875rem">Run the setup wizard and paste your genuine activation key.</p></div>
  </div>
  <div style="display:flex;align-items:flex-start;gap:1rem">
    <div style="width:2rem;height:2rem;background:#6366f1;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;flex-shrink:0">3</div>
    <div><h4 style="margin:0 0 0.25rem;font-weight:700">Ready to Use</h4><p style="margin:0;color:#64748b;font-size:0.875rem">Enjoy all premium features unlocked with peace of mind.</p></div>
  </div>
</div>

<h2>❓ Frequently Asked Questions</h2>
<details open>
  <summary>How fast will I receive the license key?</summary>
  <p>Delivery is fully automated. You will receive your license key and download link instantly after checkout.</p>
</details>
<details>
  <summary>Can I transfer my license to a new PC?</summary>
  <p>Yes, your license can be deactivated and transferred to another computer anytime via customer support.</p>
</details>

<div data-callout="success" style="border-radius:10px;padding:1rem 1.25rem;margin:1.5rem 0;background:#f0fdf4;border-left:4px solid #22c55e">
  <p style="margin:0;font-weight:600;color:#166534">🔒 100% Working Guarantee</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#15803d">If your key fails to activate or you experience any issues, our 24/7 team will replace it immediately.</p>
</div>`
  },
  {
    id: "course",
    title: "Video Course & Masterclass",
    icon: "🎓",
    description: "Course curriculum, key learning outcomes, syllabus breakdown, and guarantees.",
    html: `<h2>🎯 Masterclass Overview</h2>
<p>Transform your expertise with this step-by-step masterclass packed with actionable insights, real-world projects, and downloadable resources.</p>

<h2>✨ What You Will Master</h2>
<ul style="padding-left:1.5rem;line-height:1.8">
  <li>Fundamental concepts and core foundations explained clearly</li>
  <li>Advanced techniques used by top industry professionals</li>
  <li>Live walkthroughs and hands-on practical exercises</li>
  <li>Time-saving shortcuts, workflows, and insider secrets</li>
  <li>Full access to downloadable templates and project files</li>
</ul>

<h2>📚 Course Syllabus & Modules</h2>
<table>
  <thead>
    <tr>
      <th>Module</th>
      <th>Topics Covered</th>
      <th>Format</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Module 1: Foundations</td>
      <td>Setup, key terminology, and essential tools</td>
      <td>Video + PDF Guide</td>
    </tr>
    <tr>
      <td>Module 2: Core Practical Work</td>
      <td>Step-by-step execution and live demonstrations</td>
      <td>Interactive Video</td>
    </tr>
    <tr>
      <td>Module 3: Advanced Strategies</td>
      <td>Scaling up, automation, and maximizing results</td>
      <td>Video + Source Files</td>
    </tr>
  </tbody>
</table>

<div data-callout="info" style="border-radius:10px;padding:1rem 1.25rem;margin:1.5rem 0;background:#eff6ff;border-left:4px solid #3b82f6">
  <p style="margin:0;font-weight:600;color:#1e40af">🎓 Lifetime Access & Continuous Updates Included</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#1d4ed8">Enroll once and access anytime from desktop, tablet, or mobile. Future curriculum updates are included at no extra charge.</p>
</div>`
  },
  {
    id: "subscription",
    title: "Subscription, Account & VPN",
    icon: "🔑",
    description: "Account specs, stat cards, dos & don'ts rules, and replacement warranty.",
    html: `<h2>⭐ Premium Subscription Details</h2>
<p>Unlock uninterrupted premium access with our verified subscription accounts. Enjoy high-speed performance and maximum privacy.</p>

<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:1rem;margin:1.5rem 0">
  <div class="stat-card" style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center">
    <div class="stat-number" style="font-size:1.75rem;font-weight:800;color:#6366f1">⚡ Instant</div>
    <div class="stat-label" style="font-size:0.875rem;color:#64748b;margin-top:0.25rem">Automated Delivery</div>
  </div>
  <div class="stat-card" style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center">
    <div class="stat-number" style="font-size:1.75rem;font-weight:800;color:#22c55e">100%</div>
    <div class="stat-label" style="font-size:0.875rem;color:#64748b;margin-top:0.25rem">Private & Secure</div>
  </div>
  <div class="stat-card" style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center">
    <div class="stat-number" style="font-size:1.75rem;font-weight:800;color:#f59e0b">24/7</div>
    <div class="stat-label" style="font-size:0.875rem;color:#64748b;margin-top:0.25rem">Replacement Warranty</div>
  </div>
</div>

<h2>📌 Account Rules & Guidelines</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0">
  <div style="padding:1rem;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px">
    <h4 style="color:#16a34a;margin:0 0 0.5rem;font-weight:700">✅ Allowed</h4>
    <ul style="margin:0;padding-left:1.25rem;font-size:0.875rem">
      <li>Login on allowed device count</li>
      <li>Use for personal streaming or browsing</li>
      <li>Download content for offline use</li>
    </ul>
  </div>
  <div style="padding:1rem;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px">
    <h4 style="color:#dc2626;margin:0 0 0.5rem;font-weight:700">❌ Prohibited</h4>
    <ul style="margin:0;padding-left:1.25rem;font-size:0.875rem">
      <li>Do not change account email or password</li>
      <li>Do not share credentials publicly</li>
    </ul>
  </div>
</div>

<h2>❓ Frequently Asked Questions</h2>
<details open>
  <summary>How will I receive the account details?</summary>
  <p>The login credentials and setup instructions are sent directly to your email and order screen right after payment.</p>
</details>
<details>
  <summary>What should I do if the account stops working?</summary>
  <p>Our warranty covers the entire duration of your plan. Contact our 24/7 support anytime for an immediate replacement.</p>
</details>`
  },
  {
    id: "gaming",
    title: "Game Keys & Gift Cards",
    icon: "🎮",
    description: "Region warnings, platform activation steps, and buyer security assurance.",
    html: `<h2>🎮 Product Overview</h2>
<p>Purchase genuine, region-verified digital activation codes with zero wait time. Codes are sourced directly from authorized channels.</p>

<div data-callout="warning" style="border-radius:10px;padding:1rem 1.25rem;margin:1.5rem 0;background:#fffbeb;border-left:4px solid #f59e0b">
  <p style="margin:0;font-weight:600;color:#b45309">⚠️ Region Compatibility Notice</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#92400e">Please ensure your account country matches before redemption. Digital keys once delivered cannot be returned if purchased for an incompatible region.</p>
</div>

<h2>🚀 Step-by-Step Activation Instructions</h2>
<ol style="padding-left:1.5rem;line-height:1.8">
  <li>Log in to your platform account (Steam, Epic Games, PlayStation, Xbox, etc.).</li>
  <li>Navigate to <strong>Activate a Product Code</strong> or <strong>Redeem Code</strong>.</li>
  <li>Enter your unique code received from Asia D Market.</li>
  <li>Confirm activation and start downloading your game immediately!</li>
</ol>

<div data-callout="success" style="border-radius:10px;padding:1rem 1.25rem;margin:1.5rem 0;background:#f0fdf4;border-left:4px solid #22c55e">
  <p style="margin:0;font-weight:600;color:#166534">✅ 100% Genuine Working Key</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#15803d">Every code is verified unused before delivery. Instant delivery guaranteed 24 hours a day.</p>
</div>`
  }
];

// ─── Templates Modal ─────────────────────────────────────────────────────────
function TemplatesModal({ onApply, onClose }: { onApply: (html: string, replace: boolean) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<string>("software");
  const [replace, setReplace] = useState(false);

  const activeTpl = PRODUCT_TEMPLATES.find(t => t.id === selected) || PRODUCT_TEMPLATES[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Professional Product Templates
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select a pre-designed layout optimized for digital sales, software, courses, and accounts.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Template Selector List */}
          <div className="border-r border-slate-200 p-4 space-y-2 overflow-y-auto bg-slate-50/50">
            {PRODUCT_TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selected === t.id
                    ? "bg-white border-primary shadow-sm ring-2 ring-primary/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-bold text-sm text-slate-900">{t.title}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
              </button>
            ))}
          </div>

          {/* Template Live Preview */}
          <div className="md:col-span-2 p-6 overflow-y-auto bg-white flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Template Preview</span>
                <h4 className="font-bold text-slate-900 text-base">{activeTpl.title}</h4>
              </div>
              <span className="text-2xl">{activeTpl.icon}</span>
            </div>
            <div
              className="product-description flex-1 overflow-auto border rounded-xl p-5 bg-slate-50/40 text-sm max-h-[420px]"
              dangerouslySetInnerHTML={{ __html: activeTpl.html }}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t bg-slate-50">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={replace}
              onChange={e => setReplace(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>Replace current editor content (uncheck to insert at cursor)</span>
          </label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100 transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onApply(activeTpl.html, replace); onClose(); }}
              className="flex items-center gap-1.5 px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> {replace ? "Apply Template (Replace)" : "Insert Template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Preview Modal ───────────────────────────────────────────────────────
function PreviewModal({ html, onClose }: { html: string; onClose: () => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  const images = (html.match(/<img\b/gi) || []).length;
  const headings = (html.match(/<h[1-6]\b/gi) || []).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50/80">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">Storefront Content Preview</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Live Simulation</span>
          </div>

          {/* Device Toggles */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                device === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                device === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile (375px)
            </button>
          </div>

          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-100/70 p-4 sm:p-8 flex justify-center items-start">
          {device === "desktop" ? (
            <div className="w-full max-w-4xl bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200/80 min-h-full">
              <div
                className="product-description"
                dangerouslySetInnerHTML={{ __html: html || "<p class='text-slate-400 italic text-center py-10'>No content to preview yet. Start typing or insert a template.</p>" }}
              />
            </div>
          ) : (
            <div className="w-[375px] bg-white rounded-[40px] shadow-2xl border-[10px] border-slate-900 overflow-hidden flex flex-col my-auto shrink-0">
              <div className="bg-slate-900 h-6 flex justify-center items-center">
                <div className="w-24 h-4 bg-black rounded-b-xl" />
              </div>
              <div className="p-5 overflow-y-auto max-h-[640px]">
                <div
                  className="product-description text-sm"
                  dangerouslySetInnerHTML={{ __html: html || "<p class='text-slate-400 italic text-center py-8 text-xs'>No content to preview.</p>" }}
                />
              </div>
              <div className="bg-slate-900 h-3 flex justify-center items-center" />
            </div>
          )}
        </div>

        {/* Footer with SEO stats */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span><strong>{words}</strong> words</span>
            <span>⏱️ <strong>~{readTime}</strong> min read</span>
            <span><strong>{headings}</strong> headings</span>
            <span><strong>{images}</strong> images</span>
          </div>
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table Modal ──────────────────────────────────────────────────────────────
function TableModal({ onInsert, onClose }: { onInsert: (rows: number, cols: number, header: boolean) => void; onClose: () => void }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [header, setHeader] = useState(true);
  const MAX = 10;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-bold text-slate-900">Insert Table</h3>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-MAX gap-1" style={{ gridTemplateColumns: `repeat(${MAX},1fr)` }}>
            {Array.from({ length: MAX }, (_, r) =>
              Array.from({ length: MAX }, (_, c) => (
                <div key={`${r}-${c}`}
                  onMouseEnter={() => { setRows(r + 1); setCols(c + 1); }}
                  className={`w-6 h-6 border rounded transition-colors cursor-pointer ${r < rows && c < cols ? "bg-primary/30 border-primary" : "bg-slate-100 border-slate-200"}`}
                />
              ))
            )}
          </div>
          <p className="text-sm text-slate-600 text-center">{rows} × {cols} table</p>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" checked={header} onChange={e => setHeader(e.target.checked)} className="rounded" /> Include header row
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100">Cancel</button>
          <button type="button" onClick={() => { onInsert(rows, cols, header); onClose(); }}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">Insert Table</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RichTextEditor({ name, defaultValue = "", placeholder }: RichTextEditorProps) {
  const [showImage, setShowImage] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        codeBlock: false, // override with custom
      }),
      UnderlineExt,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Subscript,
      Superscript,
      CharacterCount,
      VideoEmbed,
      Callout,
    ],
    content: defaultValue || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-slate prose-lg max-w-none min-h-[400px] p-6 outline-none focus:outline-none",
        "data-placeholder": placeholder || "Start writing your product description...",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      if (hiddenRef.current) hiddenRef.current.value = html;
      const text = editor.getText();
      setWordCount(text.split(/\s+/).filter(Boolean).length);
    },
  });

  // Sync hidden input on mount
  useEffect(() => {
    if (editor && hiddenRef.current) {
      hiddenRef.current.value = editor.getHTML();
    }
  }, [editor]);

  const insertImage = useCallback((url: string, alt: string) => {
    editor?.chain().focus().setImage({ src: url, alt }).run();
  }, [editor]);

  const insertVideo = useCallback((src: string, provider: string, caption: string) => {
    editor?.chain().focus().insertContent({ type: "videoEmbed", attrs: { src, provider, caption } }).run();
  }, [editor]);

  const insertLink = useCallback((url: string, newTab: boolean) => {
    if (editor?.state.selection.empty) {
      editor.chain().focus().setLink({ href: url, target: newTab ? "_blank" : "" }).run();
    } else {
      editor?.chain().focus().toggleLink({ href: url, target: newTab ? "_blank" : "" }).run();
    }
  }, [editor]);

  const insertCallout = useCallback((type: CalloutType) => {
    editor?.chain().focus().insertContent({
      type: "callout",
      attrs: { type },
      content: [{ type: "paragraph", content: [{ type: "text", text: `${CALLOUT_STYLES[type].label}: Enter your message here.` }] }]
    }).run();
  }, [editor]);

  const insertTable = useCallback((rows: number, cols: number, header: boolean) => {
    editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: header }).run();
  }, [editor]);

  const insertTwoCol = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin:1.5rem 0">
        <div style="padding:1rem;border:1px solid #e2e8f0;border-radius:8px"><p>Left column content</p></div>
        <div style="padding:1rem;border:1px solid #e2e8f0;border-radius:8px"><p>Right column content</p></div>
      </div>
    `).run();
  }, [editor]);

  const insertFeatureGrid = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin:1.5rem 0">
        <div style="padding:1.25rem;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
          <div style="font-size:1.5rem;margin-bottom:0.5rem">⚡</div>
          <h4 style="font-weight:700;margin:0 0 0.5rem">Feature Title</h4>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Feature description goes here.</p>
        </div>
        <div style="padding:1.25rem;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
          <div style="font-size:1.5rem;margin-bottom:0.5rem">🔒</div>
          <h4 style="font-weight:700;margin:0 0 0.5rem">Feature Title</h4>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Feature description goes here.</p>
        </div>
        <div style="padding:1.25rem;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:center">
          <div style="font-size:1.5rem;margin-bottom:0.5rem">🚀</div>
          <h4 style="font-weight:700;margin:0 0 0.5rem">Feature Title</h4>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Feature description goes here.</p>
        </div>
      </div>
    `).run();
  }, [editor]);

  const insertProsConsList = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0">
        <div style="padding:1rem;background:#f0fdf4;border-left:4px solid #22c55e;border-radius:8px">
          <h4 style="color:#16a34a;margin:0 0 0.75rem;font-weight:700">✅ Pros</h4>
          <ul style="margin:0;padding-left:1.25rem">
            <li>Advantage one</li>
            <li>Advantage two</li>
            <li>Advantage three</li>
          </ul>
        </div>
        <div style="padding:1rem;background:#fef2f2;border-left:4px solid #ef4444;border-radius:8px">
          <h4 style="color:#dc2626;margin:0 0 0.75rem;font-weight:700">❌ Cons</h4>
          <ul style="margin:0;padding-left:1.25rem">
            <li>Limitation one</li>
            <li>Limitation two</li>
          </ul>
        </div>
      </div>
    `).run();
  }, [editor]);

  const insertSteps = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div style="margin:1.5rem 0;space-y:1rem">
        <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1rem">
          <div style="width:2rem;height:2rem;background:var(--color-primary,#6366f1);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;flex-shrink:0">1</div>
          <div><h4 style="margin:0 0 0.25rem;font-weight:700">Step One Title</h4><p style="margin:0;color:#64748b;font-size:0.875rem">Describe what to do in this step.</p></div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:1rem;margin-bottom:1rem">
          <div style="width:2rem;height:2rem;background:var(--color-primary,#6366f1);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;flex-shrink:0">2</div>
          <div><h4 style="margin:0 0 0.25rem;font-weight:700">Step Two Title</h4><p style="margin:0;color:#64748b;font-size:0.875rem">Describe what to do in this step.</p></div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:1rem">
          <div style="width:2rem;height:2rem;background:var(--color-primary,#6366f1);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;flex-shrink:0">3</div>
          <div><h4 style="margin:0 0 0.25rem;font-weight:700">Step Three Title</h4><p style="margin:0;color:#64748b;font-size:0.875rem">Describe what to do in this step.</p></div>
        </div>
      </div>
    `).run();
  }, [editor]);

  const insertFaqAccordion = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <h2>❓ Frequently Asked Questions</h2>
      <details open>
        <summary>How do I receive my product after purchase?</summary>
        <p>You will receive instant access with your download links and license keys delivered directly to your email and Asia D Market dashboard immediately after payment.</p>
      </details>
      <details>
        <summary>What is your replacement or warranty policy?</summary>
        <p>We provide a 100% working guarantee. If you encounter any issue, contact our 24/7 priority support for an instant replacement or technical assistance.</p>
      </details>
      <details>
        <summary>Can I request customer support if I need help?</summary>
        <p>Yes, our customer support team is available around the clock via live chat and ticket support to ensure a seamless experience.</p>
      </details>
    `).run();
  }, [editor]);

  const insertStatCards = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:1rem;margin:1.5rem 0">
        <div class="stat-card" style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center">
          <div class="stat-number" style="font-size:1.75rem;font-weight:800;color:var(--color-primary,#6366f1)">⚡ Instant</div>
          <div class="stat-label" style="font-size:0.875rem;color:#64748b;margin-top:0.25rem">Automated Delivery</div>
        </div>
        <div class="stat-card" style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center">
          <div class="stat-number" style="font-size:1.75rem;font-weight:800;color:#22c55e">100%</div>
          <div class="stat-label" style="font-size:0.875rem;color:#64748b;margin-top:0.25rem">Genuine & Verified</div>
        </div>
        <div class="stat-card" style="padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center">
          <div class="stat-number" style="font-size:1.75rem;font-weight:800;color:#f59e0b">24/7</div>
          <div class="stat-label" style="font-size:0.875rem;color:#64748b;margin-top:0.25rem">Priority Support</div>
        </div>
      </div>
    `).run();
  }, [editor]);

  const insertGuaranteeBanner = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div data-callout="success" style="border-radius:12px;padding:1.25rem;margin:1.5rem 0;background:#f0fdf4;border-left:4px solid #22c55e">
        <h4 style="margin:0 0 0.25rem;font-weight:700;color:#166534">🔒 100% Working Guarantee & Buyer Protection</h4>
        <p style="margin:0;font-size:0.875rem;color:#15803d">Every product is verified prior to dispatch. If you experience any technical defect or delivery issue, our dedicated team will resolve it or provide an immediate replacement.</p>
      </div>
    `).run();
  }, [editor]);

  const handleApplyTemplate = useCallback((html: string, replace: boolean) => {
    if (!editor) return;
    if (replace) {
      editor.chain().focus().setContent(html).run();
    } else {
      editor.chain().focus().insertContent(html).run();
    }
    if (hiddenRef.current) hiddenRef.current.value = editor.getHTML();
  }, [editor]);

  if (!editor) return null;

  const wrapClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-white"
    : "border rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all";

  return (
    <>
      {/* Hidden input that FormData picks up */}
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue} />

      <div className={wrapClass}>
        {/* ─ Toolbar ─ */}
        <div className={`flex flex-wrap items-center gap-1 p-2 border-b bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 ${isFullscreen ? "border-b-2" : ""}`}>

          {/* Headings / Format */}
          <DropMenu label="Format" icon={<Type className="w-4 h-4" />}>
            <MenuItem onClick={() => editor.chain().focus().setParagraph().run()} icon={<Pilcrow className="w-4 h-4" />} label="Paragraph" />
            {([1,2,3,4,5,6] as const).map(l => (
              <MenuItem key={l} onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()}
                icon={<span className="font-bold text-xs">H{l}</span>} label={`Heading ${l}`}
                shortcut={`Ctrl+Alt+${l}`} />
            ))}
            <div className="border-t border-slate-100 my-1" />
            <MenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={<Quote className="w-4 h-4" />} label="Blockquote" />
            <MenuItem onClick={() => editor.chain().focus().toggleCode().run()} icon={<Code className="w-4 h-4" />} label="Inline Code" />
            <MenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={<Code2 className="w-4 h-4" />} label="Code Block" />
          </DropMenu>

          <Divider />

          {/* Core formatting */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
            <Bold className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
            <Italic className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
            <Underline className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} title="Subscript">
            <SubIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} title="Superscript">
            <SupIcon className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Colors */}
          <DropMenu label="Color" icon={<Palette className="w-4 h-4" />}>
            <div className="px-3 pt-2 pb-1">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Text Color</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {["#1e293b","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#14b8a6"].map(c => (
                  <button key={c} type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().setColor(c).run(); }}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ background: c }} title={c} />
                ))}
              </div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Highlight</p>
              <div className="flex flex-wrap gap-1.5">
                {["#fef08a","#bbf7d0","#bfdbfe","#f5d0fe","#fecdd3","#fed7aa"].map(c => (
                  <button key={c} type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c }).run(); }}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                    style={{ background: c }} title={c} />
                ))}
              </div>
              <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetColor().unsetHighlight().run(); }}
                className="mt-2 text-xs text-slate-500 hover:text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear color
              </button>
            </div>
          </DropMenu>

          <Divider />

          {/* Lists */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Task List">
            <ListChecks className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Alignment */}
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
            <AlignJustify className="w-4 h-4" />
          </ToolbarBtn>

          <Divider />

          {/* Media */}
          <ToolbarBtn onClick={() => setShowImage(true)} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setShowVideo(true)} title="Embed Video">
            <Video className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => setShowLink(true)} active={editor.isActive("link")} title="Insert Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarBtn>
          {editor.isActive("link") && (
            <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
              <X className="w-3.5 h-3.5" />
            </ToolbarBtn>
          )}

          <Divider />

          {/* Table */}
          <DropMenu label="Table" icon={<TableIcon className="w-4 h-4" />}>
            <MenuItem onClick={() => setShowTable(true)} icon={<Plus className="w-4 h-4" />} label="Insert Table" />
            {editor.isActive("table") && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <MenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} label="Add Column Before" />
                <MenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} label="Add Column After" />
                <MenuItem onClick={() => editor.chain().focus().deleteColumn().run()} label="Delete Column" />
                <div className="border-t border-slate-100 my-1" />
                <MenuItem onClick={() => editor.chain().focus().addRowBefore().run()} label="Add Row Before" />
                <MenuItem onClick={() => editor.chain().focus().addRowAfter().run()} label="Add Row After" />
                <MenuItem onClick={() => editor.chain().focus().deleteRow().run()} label="Delete Row" />
                <div className="border-t border-slate-100 my-1" />
                <MenuItem onClick={() => editor.chain().focus().mergeCells().run()} label="Merge Cells" />
                <MenuItem onClick={() => editor.chain().focus().splitCell().run()} label="Split Cell" />
                <div className="border-t border-slate-100 my-1" />
                <MenuItem onClick={() => editor.chain().focus().deleteTable().run()} icon={<Trash2 className="w-4 h-4 text-red-500" />} label="Delete Table" />
              </>
            )}
          </DropMenu>

          {/* Insert Blocks */}
          <DropMenu label="Insert" icon={<LayoutGrid className="w-4 h-4" />}>
            <MenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus className="w-4 h-4" />} label="Divider" />
            <div className="border-t border-slate-100 my-1" />
            <p className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">Callouts</p>
            {(["info","success","warning","tip","error"] as CalloutType[]).map(t => (
              <MenuItem key={t} onClick={() => insertCallout(t)} icon={CALLOUT_STYLES[t].icon} label={`${CALLOUT_STYLES[t].label} Box`} />
            ))}
            <div className="border-t border-slate-100 my-1" />
            <p className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">Layout Blocks</p>
            <MenuItem onClick={insertTwoCol} icon={<Columns className="w-4 h-4" />} label="Two Columns" />
            <MenuItem onClick={insertFeatureGrid} icon={<Grid3X3 className="w-4 h-4" />} label="Feature Cards (3-col)" />
            <MenuItem onClick={insertProsConsList} icon={<Check className="w-4 h-4" />} label="Pros & Cons" />
            <MenuItem onClick={insertSteps} icon={<ListOrdered className="w-4 h-4" />} label="Numbered Steps" />
            <MenuItem onClick={insertFaqAccordion} icon={<HelpCircle className="w-4 h-4" />} label="FAQ Accordion" />
            <MenuItem onClick={insertStatCards} icon={<Zap className="w-4 h-4" />} label="Key Stats Row" />
            <MenuItem onClick={insertGuaranteeBanner} icon={<ShieldCheck className="w-4 h-4" />} label="Guarantee Banner" />
          </DropMenu>

          {/* Templates Quick Button */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setShowTemplates(true); }}
            title="Browse pre-designed e-commerce product templates"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary to-indigo-600 text-white font-medium text-xs shadow-sm hover:opacity-90 transition-all select-none ml-0.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <Divider />

          {/* Undo/Redo */}
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
            <Redo className="w-4 h-4" />
          </ToolbarBtn>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Preview Button */}
          <ToolbarBtn onClick={() => setShowPreview(true)} title="Live Storefront Preview (Desktop & Mobile)">
            <Eye className="w-4 h-4 text-primary" />
          </ToolbarBtn>

          {/* HTML source */}
          <ToolbarBtn onClick={() => setShowHtml(true)} title="Edit HTML Source">
            <HtmlIcon className="w-4 h-4" />
          </ToolbarBtn>

          {/* Fullscreen */}
          <ToolbarBtn onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </ToolbarBtn>
        </div>

        {/* ─ Bubble Menu (inline toolbar on selection) ─ */}
        <BubbleMenu editor={editor}
          className="flex items-center gap-0.5 bg-slate-900 text-white rounded-lg shadow-xl p-1 border border-slate-700">
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
            className={`p-1.5 rounded text-xs transition-colors ${editor.isActive("bold") ? "bg-white/20" : "hover:bg-white/10"}`} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
            className={`p-1.5 rounded text-xs transition-colors ${editor.isActive("italic") ? "bg-white/20" : "hover:bg-white/10"}`} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleUnderline().run(); }}
            className={`p-1.5 rounded text-xs transition-colors ${editor.isActive("underline") ? "bg-white/20" : "hover:bg-white/10"}`} title="Underline"><Underline className="w-3.5 h-3.5" /></button>
          <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleStrike().run(); }}
            className={`p-1.5 rounded text-xs transition-colors ${editor.isActive("strike") ? "bg-white/20" : "hover:bg-white/10"}`} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-white/20 mx-0.5" />
          <button type="button" onMouseDown={e => { e.preventDefault(); setShowLink(true); }}
            className={`p-1.5 rounded text-xs transition-colors ${editor.isActive("link") ? "bg-white/20" : "hover:bg-white/10"}`} title="Link"><LinkIcon className="w-3.5 h-3.5" /></button>
          {editor.isActive("link") && (
            <button type="button" onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetLink().run(); }}
              className="p-1.5 rounded text-xs hover:bg-white/10" title="Remove Link"><X className="w-3.5 h-3.5" /></button>
          )}
        </BubbleMenu>

        {/* ─ Editor Content ─ */}
        <div className="flex-1 overflow-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>

        {/* ─ Status Bar ─ */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t bg-slate-50/80 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>{editor.storage.characterCount?.characters?.() ?? 0} chars · <strong>{wordCount}</strong> words</span>
            <span>⏱️ ~{Math.max(1, Math.round(wordCount / 180))} min read</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${
              wordCount >= 250 ? "bg-green-100 text-green-700" :
              wordCount >= 100 ? "bg-blue-100 text-blue-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {wordCount >= 250 ? "● Optimal for SEO" : wordCount >= 100 ? "● Good Length" : "● Short (Add details for SEO)"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Storefront
            </button>
            {editor.isActive("table") && <span className="text-primary font-medium">Table selected</span>}
            {editor.isActive("link") && <span className="text-blue-500 font-medium">Link active</span>}
          </div>
        </div>
      </div>

      {/* ─ Modals ─ */}
      {showImage && <ImageModal onInsert={insertImage} onClose={() => setShowImage(false)} />}
      {showVideo && <VideoModal onInsert={insertVideo} onClose={() => setShowVideo(false)} />}
      {showLink && <LinkModal currentUrl={editor.getAttributes("link").href} onInsert={insertLink} onClose={() => setShowLink(false)} />}
      {showHtml && <HtmlModal html={editor.getHTML()} onApply={html => { editor.chain().focus().setContent(html).run(); if (hiddenRef.current) hiddenRef.current.value = editor.getHTML(); }} onClose={() => setShowHtml(false)} />}
      {showTable && <TableModal onInsert={insertTable} onClose={() => setShowTable(false)} />}
      {showTemplates && <TemplatesModal onApply={handleApplyTemplate} onClose={() => setShowTemplates(false)} />}
      {showPreview && <PreviewModal html={editor.getHTML()} onClose={() => setShowPreview(false)} />}

      {/* Fullscreen backdrop click to close */}
      {isFullscreen && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <button type="button" onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full shadow-2xl text-sm font-medium hover:bg-slate-800 transition-colors">
            <Minimize2 className="w-4 h-4" /> Exit Fullscreen
          </button>
        </div>
      )}
    </>
  );
}
