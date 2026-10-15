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
import { Extension, Node as TipTapNode, Mark, mergeAttributes } from "@tiptap/core";

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
  HelpCircle, ShieldCheck, Zap, MousePointerClick, ExternalLink
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

// ─── Custom Action Button Node ────────────────────────────────────────────────
const ActionButton = TipTapNode.create({
  name: "actionButton",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      text: { default: "🚀 Buy Now" },
      url: { default: "#" },
      style: { default: "indigo" }, // indigo | carbon | emerald | gold | neon | outline
      size: { default: "md" }, // sm | md | lg
      align: { default: "center" }, // left | center | right | full
      newTab: { default: true },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-action-button]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLElement;
          const a = el.querySelector("a");
          let style = el.getAttribute("data-style") || "indigo";
          let size = el.getAttribute("data-size") || "md";
          let align = el.getAttribute("data-align") || "center";
          const text = a?.textContent?.trim() || el.textContent?.trim() || "Click Here";
          const url = a?.getAttribute("href") || "#";
          const newTab = a?.getAttribute("target") === "_blank";

          if (a?.className) {
            const mStyle = a.className.match(/btn-(indigo|carbon|emerald|gold|neon|outline)/);
            if (mStyle) style = mStyle[1];
            const mSize = a.className.match(/btn-(sm|md|lg)/);
            if (mSize) size = mSize[1];
          }

          return { text, url, style, size, align, newTab };
        },
      },
      {
        tag: "a.stylish-btn",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const a = element as HTMLElement;
          let style = "indigo";
          let size = "md";
          let align = "center";
          const text = a.textContent?.trim() || "Click Here";
          const url = a.getAttribute("href") || "#";
          const newTab = a.getAttribute("target") === "_blank";

          const mStyle = a.className?.match(/btn-(indigo|carbon|emerald|gold|neon|outline)/);
          if (mStyle) style = mStyle[1];
          const mSize = a.className?.match(/btn-(sm|md|lg)/);
          if (mSize) size = mSize[1];

          const parent = a.parentElement;
          if (parent) {
            const pAlign = parent.getAttribute("data-align") || (parent.className.includes("text-left") ? "left" : parent.className.includes("text-right") ? "right" : "center");
            if (pAlign) align = pAlign;
          }

          return { text, url, style, size, align, newTab };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const align = HTMLAttributes.align || "center";
    const style = HTMLAttributes.style || "indigo";
    const size = HTMLAttributes.size || "md";
    const text = HTMLAttributes.text || "Click Here";
    const url = HTMLAttributes.url || "#";
    const newTab = HTMLAttributes.newTab !== false;

    return [
      "div",
      mergeAttributes({ "data-action-button": "" }, {
        "data-style": style,
        "data-size": size,
        "data-align": align,
        class: `btn-container text-${align === "full" ? "center" : align}`,
        style: `text-align: ${align === "full" ? "center" : align}; margin: 1.5rem 0; width: 100%;`
      }),
      [
        "a",
        {
          href: url,
          class: `stylish-btn btn-${style} btn-${size} ${align === "full" ? "btn-full" : ""}`,
          target: newTab ? "_blank" : "_self",
          rel: "noopener noreferrer",
        },
        text
      ]
    ];
  },
  addNodeView() {
    return ({ node, getPos }) => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("data-action-button", "");
      wrapper.setAttribute("data-style", node.attrs.style || "indigo");
      wrapper.setAttribute("data-size", node.attrs.size || "md");
      wrapper.setAttribute("data-align", node.attrs.align || "center");
      wrapper.setAttribute("contenteditable", "false");
      const align = node.attrs.align || "center";
      wrapper.style.cssText = `text-align: ${align === "full" ? "center" : align}; margin: 1.5rem 0; width: 100%; position: relative; user-select: none;`;
      wrapper.className = "action-button-editor-wrap group";

      const inner = document.createElement("div");
      inner.style.cssText = "display: inline-block; position: relative; max-width: 100%; cursor: pointer;";

      const btn = document.createElement("a");
      btn.href = "#";
      btn.className = `stylish-btn btn-${node.attrs.style || "indigo"} btn-${node.attrs.size || "md"} ${align === "full" ? "btn-full" : ""}`;
      btn.textContent = node.attrs.text || "Click Here";
      btn.title = `Link: ${node.attrs.url || "#"} (Click to edit text & link)`;

      const triggerEdit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === "function" ? getPos() : null;
        window.dispatchEvent(new CustomEvent("edit-action-button", {
          detail: { pos, attrs: { ...node.attrs } }
        }));
      };

      btn.addEventListener("click", triggerEdit);

      // Floating hover toolbar
      const bar = document.createElement("div");
      bar.className = "action-btn-hover-bar";
      bar.innerHTML = `
        <button type="button" class="action-btn-edit-trigger" title="Edit text, link, and style">✏️ Edit Button</button>
        <span class="action-btn-url-preview">${node.attrs.url && node.attrs.url !== "#" ? node.attrs.url : "No Link"}</span>
        <button type="button" class="action-btn-del-trigger" title="Delete button">✕</button>
      `;

      const editBtn = bar.querySelector(".action-btn-edit-trigger");
      editBtn?.addEventListener("click", triggerEdit);

      const delBtn = bar.querySelector(".action-btn-del-trigger");
      delBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === "function" ? getPos() : null;
        window.dispatchEvent(new CustomEvent("delete-action-button", { detail: { pos } }));
      });

      inner.appendChild(btn);
      inner.appendChild(bar);
      wrapper.appendChild(inner);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "actionButton") return false;
          node = updatedNode;
          const uAlign = node.attrs.align || "center";
          wrapper.setAttribute("data-style", node.attrs.style || "indigo");
          wrapper.setAttribute("data-size", node.attrs.size || "md");
          wrapper.setAttribute("data-align", uAlign);
          wrapper.style.textAlign = uAlign === "full" ? "center" : uAlign;
          btn.className = `stylish-btn btn-${node.attrs.style || "indigo"} btn-${node.attrs.size || "md"} ${uAlign === "full" ? "btn-full" : ""}`;
          btn.textContent = node.attrs.text || "Click Here";
          btn.title = `Link: ${node.attrs.url || "#"} (Click to edit text & link)`;
          const urlPreview = bar.querySelector(".action-btn-url-preview");
          if (urlPreview) {
            urlPreview.textContent = node.attrs.url && node.attrs.url !== "#" ? node.attrs.url : "No Link";
          }
          return true;
        }
      };
    };
  },
});

