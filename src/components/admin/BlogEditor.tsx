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
    if (Array.isArray(initialData.tags)) return initialData.tags;
    try {
      const parsed = JSON.parse(initialData.tags);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return String(initialData.tags).split(",").map(t => t.trim()).filter(Boolean);
    }
  })();

  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (mode === "create" && !initialData?.slug) {
      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  };

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if (e && 'preventDefault' in e) e.preventDefault();
    const trimmed = tagInput.trim().replace(/^,+|,+$/g, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-2">×</button>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{mode === "create" ? "New Post" : "Edit Post"}</h1>
        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm">
          {saving ? "Saving..." : "Save Post"}
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex gap-4 border-b pb-4">
            <button type="button" onClick={() => setActiveTab("general")} className={`font-medium pb-2 -mb-[18px] transition-colors ${activeTab === "general" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"}`}>General</button>
            <button type="button" onClick={() => setActiveTab("seo")} className={`font-medium pb-2 -mb-[18px] transition-colors ${activeTab === "seo" ? "text-primary border-b-2 border-primary" : "text-slate-500 hover:text-slate-900"}`}>SEO & Keywords</button>
          </div>
          
          {activeTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input name="title" required value={title} onChange={handleTitleChange} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input name="slug" required value={slug} onChange={e => setSlug(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select name="categoryId" defaultValue={initialData?.categoryId || ""} className="w-full border rounded p-2">
                  <option value="">No Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Excerpt</label>
                <textarea name="excerpt" defaultValue={initialData?.excerpt} className="w-full border rounded p-2" rows={3}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <RichTextEditor name="content" defaultValue={initialData?.content || ""} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Featured Image URL</label>
                <input name="featuredImage" id="post-image" defaultValue={initialData?.featuredImage} className="w-full border rounded p-2 mb-2" />
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
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-3 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 flex items-center gap-1"
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
          )}
          
          {activeTab === "seo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">SEO Title</label>
                <input name="seoTitle" defaultValue={initialData?.seoTitle} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meta Description</label>
                <textarea name="metaDescription" defaultValue={initialData?.metaDescription} className="w-full border rounded p-2" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Canonical URL</label>
                <input name="canonicalUrl" defaultValue={initialData?.canonicalUrl} className="w-full border rounded p-2" placeholder={`/blog/${initialData?.slug || ""}`} />
              </div>
              
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Tag className="w-4 h-4 text-primary" /> SEO Tags & Keywords</span>
                  <span className="text-xs text-slate-400">Embeds into meta keywords & Google indexing</span>
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
                    placeholder="Add SEO keyword and press Enter"
                    className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-3 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 flex items-center gap-1"
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
          )}
        </div>
        
        <div className="w-full lg:w-72 bg-white rounded-xl shadow-sm border p-6 space-y-5 h-fit">
          <h3 className="font-semibold text-slate-900">Publishing</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select name="status" defaultValue={initialData?.status || "DRAFT"} className="w-full border rounded p-2">
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
