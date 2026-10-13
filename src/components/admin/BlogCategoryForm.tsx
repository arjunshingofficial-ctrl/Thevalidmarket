"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  FolderPlus, 
  Sparkles, 
  AlertCircle, 
  Globe, 
  Search,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { createBlogCategory, updateBlogCategory } from "@/lib/actions/blog-categories";

interface BlogCategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
}

export default function BlogCategoryForm({
  mode,
  categoryId,
  initialData,
}: BlogCategoryFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [slugEditedManually, setSlugEditedManually] = useState(mode === "edit");
  const [description, setDescription] = useState(initialData?.description || "");
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || "");

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugEditedManually && mode === "create") {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEditedManually(true);
    setSlug(slugify(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("slug", slug.trim() || slugify(name));
    if (description.trim()) formData.append("description", description.trim());
    if (seoTitle.trim()) formData.append("seoTitle", seoTitle.trim());
    if (seoDescription.trim()) formData.append("seoDescription", seoDescription.trim());

    try {
      if (mode === "create") {
        await createBlogCategory(formData);
      } else if (categoryId) {
        await updateBlogCategory(categoryId, formData);
      }
      // Server action handles redirect, but push as fallback
      router.push("/admin/blog/categories");
    } catch (err: any) {
      // In Next.js redirect throws NEXT_REDIRECT, which should not be caught as an error
      if (err?.message?.includes("NEXT_REDIRECT")) {
        return;
      }
      setError(err?.message || "An unexpected error occurred while saving.");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <Link href="/admin/blog" className="hover:text-slate-900 transition-colors">
              Blog
            </Link>
            <span>/</span>
            <Link href="/admin/blog/categories" className="hover:text-slate-900 transition-colors">
              Categories
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">
              {mode === "create" ? "New Category" : "Edit"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {mode === "create" ? "Create Blog Category" : `Edit Category: ${initialData?.name}`}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Organize articles, news, and tutorials to help visitors find topics effortlessly.
          </p>
        </div>

        <Link
          href="/admin/blog/categories"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Categories</span>
        </Link>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <span className="font-bold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">General Information</h2>
              <p className="text-xs text-slate-500">Name and URL configuration for this blog category</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Category Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g. Cybersecurity, Tutorials, Zero-Day"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Slug <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setSlug(slugify(name))}
                  className="text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Generate
                </button>
              </div>
              <input
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="e.g. cybersecurity-news"
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 font-mono">
                Preview: asiadmarket.com/news?category={slug || "slug"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary explaining what kind of articles belong in this category..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all text-slate-900 bg-slate-50/50 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* SEO & Search Visibility Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">Search Engine Optimization (SEO)</h2>
              <p className="text-xs text-slate-500">Custom meta tags for search engines & social previews</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  SEO Meta Title
                </label>
                <span className="text-[11px] text-slate-400">
                  {seoTitle.length} / 60 characters
                </span>
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={name ? `${name} Articles & News | Asia D Market` : "Custom meta title..."}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-900 bg-slate-50/50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  SEO Meta Description
                </label>
                <span className="text-[11px] text-slate-400">
                  {seoDescription.length} / 160 characters
                </span>
              </div>
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Meta description for Google search results..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-900 bg-slate-50/50 focus:bg-white resize-none"
              />
            </div>

            {/* Google SERP Preview Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Search Result Preview
              </span>
              <p className="text-blue-600 font-semibold text-sm truncate hover:underline cursor-pointer">
                {seoTitle || (name ? `${name} | Asia D Market News` : "Category Title | Asia D Market")}
              </p>
              <p className="text-emerald-700 text-xs font-mono truncate">
                https://asiadmarket.com/news?category={slug || "category-slug"}
              </p>
              <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                {seoDescription || description || "Explore the latest insights, tutorials, and developments on Asia D Market."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/blog/categories"
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-100 transition-colors shadow-xs"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-500/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Category...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{mode === "create" ? "Create Category" : "Save Changes"}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