// ─── Custom Table Cell & Header (Preserves Highlight & Styling Classes) ──────
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: element => element.getAttribute("class"),
        renderHTML: attributes => (attributes.class ? { class: attributes.class } : {}),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style"),
        renderHTML: attributes => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: element => element.getAttribute("class"),
        renderHTML: attributes => (attributes.class ? { class: attributes.class } : {}),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style"),
        renderHTML: attributes => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },
});

// ─── Custom Span Mark (Preserves Status Badges & Pill Classes) ────────────────
const CustomSpan = Mark.create({
  name: "customSpan",
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: element => element.getAttribute("class"),
        renderHTML: attributes => (attributes.class ? { class: attributes.class } : {}),
      },
      style: {
        default: null,
        parseHTML: element => element.getAttribute("style"),
        renderHTML: attributes => (attributes.style ? { style: attributes.style } : {}),
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: element => {
          if (typeof element === "string") return false;
          return element.hasAttribute("class") || element.hasAttribute("style") ? {} : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

// ─── Custom Details & Summary (FAQ Accordions) ────────────────────────────────
const Details = TipTapNode.create({
  name: "details",
  group: "block",
  content: "summary block+",
  defining: true,
  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: element => element.hasAttribute("open"),
        renderHTML: attributes => (attributes.open ? { open: "" } : {}),
      },
    };
  },
  parseHTML() { return [{ tag: "details" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes), 0];
  },
});

