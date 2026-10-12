"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import MediaSelector from "./MediaSelector";
import { Tag, Plus, X } from "lucide-react";

interface BlogEditorProps {
  initialData?: any;
  categories: { id: string; name: string }[];
  mode: "create" | "edit";
  postId?: string;
}

export default function BlogEditor({ initialData, categories, mode, postId }: BlogEditorProps) {
  const [activeTab, setActiveTab] = useState("general");
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
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (mode === "create" && !initialData?.slug) {
      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  };

  const addTagsFromString = (input: string) => {
    const rawSegments = input.split(",");
    const segments = rawSegments
      .map(t => t.trim().replace(/^#+/, ""))
      .filter(t => t.length > 0);
    
    if (segments.length > 0) {
      setTags(prev => Array.from(new Set([...prev, ...segments])));
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
    setTags(tags.filter(t => t !== tagToRemove));
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

  return (
    <form id="blog-post-form" onSubmit={(e) => handleSubmit(e)} noValidate className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{mode === "create" ? "New Post" : "Edit Post"}</h1>
          <p className="text-xs text-slate-500">Drafts are saved directly without losing content across tabs.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(undefined, "DRAFT")}
            className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-sm bg-white hover:bg-slate-50 text-slate-700 shadow-sm disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSubmit(undefined, "PUBLISHED")}
            className="px-5 py-2 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-colors"
          >
            {saving ? "Publishing..." : "Publish Post"}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 space-y-6">
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
              className={`font-medium pb-2 -mb-[18px] transition-colors ${activeTab === "seo" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"}`}
            >
              SEO &amp; Keywords
            </button>
          </div>
          
          {/* General Tab - Kept mounted to prevent content loss */}
          <div className={activeTab === "general" ? "space-y-4" : "hidden"}>
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input name="title" value={title} onChange={handleTitleChange} placeholder="Enter engaging article title..." className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input name="slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="url-friendly-slug" className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50 font-mono text-xs" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select name="categoryId" defaultValue={initialData?.categoryId || ""} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50">
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Excerpt</label>
              <textarea name="excerpt" defaultValue={initialData?.excerpt} placeholder="Brief summary of the article..." className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50" rows={3}></textarea>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Article Content &amp; Design Studio</label>
                <span className="text-xs text-slate-400">Tabs do not erase content</span>
              </div>
              <RichTextEditor name="content" defaultValue={initialData?.content || ""} onChange={setContent} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Featured Image URL</label>
              <input name="featuredImage" id="post-image" defaultValue={initialData?.featuredImage} placeholder="https://..." className="w-full border rounded-lg p-2.5 text-sm mb-2" />
              <MediaSelector onSelect={(url) => { (document.getElementById("post-image") as HTMLInputElement).value = url; }} />
            </div>

            {/* Tags quick section in General tab */}
            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-primary" /> Post Tags</span>
                <span className="text-xs text-slate-400">Can also manage in SEO tab</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      handleAddTag(e);
                    }
                  }}
                  placeholder="Add tag (e.g. guide, tutorials, windows) and press Enter"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* SEO Tab - Kept mounted in DOM */}
          <div className={activeTab === "seo" ? "space-y-4" : "hidden"}>
            <div>
              <label className="block text-sm font-medium mb-1">SEO Title</label>
              <input name="seoTitle" defaultValue={initialData?.seoTitle} placeholder="Search result title tag..." className="w-full border rounded-lg p-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meta Description</label>
              <textarea name="metaDescription" defaultValue={initialData?.metaDescription} placeholder="Search snippet description..." className="w-full border rounded-lg p-2.5 text-sm" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Canonical URL</label>
              <input name="canonicalUrl" defaultValue={initialData?.canonicalUrl} className="w-full border rounded-lg p-2.5 text-sm" placeholder={`/blog/${initialData?.slug || ""}`} />
            </div>
            
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-primary" /> SEO Tags &amp; Keywords</span>
                <span className="text-xs text-slate-400">Embeds into meta keywords &amp; Google indexing</span>
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
                  placeholder="Paste comma-separated keywords (e.g. proxy, socks5, vpn) or press Enter"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-600 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No tags added yet. Add relevant keywords for ranking.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-72 bg-white rounded-xl shadow-sm border p-6 space-y-5 h-fit">
          <h3 className="font-semibold text-slate-900">Publishing Options</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select name="status" value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          <div className="pt-3 border-t">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-2">Active Tags ({tags.length})</span>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.map(t => (
                  <span key={t} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">None added</p>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

