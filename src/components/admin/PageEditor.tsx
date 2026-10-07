"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "./RichTextEditor";

interface PageEditorProps {
  initialData?: any;
  mode: "create" | "edit";
  pageId?: string;
}

export default function PageEditor({ initialData, mode, pageId }: PageEditorProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    const formData = new FormData(e.currentTarget);
    
    const endpoint = mode === "create" ? "/api/admin/pages" : `/api/admin/pages/${pageId}`;
    const method = mode === "create" ? "POST" : "PUT";
    
    try {
      const res = await fetch(endpoint, { method, body: formData });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(mode === "create" ? "Page saved successfully." : "Page updated successfully.");
        if (mode === "create") {
          router.push(`/admin/pages/${data.id}/edit`);
        } else {
          router.refresh();
        }
      } else {
        let msg = "Error saving page";
        try {
          const errorData = await res.json();
          msg = errorData.error || msg;
        } catch (e) {}
        setErrorMsg(msg);
      }
    } catch (err) {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{mode === "create" ? "New Page" : "Edit Page"}</h1>
        <button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50">
          {saving ? "Saving..." : (mode === "create" ? "Save Draft" : "Update Page")}
        </button>
      </div>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 text-sm font-medium">
          {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-md border border-emerald-200 text-sm font-medium">
          {successMsg}
        </div>
      )}
      
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
                <label className="block text-sm font-medium mb-1">Content</label>
                <RichTextEditor name="content" defaultValue={initialData?.content || ""} />
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
