"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import MediaSelector from "./MediaSelector";
import RealTimeSeoAnalyzer from "./seo/RealTimeSeoAnalyzer";
import { 
  Tag, Plus, X, Image as ImageIcon, Sparkles, 
  CheckCircle2, AlertCircle, Eye, Globe, Trash2, HelpCircle 
} from "lucide-react";

interface BlogEditorProps {
  initialData?: any;
  categories: { id: string; name: string }[];
  mode: "create" | "edit";
  postId?: string;
}

export default function BlogEditor({ initialData, categories, mode, postId }: BlogEditorProps) {
  const [activeTab, setActiveTab] = useState<"general" | "seo">("general");
  const [saving, setSaving] = useState(false);
  
  const initialTags: string[] = (() => {
    if (!initialData?.tags) return [];
    let list: any[] = [];
    if (Array.isArray(initialData.tags)) list = initialData.tags;
    else {
      try {
        const parsed = JSON.parse(initialData.tags);
        list = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        list = String(initialData.tags).split(",");
      }
    }
    return list
      .flatMap(item => typeof item === "string" ? item.split(",") : [])
      .map(t => t.trim().replace(/^#+/, ""))
      .filter(Boolean);
  })();

  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [status, setStatus] = useState(initialData?.status || "DRAFT");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");

  // Featured Image & Alt Text state
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(initialData?.featuredImageAlt || "");
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  // SEO Tab states
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || "");
  const [focusKeyword, setFocusKeyword] = useState(initialData?.focusKeyword || "");
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>(() => {
    if (!initialData?.secondaryKeywords) return [];
    try {
      const p = JSON.parse(initialData.secondaryKeywords);
      return Array.isArray(p) ? p : [String(p)];
    } catch {
      return String(initialData.secondaryKeywords).split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  });
  const [robots, setRobots] = useState(initialData?.robots || "index, follow");
  const [ogTitle, setOgTitle] = useState(initialData?.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(initialData?.ogDescription || "");
  const [ogImage, setOgImage] = useState(initialData?.ogImage || "");

  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (mode === "create" && !initialData?.slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  };

  const handleAutoGenerateAlt = () => {
    if (!title.trim()) {
      alert("Please provide an article title first to generate alt text.");
      return;
    }
    setFeaturedImageAlt(`${title.trim()} - Asia D Market Guide`);
  };

  const addTagsFromString = (input: string) => {
    const rawSegments = input.split(",");
    const segments = rawSegments
      .map(t => t.trim().replace(/^#+/, ""))
      .filter(t => t.length > 0);
    
    if (segments.length > 0) {
      setTags(prev => Array.from(new Set([...prev, ...segments])));
      setIsDirty(true);
    }
    setTagInput("");
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if (e && 'preventDefault' in e) e.preventDefault();
    if (tagInput.trim()) {
      addTagsFromString(tagInput);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
    setIsDirty(true);
  };

  const handleClearAllTags = () => {
    if (confirm("Are you sure you want to remove all tags?")) {
      setTags([]);
      setIsDirty(true);
    }
  };
  
  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>, targetStatus?: string) => {
    if (e?.preventDefault) e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setActiveTab("general");
      setError("Post title is required.");
      return;
    }

    setSaving(true);
    const formEl = document.querySelector("form#blog-post-form") as HTMLFormElement;
    const formData = formEl ? new FormData(formEl) : new FormData();

    const postStatus = targetStatus || status || "DRAFT";
    formData.set("status", postStatus);
    formData.set("title", title);
    formData.set("slug", slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    formData.set("content", content);
    formData.set("tags", JSON.stringify(tags));
    formData.set("excerpt", excerpt);
    formData.set("categoryId", categoryId);
    formData.set("featuredImage", featuredImage);
    formData.set("featuredImageAlt", featuredImageAlt);
    formData.set("seoTitle", seoTitle);
    formData.set("metaDescription", metaDescription);
    formData.set("canonicalUrl", canonicalUrl);
    formData.set("focusKeyword", focusKeyword);
    formData.set("secondaryKeywords", JSON.stringify(secondaryKeywords));
    formData.set("robots", robots);
    formData.set("ogTitle", ogTitle);
    formData.set("ogDescription", ogDescription);
    formData.set("ogImage", ogImage);
    
    const endpoint = mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${postId}`;
    const method = mode === "create" ? "POST" : "PUT";
    
    try {
      const res = await fetch(endpoint, { method, body: formData });
      if (res.ok) {
        router.push("/admin/blog");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || "Failed to save blog post.";
        setError(msg);
        alert(`Error saving blog post: ${msg}`);
      }
    } catch (err: any) {
      setError(err.message || "Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  const previewSnippetTitle = (seoTitle || title || "Untitled Article Title") + " | Asia D Market";
  const previewSnippetDesc = metaDescription || excerpt || "Read comprehensive tutorials, proxy setup walkthroughs, and verified software insights on Asia D Market.";
  const previewSlug = slug || "article-slug";

  return (
    <form id="blog-post-form" onSubmit={(e) => handleSubmit(e)} noValidate className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {mode === "create" ? "New Blog Article" : `Edit Post: ${title || "Untitled"}`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time on-page SEO analysis with live Seobility &amp; Google SERP criteria.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status badge & selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 text-xs shadow-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${status === "PUBLISHED" ? "bg-emerald-500 ring-2 ring-emerald-500/20" : "bg-amber-500 ring-2 ring-amber-500/20"}`} />
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status:</span>
            <select
              name="status"
              value={status}
              onChange={e => { setStatus(e.target.value); setIsDirty(true); }}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer text-xs"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          {mode === "edit" && (slug || initialData?.slug) && (
            <button
              type="button"
              onClick={() => window.open(`/blog/${slug || initialData?.slug}`, "_blank")}
              className="px-3.5 py-2 rounded-xl border border-slate-200 font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Preview live blog article on storefront"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview</span>
            </button>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(undefined, "DRAFT")}
            className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(undefined, "PUBLISHED")}
            className="px-5 py-2 rounded-xl font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? "Publishing..." : status === "PUBLISHED" ? "Update Post" : "Publish Post"}
          </button>
        </div>
      </div>
      
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 sm:p-7 space-y-6">
          <div className="flex gap-4 border-b pb-4">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`font-medium pb-2 -mb-[18px] transition-colors ${activeTab === "general" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"}`}
            >
              General Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seo")}
              className={`font-medium pb-2 -mb-[18px] transition-colors flex items-center gap-1.5 ${activeTab === "seo" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"}`}
            >
              <span>SEO &amp; Google Snippet</span>
              {(!seoTitle || !metaDescription || (featuredImage && !featuredImageAlt)) && (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="SEO suggestions available" />
              )}
            </button>
          </div>
          
          {/* General Tab - Kept mounted to prevent content loss */}
          <div className={activeTab === "general" ? "space-y-5" : "hidden"}>
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input 
                name="title" 
                value={title} 
                onChange={handleTitleChange} 
                placeholder="Enter engaging article title..." 
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input 
                name="slug" 
                value={slug} 
                onChange={e => setSlug(e.target.value)} 
                placeholder="url-friendly-slug" 
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50 font-mono text-xs" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select 
                name="categoryId" 
                value={categoryId} 
                onChange={e => setCategoryId(e.target.value)} 
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50"
              >
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Excerpt</label>
              <textarea 
                name="excerpt" 
                value={excerpt} 
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Brief summary of the article..." 
                className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50" 
                rows={3}
              />
            </div>

            {/* Featured Image & SEO Alt Text Section */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span>Featured Image &amp; SEO Alt Text</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowMediaSelector(prev => !prev)}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showMediaSelector ? "Close Media Library" : "Browse Media Library"}
                </button>
              </div>

              {/* Media selector drawer */}
              {showMediaSelector && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs mb-3">
                  <MediaSelector 
                    onSelect={(url) => { 
                      setFeaturedImage(url); 
                      setShowMediaSelector(false);
                      if (!featuredImageAlt && title) {
                        setFeaturedImageAlt(`${title} - Asia D Market`);
                      }
                    }} 
                  />
                </div>
              )}

              {/* Image URL input */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Featured Image URL</label>
                <input 
                  name="featuredImage" 
                  value={featuredImage} 
                  onChange={e => setFeaturedImage(e.target.value)} 
                  placeholder="https://... or choose from media library" 
                  className="w-full border rounded-lg p-2 text-sm bg-white" 
                />
              </div>

              {/* Alt Text input with Auto-Fill button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                    <span>Image Alt Text (Descriptive label for Google Image Search &amp; Accessibility)</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateAlt}
                    className="text-[11px] text-primary hover:text-primary/80 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto from Title</span>
                  </button>
                </div>
                <input 
                  name="featuredImageAlt" 
                  value={featuredImageAlt} 
                  onChange={e => setFeaturedImageAlt(e.target.value)} 
                  placeholder="e.g. SOCKS5 Proxy Android Setup Tutorial Guide" 
                  className="w-full border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-primary/50" 
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Search engines use this alt text to understand the image and index your article in Google Images.
                </p>
              </div>

              {/* Live Image Preview */}
              {featuredImage && (
                <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featuredImage} alt={featuredImageAlt || "Preview"} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-semibold text-slate-700 truncate">Image Selected</p>
                    <p className="text-slate-500 truncate">
                      <span className="font-medium text-slate-600">Alt tag:</span> {featuredImageAlt ? `"${featuredImageAlt}"` : <span className="text-amber-600 italic">None set (will fallback to title)</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFeaturedImage(""); setFeaturedImageAlt(""); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Article Content &amp; Design Studio</label>
                <span className="text-xs text-slate-400">Tabs do not erase content</span>
              </div>
              <RichTextEditor
                name="content"
                defaultValue={initialData?.content || ""}
                value={content}
                onChange={(html) => {
                  setContent(html);
                  setIsDirty(true);
                }}
              />
            </div>

            {/* Tags quick section in General tab */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-primary" /> Post Tags ({tags.length})</span>
                {tags.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTags}
                    className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes(",")) {
                      addTagsFromString(val);
                    } else {
                      setTagInput(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag(e);
                    }
                  }}
                  placeholder="Paste comma-separated keywords (e.g. socks5, proxy, android) or press Enter"
                  className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="max-h-44 overflow-y-auto pr-1 flex flex-wrap gap-1.5 pt-2 scrollbar-thin">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
                        title={`Remove #${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* SEO Tab - Real-Time SEO Analyzer */}
          <div className={activeTab === "seo" ? "block" : "hidden"}>
            <RealTimeSeoAnalyzer
              data={{
                contentType: "blog",
                name: title,
                title,
                slug,
                content,
                excerpt,
                seoTitle,
                metaDescription,
                canonicalUrl,
                featuredImage,
                featuredImageAlt,
                imageAlt: featuredImageAlt,
                robots,
                ogTitle,
                ogDescription,
                ogImage,
                primaryKeyphrase: focusKeyword,
                secondaryKeyphrases: secondaryKeywords,
              }}
              onUpdateField={(field, val) => {
                setIsDirty(true);
                if (field === "seoTitle") setSeoTitle(val);
                else if (field === "metaDescription") setMetaDescription(val);
                else if (field === "canonicalUrl") setCanonicalUrl(val);
                else if (field === "focusKeyword" || field === "primaryKeyphrase") setFocusKeyword(val);
                else if (field === "secondaryKeywords" || field === "secondaryKeyphrases") setSecondaryKeywords(val);
                else if (field === "ogTitle") setOgTitle(val);
                else if (field === "ogDescription") setOgDescription(val);
                else if (field === "ogImage") setOgImage(val);
                else if (field === "featuredImageAlt" || field === "imageAlt") setFeaturedImageAlt(val);
                else if (field === "featuredImage") setFeaturedImage(val);
                else if (field === "slug") setSlug(val);
                else if (field === "robots") setRobots(val);
                else if (field === "content") setContent(val);
              }}
              onJumpToTab={(tabId) => setActiveTab(tabId as any)}
            />
          </div>
        </div>
    </form>
  );
}