const Summary = TipTapNode.create({
  name: "summary",
  group: "block",
  content: "inline*",
  defining: true,
  parseHTML() { return [{ tag: "summary" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0];
  },
});

// ─── Custom Visual Grid & Card Nodes ──────────────────────────────────────────
const VisualGrid = TipTapNode.create({
  name: "visualGrid",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  addAttributes() {
    return {
      cols: { default: "3" },
    };
  },
  parseHTML() {
    return [
      { tag: "div[data-visual-grid]" },
      {
        tag: "div",
        getAttrs: element => {
          if (typeof element === "string") return false;
          const el = element as HTMLElement;
          if (el.className?.includes("visual-grid") || (el.style.display === "grid" && el.querySelector(".stat-card, [data-visual-card]"))) {
            return {};
          }
          return false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-visual-grid": "" }, HTMLAttributes), 0];
  },
});

const VisualCard = TipTapNode.create({
  name: "visualCard",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  parseHTML() {
    return [
      { tag: "div[data-visual-card]" },
      { tag: "div.stat-card", getAttrs: () => ({}) },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-visual-card": "" }, HTMLAttributes), 0];
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  value?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
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

function DropMenu({ label, icon, children, badge }: { label: string; icon: React.ReactNode; children: React.ReactNode; badge?: React.ReactNode }) {
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200/80 bg-white transition-colors select-none shadow-xs"
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
        {badge}
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
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

function MenuItem({ onClick, icon, label, shortcut, active }: { onClick: () => void; icon?: React.ReactNode; label: string; shortcut?: string; active?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
        active ? "bg-primary/10 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon && <span className={active ? "text-primary shrink-0" : "text-slate-400 shrink-0"}>{icon}</span>}
      <span className="flex-1">{label}</span>
      {active && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
      {shortcut && !active && <span className="text-xs text-slate-400 font-mono">{shortcut}</span>}
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
    id: "subscription",
    title: "Subscription, Account & VPN",
    icon: "🔑",
    description: "Visual stat cards, plan comparison table, rules table, FAQs, and stylish CTA buttons.",
    html: `<h2>⭐ Premium Subscription Details</h2>
<p>Unlock uninterrupted premium access with our verified subscription accounts. Enjoy high-speed performance, 4K streaming quality, and maximum privacy.</p>

<div data-visual-grid="">
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">⚡</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#6366f1;margin:0 0 0.25rem">Instant Delivery</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Automated credentials dispatch in &lt;60s</p>
  </div>
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">🔒</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#10b981;margin:0 0 0.25rem">100% Private</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Genuine personal uninterrupted account</p>
  </div>
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">🛡️</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#f59e0b;margin:0 0 0.25rem">24/7 Warranty</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Instant replacement support anytime</p>
  </div>
</div>

<div data-action-button="" data-style="indigo" data-size="lg" data-align="center">
  <a href="#" class="stylish-btn btn-indigo btn-lg">⚡ Get Instant Subscription Access</a>
</div>

<h2>📊 Subscription Plans &amp; Features Comparison</h2>
<table>
  <thead>
    <tr>
      <th>Feature &amp; Benefit</th>
      <th>Standard Tier</th>
      <th class="highlight">⭐ Premium VIP Tier</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Streaming &amp; Connection Quality</td>
      <td>Full HD 1080p</td>
      <td class="highlight"><span class="badge-speed">⚡ Ultra 4K HDR + Dolby</span></td>
    </tr>
    <tr>
      <td>Simultaneous Device Screens</td>
      <td>1 Device</td>
      <td class="highlight"><span class="badge-vip">⭐ Up to 4 Screens</span></td>
    </tr>
    <tr>
      <td>Ad-Free Experience</td>
      <td><span class="badge-check">✅ Included</span></td>
      <td class="highlight"><span class="badge-check">✅ 100% Zero Ads</span></td>
    </tr>
    <tr>
      <td>Offline Downloads</td>
      <td>Limited (5 items)</td>
      <td class="highlight"><span class="badge-vip">⭐ Unlimited Offline</span></td>
    </tr>
    <tr>
      <td>Replacement Warranty</td>
      <td>Standard 30 Days</td>
      <td class="highlight"><span class="badge-check">✅ Full Period Guaranteed</span></td>
    </tr>
  </tbody>
</table>

<h2>📌 Usage Guidelines &amp; Account Rules</h2>
<table>
  <thead>
    <tr>
      <th>Allowed Guidelines ✅</th>
      <th>Prohibited Actions ❌</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="badge-check">✅</span> Login on allowed device count</td>
      <td><span class="badge-cross">❌</span> Do NOT change account email or profile password</td>
    </tr>
    <tr>
      <td><span class="badge-check">✅</span> Download content for personal offline viewing</td>
      <td><span class="badge-cross">❌</span> Do NOT share login credentials publicly</td>
    </tr>
    <tr>
      <td><span class="badge-check">✅</span> Enjoy all premium library titles without restriction</td>
      <td><span class="badge-cross">❌</span> Do NOT add extra unauthorized payment methods</td>
    </tr>
  </tbody>
</table>

<div data-action-button="" data-style="emerald" data-size="md" data-align="center">
  <a href="#" class="stylish-btn btn-emerald btn-md">💬 24/7 WhatsApp &amp; Telegram Support</a>
</div>

<h2>❓ Frequently Asked Questions</h2>
<details open="">
  <summary>How fast will I receive my account credentials?</summary>
  <p>Delivery is 100% automated. Your login credentials and instructions will appear immediately on the order confirmation screen and in your email within 60 seconds of checkout.</p>
</details>
<details>
  <summary>What should I do if my account ever experiences an issue?</summary>
  <p>You are fully covered by our comprehensive replacement guarantee. Simply message our 24/7 priority live support with your order number for an immediate replacement.</p>
</details>`
  },
  {
    id: "software",
    title: "Software & Digital Tools",
    icon: "💻",
    description: "Overview, visual feature cards, specifications table, setup guide, and action buttons.",
    html: `<h2>🚀 Overview &amp; Core Highlights</h2>
<p>Get instant access to this high-performance software designed to streamline your workflow and deliver unmatched reliability.</p>

<div data-visual-grid="">
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">⚡</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#6366f1;margin:0 0 0.25rem">High Performance</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Engineered for speed, low CPU usage, and high throughput.</p>
  </div>
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">🛡️</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#10b981;margin:0 0 0.25rem">100% Clean &amp; Safe</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">VirusTotal checked and tested prior to immediate dispatch.</p>
  </div>
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">🔄</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#f59e0b;margin:0 0 0.25rem">Continuous Updates</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Receive all new builds and patches through your client dashboard.</p>
  </div>
</div>

<div data-action-button="" data-style="carbon" data-size="lg" data-align="center">
  <a href="#" class="stylish-btn btn-carbon btn-lg">🚀 Download Software &amp; Get Activation Key</a>
</div>

<h2>📋 System Requirements &amp; Compatibility</h2>
<table>
  <thead>
    <tr>
      <th>Specification Parameter</th>
      <th>Minimum Requirement</th>
      <th class="highlight">⭐ Recommended Setup</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Operating System</td>
      <td>Windows 10 / macOS 11+</td>
      <td class="highlight"><span class="badge-vip">Windows 11 / macOS 14+</span></td>
    </tr>
    <tr>
      <td>Memory (RAM)</td>
      <td>4 GB</td>
      <td class="highlight"><span class="badge-speed">8 GB or higher</span></td>
    </tr>
    <tr>
      <td>Internet Connection</td>
      <td>Required for activation</td>
      <td class="highlight"><span class="badge-check">Stable Broadband</span></td>
    </tr>
    <tr>
      <td>License Validity</td>
      <td>Single Machine Key</td>
      <td class="highlight"><span class="badge-gold">⭐ Lifetime Key + Free Updates</span></td>
    </tr>
  </tbody>
</table>

<h2>🛠️ Quick 3-Step Setup Guide</h2>
<ol style="padding-left:1.5rem;line-height:2">
  <li><strong>Download the Installer:</strong> Click your secure order link to grab the latest official installer.</li>
  <li><strong>Launch &amp; Enter Key:</strong> Open the setup wizard and paste your genuine The Valid Market license key.</li>
  <li><strong>Ready to Use:</strong> Enjoy all pro features fully unlocked with 100% working guarantee.</li>
</ol>

<h2>❓ Frequently Asked Questions</h2>
<details open="">
  <summary>How fast will I receive the license key?</summary>
  <p>Delivery is fully automated. You will receive your license key and download link instantly after checkout.</p>
</details>
<details>
  <summary>Can I transfer my license to a new PC?</summary>
  <p>Yes, your license can be deactivated and transferred to another computer anytime via customer support.</p>
</details>

<div data-callout="success">
  <p style="margin:0;font-weight:700;color:#166534">🔒 100% Working Guarantee</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#15803d">If your key fails to activate or you experience any technical difficulties, our 24/7 team will replace it immediately.</p>
</div>`
  },
  {
    id: "course",
    title: "Video Course & Masterclass",
    icon: "🎓",
    description: "Curriculum breakdown table, learning outcomes, guarantee box, and enroll button.",
    html: `<h2>🎯 Masterclass Overview</h2>
<p>Transform your expertise with this step-by-step masterclass packed with actionable insights, real-world projects, and downloadable resources.</p>

<div data-visual-grid="">
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">⏱️</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#6366f1;margin:0 0 0.25rem">12+ Hours Content</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Comprehensive modules with high-def video</p>
  </div>
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">📁</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#10b981;margin:0 0 0.25rem">Project Files</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Downloadable templates &amp; cheatsheets</p>
  </div>
  <div data-visual-card="">
    <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">🎓</p>
    <h3 style="font-size:1.15rem;font-weight:800;color:#f59e0b;margin:0 0 0.25rem">Lifetime Access</h3>
    <p style="font-size:0.875rem;color:#64748b;margin:0">Watch anytime on desktop, tablet, or phone</p>
  </div>
</div>

<div data-action-button="" data-style="indigo" data-size="lg" data-align="center">
  <a href="#" class="stylish-btn btn-indigo btn-lg">🎓 Enroll Now &amp; Get Lifetime Access</a>
</div>

<h2>📚 Course Syllabus &amp; Modules</h2>
<table>
  <thead>
    <tr>
      <th>Module</th>
      <th>Key Topics Covered</th>
      <th>Format</th>
      <th>Access</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Module 1: Foundations</td>
      <td>Setup, key terminology, and essential tools</td>
      <td><span class="badge-vip">Video + PDF</span></td>
      <td><span class="badge-check">✅ Unlocked</span></td>
    </tr>
    <tr>
      <td>Module 2: Practical Execution</td>
      <td>Step-by-step live demonstrations and real projects</td>
      <td><span class="badge-speed">Interactive Video</span></td>
      <td><span class="badge-check">✅ Unlocked</span></td>
    </tr>
    <tr>
      <td>Module 3: Advanced Scaling</td>
      <td>Automation workflows, optimization, and insider secrets</td>
      <td><span class="badge-gold">Video + Source Code</span></td>
      <td><span class="badge-check">✅ Unlocked</span></td>
    </tr>
  </tbody>
</table>

<div data-callout="info">
  <p style="margin:0;font-weight:700;color:#1e40af">🎓 Lifetime Access &amp; Continuous Curriculum Updates</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#1d4ed8">Enroll once and access anytime. All future curriculum updates, new modules, and bonus materials are included automatically.</p>
</div>`
  },
  {
    id: "gaming",
    title: "Game Keys & Gift Cards",
    icon: "🎮",
    description: "Region compatibility notice, platform specs table, redemption steps, and CTA button.",
    html: `<h2>🎮 Product Overview</h2>
<p>Purchase genuine, region-verified digital activation codes with zero wait time. Codes are sourced directly from authorized channels.</p>

<div data-callout="warning">
  <p style="margin:0;font-weight:700;color:#b45309">⚠️ Region Compatibility Notice</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#92400e">Please ensure your account country matches before redemption. Digital keys once delivered cannot be returned if purchased for an incompatible region.</p>
</div>

<div data-action-button="" data-style="gold" data-size="lg" data-align="center">
  <a href="#" class="stylish-btn btn-gold btn-lg">🎮 Redeem Digital Code Now</a>
</div>

<h2>📋 Platform Compatibility &amp; Requirements</h2>
<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Platform Requirement</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Platform</td>
      <td>Steam / Epic Games / PlayStation / Xbox</td>
      <td><span class="badge-check">✅ Verified</span></td>
    </tr>
    <tr>
      <td>Region Lock</td>
      <td>Worldwide / Global</td>
      <td><span class="badge-gold">🌍 Global</span></td>
    </tr>
    <tr>
      <td>Delivery Format</td>
      <td>16-Digit Genuine Activation Code</td>
      <td><span class="badge-speed">⚡ Automated Instant</span></td>
    </tr>
  </tbody>
</table>

<h2>🚀 Step-by-Step Activation Instructions</h2>
<ol style="padding-left:1.5rem;line-height:2">
  <li>Log in to your platform account (Steam, Epic Games, PlayStation, Xbox, etc.).</li>
  <li>Navigate to <strong>Activate a Product Code</strong> or <strong>Redeem Code</strong>.</li>
  <li>Enter your unique code received from The Valid Market.</li>
  <li>Confirm activation and start downloading your game immediately!</li>
</ol>

<div data-callout="success">
  <p style="margin:0;font-weight:700;color:#166534">✅ 100% Genuine Working Key Guarantee</p>
  <p style="margin:0.25rem 0 0;font-size:0.875rem;color:#15803d">Every code is verified unused before delivery. Instant automated delivery guaranteed 24 hours a day.</p>
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

// ─── Stylish Button Modal ───────────────────────────────────────────────────
interface ButtonModalProps {
  initialData?: {
    text: string;
    url: string;
    style: "indigo" | "carbon" | "emerald" | "gold" | "neon" | "outline";
    size: "sm" | "md" | "lg";
    align: "left" | "center" | "right" | "full";
    newTab: boolean;
  } | null;
  onInsert: (data: {
    text: string;
    url: string;
    style: "indigo" | "carbon" | "emerald" | "gold" | "neon" | "outline";
    size: "sm" | "md" | "lg";
    align: "left" | "center" | "right" | "full";
    newTab: boolean;
  }) => void;
  onClose: () => void;
}

function ButtonModal({ initialData, onInsert, onClose }: ButtonModalProps) {
  const [text, setText] = useState(initialData?.text || "🚀 Get Instant Access");
  const [url, setUrl] = useState(initialData?.url || "#");
  const [style, setStyle] = useState<"indigo" | "carbon" | "emerald" | "gold" | "neon" | "outline">(initialData?.style || "indigo");
  const [size, setSize] = useState<"sm" | "md" | "lg">(initialData?.size || "md");
  const [align, setAlign] = useState<"left" | "center" | "right" | "full">(initialData?.align || "center");
  const [newTab, setNewTab] = useState(initialData?.newTab !== false);

  const PRESETS = [
    { label: "🚀 Buy Now", text: "🚀 Buy Now" },
    { label: "⚡ Instant Access", text: "⚡ Get Instant Access" },
    { label: "💬 WhatsApp Support", text: "💬 24/7 WhatsApp Support" },
    { label: "📥 Download Setup", text: "📥 Download Installer & Guide" },
    { label: "🔑 Claim Key", text: "🔑 Claim Genuine License Key" },
    { label: "⭐ View Demo", text: "⭐ Watch Live Demo" },
  ];

  const STYLES: { id: "indigo" | "carbon" | "emerald" | "gold" | "neon" | "outline"; name: string; desc: string; previewClass: string }[] = [
    { id: "indigo", name: "Royal Indigo", desc: "Purple/Indigo glow", previewClass: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white" },
    { id: "carbon", name: "Midnight Carbon", desc: "Obsidian dark", previewClass: "bg-slate-900 text-white border border-slate-700" },
    { id: "emerald", name: "Emerald Verified", desc: "Trust green gradient", previewClass: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white" },
    { id: "gold", name: "Cyber Gold", desc: "Luxury amber gold", previewClass: "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold" },
    { id: "neon", name: "Neon Violet", desc: "Electric pink/violet", previewClass: "bg-gradient-to-r from-pink-500 to-purple-600 text-white" },
    { id: "outline", name: "Frosted Outline", desc: "Clean dark outline", previewClass: "bg-white text-slate-900 border-2 border-slate-900" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <MousePointerClick className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? "Edit Stylish Action Button" : "Insert Stylish Action Button (CTA)"}
              </h3>
              <p className="text-xs text-slate-500">
                {initialData ? "Update button label, target destination URL, style theme, and alignment." : "Design high-converting buttons for checkout, downloads, and chat."}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Live Button Preview Box */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Live Button Preview</label>
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center min-h-[90px]">
              <div className={`w-full flex ${align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center"}`}>
                <span className={`stylish-btn btn-${style} btn-${size} ${align === "full" ? "btn-full" : ""}`}>
                  {text || "Button Label"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Quick Presets</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setText(p.text)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium border border-slate-200/80"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Label & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Button Label *</label>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. 🚀 Buy Now"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Target Link / URL *</label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="e.g. #checkout or https://wa.me/..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Style Themes */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">Style Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    style === s.id
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className={`w-full py-1.5 px-2 rounded-lg text-xs text-center font-bold mb-1.5 ${s.previewClass}`}>
                    Demo
                  </div>
                  <div className="text-xs font-bold text-slate-800">{s.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Size & Alignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Button Size</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "sm", label: "Small" },
                  { id: "md", label: "Medium" },
                  { id: "lg", label: "Large" },
                ].map(sz => (
                  <button
                    key={sz.id}
                    type="button"
                    onClick={() => setSize(sz.id as any)}
                    className={`py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      size === sz.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1">Alignment</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "left", label: "Left" },
                  { id: "center", label: "Center" },
                  { id: "right", label: "Right" },
                  { id: "full", label: "Full" },
                ].map(al => (
                  <button
                    key={al.id}
                    type="button"
                    onClick={() => setAlign(al.id as any)}
                    className={`py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      align === al.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {al.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* New Tab */}
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={newTab}
              onChange={e => setNewTab(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span>Open in new tab (recommended for external links)</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-slate-50">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={!text}
            onClick={() => {
              onInsert({ text, url: url || "#", style, size, align, newTab });
              onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-all shadow-sm disabled:opacity-50"
          >
            <MousePointerClick className="w-4 h-4" /> {initialData ? "Save Button Changes" : "Insert Stylish Button"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RichTextEditor({ name, defaultValue = "", value, placeholder, onChange }: RichTextEditorProps) {
  const [showImage, setShowImage] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showButtonModal, setShowButtonModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [editingButton, setEditingButton] = useState<{
    pos: number | null;
    attrs: {
      text: string;
      url: string;
      style: "indigo" | "carbon" | "emerald" | "gold" | "neon" | "outline";
      size: "sm" | "md" | "lg";
      align: "left" | "center" | "right" | "full";
      newTab: boolean;
    };
  } | null>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const currentExternalValue = value !== undefined ? value : defaultValue;

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
      CustomTableHeader,
      CustomTableCell,
      CustomSpan,
      TaskList,
      TaskItem.configure({ nested: true }),
      Subscript,
      Superscript,
      CharacterCount,
      VideoEmbed,
      Callout,
      Details,
      Summary,
      ActionButton,
      VisualGrid,
      VisualCard,
    ],
    content: currentExternalValue || "",
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
      onChange?.(html);
    },
  });

  // Sync hidden input on mount
  useEffect(() => {
    if (editor && hiddenRef.current) {
      hiddenRef.current.value = editor.getHTML();
    }
  }, [editor]);

  // Keep editor in sync when content is updated via 1-click SEO fixes
  useEffect(() => {
    if (editor && currentExternalValue !== undefined) {
      if (editor.getHTML() !== currentExternalValue) {
        editor.commands.setContent(currentExternalValue);
        if (hiddenRef.current) hiddenRef.current.value = currentExternalValue;
      }
    }
  }, [currentExternalValue, editor]);

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

  const insertActionButton = useCallback((data: {
    text: string;
    url: string;
    style: "indigo" | "carbon" | "emerald" | "gold" | "neon" | "outline";
    size: "sm" | "md" | "lg";
    align: "left" | "center" | "right" | "full";
    newTab: boolean;
  }) => {
    editor?.chain().focus().insertContent({
      type: "actionButton",
      attrs: data,
    }).run();
  }, [editor]);

  useEffect(() => {
    const handleEditBtn = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail) {
        setEditingButton({ pos: ce.detail.pos, attrs: ce.detail.attrs });
        setShowButtonModal(true);
      }
    };
    const handleDeleteBtn = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail && ce.detail.pos !== null && editor) {
        editor.commands.deleteRange({ from: ce.detail.pos, to: ce.detail.pos + 1 });
      }
    };
    window.addEventListener("edit-action-button", handleEditBtn);
    window.addEventListener("delete-action-button", handleDeleteBtn);
    return () => {
      window.removeEventListener("edit-action-button", handleEditBtn);
      window.removeEventListener("delete-action-button", handleDeleteBtn);
    };
  }, [editor]);

  const handleSaveActionButton = useCallback((data: {
    text: string;
    url: string;
    style: "indigo" | "carbon" | "emerald" | "gold" | "neon" | "outline";
    size: "sm" | "md" | "lg";
    align: "left" | "center" | "right" | "full";
    newTab: boolean;
  }) => {
    if (editingButton && editingButton.pos !== null && editor) {
      editor.chain().focus().setNodeSelection(editingButton.pos).updateAttributes("actionButton", data).run();
      setEditingButton(null);
    } else {
      insertActionButton(data);
    }
  }, [editingButton, editor, insertActionButton]);

  const insertComparisonTable = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <table>
        <thead>
          <tr>
            <th>Features &amp; Benefits</th>
            <th>Standard Plan</th>
            <th class="highlight">⭐ Premium VIP Tier</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Resolution &amp; Streaming</td>
            <td>Full HD 1080p</td>
            <td class="highlight"><span class="badge-speed">⚡ Ultra 4K HDR</span></td>
          </tr>
          <tr>
            <td>Simultaneous Devices</td>
            <td>1 Screen</td>
            <td class="highlight"><span class="badge-vip">⭐ Up to 4 Screens</span></td>
          </tr>
          <tr>
            <td>Ad-Free Experience</td>
            <td><span class="badge-check">✅ Included</span></td>
            <td class="highlight"><span class="badge-check">✅ 100% Zero Ads</span></td>
          </tr>
          <tr>
            <td>Offline Downloads</td>
            <td>Limited</td>
            <td class="highlight"><span class="badge-vip">⭐ Unlimited Offline</span></td>
          </tr>
          <tr>
            <td>Replacement Warranty</td>
            <td>Standard 30 Days</td>
            <td class="highlight"><span class="badge-check">✅ Full Period Guaranteed</span></td>
          </tr>
        </tbody>
      </table>
    `).run();
  }, [editor]);

  const insertSpecsTable = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <table>
        <thead>
          <tr>
            <th>Specification Parameter</th>
            <th>Minimum Requirement</th>
            <th class="highlight">⭐ Recommended Setup</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Operating System</td>
            <td>Windows 10 / macOS 11+</td>
            <td class="highlight"><span class="badge-vip">Windows 11 / macOS 14+</span></td>
          </tr>
          <tr>
            <td>Memory (RAM)</td>
            <td>4 GB</td>
            <td class="highlight"><span class="badge-speed">8 GB or higher</span></td>
          </tr>
          <tr>
            <td>Internet Connection</td>
            <td>Required for activation</td>
            <td class="highlight"><span class="badge-check">Stable Broadband</span></td>
          </tr>
          <tr>
            <td>License Validity</td>
            <td>Single Machine Key</td>
            <td class="highlight"><span class="badge-gold">⭐ Lifetime Key + Free Updates</span></td>
          </tr>
        </tbody>
      </table>
    `).run();
  }, [editor]);

  const insertPricingTable = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <table>
        <thead>
          <tr>
            <th>Plan Tier</th>
            <th>Duration</th>
            <th>Included Features</th>
            <th class="highlight">⭐ Pricing &amp; Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1 Month Plan</strong></td>
            <td>30 Days</td>
            <td>1 Device · Automated Instant dispatch</td>
            <td class="highlight">Standard Price</td>
          </tr>
          <tr>
            <td><strong>3 Months Plan</strong></td>
            <td>90 Days</td>
            <td>2 Devices · Priority live support</td>
            <td class="highlight"><span class="badge-speed">Save 20%</span></td>
          </tr>
          <tr>
            <td><strong>1 Year VIP Plan</strong></td>
            <td>365 Days</td>
            <td>4 Devices · VIP replacement warranty</td>
            <td class="highlight"><span class="badge-gold">⭐ Best Value · Save 50%</span></td>
          </tr>
        </tbody>
      </table>
    `).run();
  }, [editor]);

  const insertRulesTable = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <table>
        <thead>
          <tr>
            <th>Allowed Guidelines ✅</th>
            <th>Prohibited Actions ❌</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge-check">✅</span> Login on allowed device count</td>
            <td><span class="badge-cross">❌</span> Do NOT change account email or password</td>
          </tr>
          <tr>
            <td><span class="badge-check">✅</span> Download content for personal offline viewing</td>
            <td><span class="badge-cross">❌</span> Do NOT share login credentials publicly</td>
          </tr>
          <tr>
            <td><span class="badge-check">✅</span> Enjoy all premium library titles without restriction</td>
            <td><span class="badge-cross">❌</span> Do NOT add unauthorized payment methods</td>
          </tr>
        </tbody>
      </table>
    `).run();
  }, [editor]);

  const insertBadge = useCallback((badgeClass: string, label: string) => {
    editor?.chain().focus().insertContent(`<span class="${badgeClass}">${label}</span> `).run();
  }, [editor]);

  const toggleCellHighlight = useCallback(() => {
    if (!editor) return;
    const isHeader = editor.isActive("tableHeader");
    const isCell = editor.isActive("tableCell");
    if (!isHeader && !isCell) return;

    const currentClass = isHeader
      ? editor.getAttributes("tableHeader").class || ""
      : editor.getAttributes("tableCell").class || "";

    const hasHighlight = currentClass.includes("highlight");
    const nextClass = hasHighlight
      ? currentClass.replace(/\bhighlight\b/, "").trim() || null
      : `${currentClass} highlight`.trim();

    if (isHeader) {
      editor.chain().focus().updateAttributes("tableHeader", { class: nextClass }).run();
    } else {
      editor.chain().focus().updateAttributes("tableCell", { class: nextClass }).run();
    }
  }, [editor]);

  const insertStatCards = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div data-visual-grid="">
        <div data-visual-card="">
          <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">⚡</p>
          <h3 style="font-size:1.15rem;font-weight:800;color:#6366f1;margin:0 0 0.25rem">Instant Delivery</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Automated dispatch 24/7</p>
        </div>
        <div data-visual-card="">
          <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">🔒</p>
          <h3 style="font-size:1.15rem;font-weight:800;color:#10b981;margin:0 0 0.25rem">100% Guaranteed</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Genuine verified license</p>
        </div>
        <div data-visual-card="">
          <p style="font-size:2rem;margin:0 0 0.25rem;line-height:1">⭐</p>
          <h3 style="font-size:1.15rem;font-weight:800;color:#f59e0b;margin:0 0 0.25rem">5-Star Rated</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Top customer satisfaction</p>
        </div>
      </div>
    `).run();
  }, [editor]);

  const insertFeatureGrid = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div data-visual-grid="">
        <div data-visual-card="">
          <h3 style="font-size:1.1rem;font-weight:700;margin:0 0 0.5rem">🚀 High Performance</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Optimized for maximum speed, stability, and zero throttling.</p>
        </div>
        <div data-visual-card="">
          <h3 style="font-size:1.1rem;font-weight:700;margin:0 0 0.5rem">🛡️ Safe &amp; Secure</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Protected by standard encryption and private connection channels.</p>
        </div>
        <div data-visual-card="">
          <h3 style="font-size:1.1rem;font-weight:700;margin:0 0 0.5rem">💬 24/7 Support</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Direct access to our dedicated live support team anytime.</p>
        </div>
      </div>
    `).run();
  }, [editor]);

  const insertTwoCol = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <div data-visual-grid="" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))">
        <div data-visual-card="">
          <h3 style="font-size:1.1rem;font-weight:700;margin:0 0 0.5rem">Column 1: Key Advantage</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Add your first set of details, features, or product highlights here.</p>
        </div>
        <div data-visual-card="">
          <h3 style="font-size:1.1rem;font-weight:700;margin:0 0 0.5rem">Column 2: Value Proposition</h3>
          <p style="font-size:0.875rem;color:#64748b;margin:0">Add your second set of details, comparisons, or instructions here.</p>
        </div>
      </div>
    `).run();
  }, [editor]);

  const insertProsConsList = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <table>
        <thead>
          <tr>
            <th>Why You'll Love This ✅</th>
            <th>Things to Keep in Mind ⚠️</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge-check">✅</span> Genuine &amp; authentic product</td>
            <td><span class="badge-vip">ℹ️</span> Requires internet connection</td>
          </tr>
          <tr>
            <td><span class="badge-check">✅</span> Instant automated dispatch</td>
            <td><span class="badge-vip">ℹ️</span> Follow activation guide strictly</td>
          </tr>
          <tr>
            <td><span class="badge-check">✅</span> Dedicated 24/7 technical support</td>
            <td><span class="badge-cross">❌</span> Do not share license key publicly</td>
          </tr>
        </tbody>
      </table>
    `).run();
  }, [editor]);

  const insertSteps = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <ol style="padding-left:1.5rem;line-height:2">
        <li><strong>Step 1 — Purchase:</strong> Complete your order and receive instant credentials via email/dashboard.</li>
        <li><strong>Step 2 — Download &amp; Setup:</strong> Follow the included step-by-step installation instructions.</li>
        <li><strong>Step 3 — Activate &amp; Enjoy:</strong> Enter your unique key and unlock full premium benefits.</li>
      </ol>
    `).run();
  }, [editor]);

  const insertFaqAccordion = useCallback(() => {
    editor?.chain().focus().insertContent(`
      <details open="">
        <summary>How fast will I receive my order?</summary>
        <p>Delivery is 100% automated. You will receive your access details immediately upon payment confirmation.</p>
      </details>
      <details>
        <summary>What if I need help setting it up?</summary>
        <p>Our 24/7 support team is available via live chat and ticket system to assist you with installation anytime.</p>
      </details>
    `).run();
  }, [editor]);

  const insertGuaranteeBanner = useCallback(() => {
    editor?.chain().focus().insertContent({
      type: "callout",
      attrs: { type: "success" },
      content: [{
        type: "paragraph",
        content: [{ type: "text", text: "🔒 100% Working Guarantee: Every purchase includes full replacement protection and 24/7 dedicated support." }]
      }]
    }).run();
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

  // Dynamic format detector: accurately recognizes current node under cursor
  const currentFormat = (() => {
    if (!editor) return { label: "Paragraph (P)", short: "Paragraph", tag: "p", isHeading: false };
    if (editor.isActive("heading", { level: 1 })) return { label: "Heading 1 (H1)", short: "H1", tag: "h1", isHeading: true };
    if (editor.isActive("heading", { level: 2 })) return { label: "Heading 2 (H2)", short: "H2", tag: "h2", isHeading: true };
    if (editor.isActive("heading", { level: 3 })) return { label: "Heading 3 (H3)", short: "H3", tag: "h3", isHeading: true };
    if (editor.isActive("heading", { level: 4 })) return { label: "Heading 4 (H4)", short: "H4", tag: "h4", isHeading: true };
    if (editor.isActive("heading", { level: 5 })) return { label: "Heading 5 (H5)", short: "H5", tag: "h5", isHeading: true };
    if (editor.isActive("heading", { level: 6 })) return { label: "Heading 6 (H6)", short: "H6", tag: "h6", isHeading: true };
    if (editor.isActive("blockquote")) return { label: "Blockquote", short: "Quote", tag: "blockquote", isHeading: false };
    if (editor.isActive("codeBlock")) return { label: "Code Block", short: "Code", tag: "code", isHeading: false };
    if (editor.isActive("paragraph")) return { label: "Paragraph (P)", short: "P", tag: "p", isHeading: false };
    return { label: "Paragraph (P)", short: "P", tag: "p", isHeading: false };
  })();

  if (!editor) return null;

  const wrapClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-white"
    : "border rounded-xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all";

  return (
    <>
      {/* Hidden input that FormData picks up */}
      <input type="hidden" name={name} ref={hiddenRef} defaultValue={defaultValue} />

      <div className={wrapClass}>
        {/* ─ Sticky Toolbar ─ */}
        <div className={`flex flex-wrap items-center gap-1 p-2 border-b bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm rounded-t-xl transition-all ${isFullscreen ? "border-b-2" : ""}`}>

          {/* Headings / Format */}
          <DropMenu 
            label={currentFormat.short} 
            icon={<Type className="w-4 h-4 text-primary" />}
            badge={
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black font-mono ${currentFormat.isHeading ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-100 text-slate-700"}`}>
                {currentFormat.tag.toUpperCase()}
              </span>
            }
          >
            <MenuItem 
              onClick={() => editor.chain().focus().setParagraph().run()} 
              icon={<Pilcrow className="w-4 h-4" />} 
              label="Paragraph (P)" 
              active={editor.isActive("paragraph")}
            />
            {([1,2,3,4,5,6] as const).map(l => (
              <MenuItem 
                key={l} 
                onClick={() => editor.chain().focus().toggleHeading({ level: l }).run()}
                icon={<span className="font-bold text-xs">H{l}</span>} 
                label={`Heading ${l} (H${l})`}
                shortcut={`Ctrl+Alt+${l}`} 
                active={editor.isActive("heading", { level: l })}
              />
            ))}
            <div className="border-t border-slate-100 my-1" />
            <MenuItem 
              onClick={() => editor.chain().focus().toggleBlockquote().run()} 
              icon={<Quote className="w-4 h-4" />} 
              label="Blockquote" 
              active={editor.isActive("blockquote")}
            />
            <MenuItem 
              onClick={() => editor.chain().focus().toggleCode().run()} 
              icon={<Code className="w-4 h-4" />} 
              label="Inline Code" 
              active={editor.isActive("code")}
            />
            <MenuItem 
              onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
              icon={<Code2 className="w-4 h-4" />} 
              label="Code Block" 
              active={editor.isActive("codeBlock")}
            />
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

          {/* Action Button (CTA) */}
          <ToolbarBtn onClick={() => setShowButtonModal(true)} title="Insert Stylish Action Button (CTA)">
            <MousePointerClick className="w-4 h-4 text-primary" />
          </ToolbarBtn>

          <Divider />

          {/* Table */}
          <DropMenu label="Table" icon={<TableIcon className="w-4 h-4" />}>
            <p className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">Visual Tables</p>
            <MenuItem onClick={insertComparisonTable} icon={<Sparkles className="w-4 h-4 text-primary" />} label="⭐ Comparison Table" />
            <MenuItem onClick={insertSpecsTable} icon={<Grid3X3 className="w-4 h-4 text-primary" />} label="📋 Specifications Table" />
            <MenuItem onClick={insertPricingTable} icon={<Zap className="w-4 h-4 text-primary" />} label="💰 Pricing & Plans Table" />
            <MenuItem onClick={insertRulesTable} icon={<ShieldCheck className="w-4 h-4 text-primary" />} label="📌 Guidelines & Rules Table" />
            <div className="border-t border-slate-100 my-1" />
            <MenuItem onClick={() => setShowTable(true)} icon={<Plus className="w-4 h-4" />} label="Custom Grid Table..." />
            {editor.isActive("table") && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <MenuItem onClick={toggleCellHighlight} icon={<Sparkles className="w-4 h-4 text-amber-500" />} label="⭐ Toggle Cell/Header Highlight" />
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
            <MenuItem onClick={() => setShowButtonModal(true)} icon={<MousePointerClick className="w-4 h-4 text-primary" />} label="Stylish Action Button (CTA)" />
            <div className="border-t border-slate-100 my-1" />
            <p className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">Visual Tables</p>
            <MenuItem onClick={insertComparisonTable} icon={<Sparkles className="w-4 h-4 text-primary" />} label="⭐ Comparison Table" />
            <MenuItem onClick={insertSpecsTable} icon={<Grid3X3 className="w-4 h-4 text-primary" />} label="📋 Specifications Table" />
            <MenuItem onClick={insertPricingTable} icon={<Zap className="w-4 h-4 text-primary" />} label="💰 Pricing & Plans Table" />
            <MenuItem onClick={insertRulesTable} icon={<ShieldCheck className="w-4 h-4 text-primary" />} label="📌 Guidelines Table" />
            <div className="border-t border-slate-100 my-1" />
            <p className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">Status Badges</p>
            <div className="px-3 py-1 flex flex-wrap gap-1">
              <button type="button" onMouseDown={(e) => { e.preventDefault(); insertBadge("badge-check", "✅ Verified"); }} className="badge-check cursor-pointer hover:opacity-80">✅ Verified</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); insertBadge("badge-vip", "⭐ VIP Tier"); }} className="badge-vip cursor-pointer hover:opacity-80">⭐ VIP Tier</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); insertBadge("badge-speed", "⚡ Ultra Fast"); }} className="badge-speed cursor-pointer hover:opacity-80">⚡ Ultra Fast</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); insertBadge("badge-gold", "🏆 Best Value"); }} className="badge-gold cursor-pointer hover:opacity-80">🏆 Best Value</button>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); insertBadge("badge-cross", "❌ Prohibited"); }} className="badge-cross cursor-pointer hover:opacity-80">❌ Prohibited</button>
            </div>
            <div className="border-t border-slate-100 my-1" />
            <p className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">Callouts</p>
            {(["info","success","warning","tip","error"] as CalloutType[]).map(t => (
              <MenuItem key={t} onClick={() => insertCallout(t)} icon={CALLOUT_STYLES[t].icon} label={`${CALLOUT_STYLES[t].label} Box`} />
            ))}
            <div className="border-t border-slate-100 my-1" />
            <p className="px-3 py-1 text-xs text-slate-400 font-semibold uppercase tracking-wider">Layout Blocks</p>
            <MenuItem onClick={insertStatCards} icon={<Zap className="w-4 h-4" />} label="Visual Stat Cards" />
            <MenuItem onClick={insertFeatureGrid} icon={<Grid3X3 className="w-4 h-4" />} label="Feature Cards (3-col)" />
            <MenuItem onClick={insertTwoCol} icon={<Columns className="w-4 h-4" />} label="Two Columns" />
            <MenuItem onClick={insertProsConsList} icon={<Check className="w-4 h-4" />} label="Pros & Cons" />
            <MenuItem onClick={insertSteps} icon={<ListOrdered className="w-4 h-4" />} label="Numbered Steps" />
            <MenuItem onClick={insertFaqAccordion} icon={<HelpCircle className="w-4 h-4" />} label="FAQ Accordion" />
            <MenuItem onClick={insertGuaranteeBanner} icon={<ShieldCheck className="w-4 h-4" />} label="Guarantee Banner" />
            <MenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus className="w-4 h-4" />} label="Divider Line" />
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
          {/* Quick Format Selector in BubbleMenu */}
          <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1 mr-1">
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); editor.chain().focus().setParagraph().run(); }}
              className={`px-1.5 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                editor.isActive("paragraph") ? "bg-primary text-white" : "text-slate-300 hover:bg-white/10"
              }`}
              title="Format as Paragraph (P)"
            >
              P
            </button>
            {([1, 2, 3, 4, 5] as const).map(l => (
              <button
                key={l}
                type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: l }).run(); }}
                className={`px-1.5 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                  editor.isActive("heading", { level: l }) ? "bg-primary text-white" : "text-slate-300 hover:bg-white/10"
                }`}
                title={`Format as Heading ${l} (H${l})`}
              >
                H{l}
              </button>
            ))}
          </div>

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
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-200/80 text-slate-800 border border-slate-300">
              <span className="text-slate-500 font-sans font-normal">Format:</span>
              <span className={currentFormat.isHeading ? "text-indigo-700" : "text-slate-900"}>{currentFormat.label}</span>
            </span>
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
      {showButtonModal && (
        <ButtonModal
          initialData={editingButton?.attrs}
          onInsert={handleSaveActionButton}
          onClose={() => {
            setShowButtonModal(false);
            setEditingButton(null);
          }}
        />
      )}
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
