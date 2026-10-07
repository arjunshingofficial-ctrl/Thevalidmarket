"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";
import MediaSelector from "./MediaSelector";

interface BlogEditorProps {
  initialData?: any;
  categories: { id: string; name: string }[];
  mode: "create" | "edit";
  postId?: string;
}

export default function BlogEditor({ initialData, categories, mode, postId }: BlogEditorProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const endpoint = mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${postId}`;
    const method = mode === "create" ? "POST" : "PUT";
    
    const res = await fetch(endpoint, { method, body: formData });
    if (res.ok) {
      router.push("/admin/blog");
      router.refresh();
    } else {
      alert("Error saving blog post");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{mode === "create" ? "New Post" : "Edit Post"}</h1>
        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm">
          {saving ? "Saving..." : "Save Post"}
        </button>
      </div>
      
      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex gap-4 border-b pb-4">
            <button type="button" onClick={() => setActiveTab("general")} className={`font-medium ${activeTab === "general" ? "text-primary border-b-2 border-primary" : "text-slate-500"}`}>General</button>
            <button type="button" onClick={() => setActiveTab("seo")} className={`font-medium ${activeTab === "seo" ? "text-primary border-b-2 border-primary" : "text-slate-500"}`}>SEO</button>
          </div>
          
          {activeTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input name="title" required defaultValue={initialData?.title} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input name="slug" required defaultValue={initialData?.slug} className="w-full border rounded p-2" />
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
            </div>
          )}
          
          {activeTab === "seo" && (
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">SEO Title</label><input name="seoTitle" defaultValue={initialData?.seoTitle} className="w-full border rounded p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Meta Description</label><textarea name="metaDescription" defaultValue={initialData?.metaDescription} className="w-full border rounded p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Canonical URL</label><input name="canonicalUrl" defaultValue={initialData?.canonicalUrl} className="w-full border rounded p-2" /></div>
            </div>
          )}
        </div>
        
        <div className="w-72 bg-white rounded-xl shadow-sm border p-6 space-y-4 h-fit">
          <h3 className="font-semibold text-slate-900">Publishing</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select name="status" defaultValue={initialData?.status || "DRAFT"} className="w-full border rounded p-2">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
