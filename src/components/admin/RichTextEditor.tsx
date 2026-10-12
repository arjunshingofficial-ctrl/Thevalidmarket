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
  PanelTop, Image as ImgIcon
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
          </DropMenu>

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
        <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50/80 text-xs text-slate-400">
          <span>{editor.storage.characterCount?.characters?.() ?? 0} chars · {wordCount} words</span>
          <div className="flex items-center gap-3">
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
