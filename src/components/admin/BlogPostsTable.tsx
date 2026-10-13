"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Eye, Edit, Trash2, Copy, Check, Search, 
  Filter, FileText, AlertTriangle, Loader2, Sparkles, Tag, ExternalLink
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishDate: Date | string | null;
  createdAt: Date | string;
  tags?: string | null;
  views?: number;
  category?: Category | null;
}

interface BlogPostsTableProps {
  initialPosts: BlogPost[];
  categories: Category[];
}

export default function BlogPostsTable({ initialPosts, categories }: BlogPostsTableProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  // Filter logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.slug.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "all" || post.category?.id === selectedCategory;
    
    const matchesStatus = 
      selectedStatus === "all" || post.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCopyLink = async (slug: string, id: string) => {
    try {
      const url = `${window.location.origin}/blog/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setStatusUpdatingId(post.id);

    try {
      const fd = new FormData();
      fd.append("status", newStatus);

      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PUT",
        body: fd
      });

      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p));
        router.refresh();
      } else {
        alert("Failed to update post status.");
      }
    } catch {
      alert("Network error updating status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/blog/${deleteTarget.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete blog post.");
      }
    } catch {
      alert("Network error while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ─ Filters Toolbar ─ */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-initial text-xs border rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 md:flex-initial text-xs border rounded-lg px-3 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-md shrink-0">
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          </span>

          <span className="text-xs font-semibold px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-md shrink-0 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-violet-500" />
            <span>{filteredPosts.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()} total views</span>
          </span>
        </div>
      </div>

      {/* ─ Table Card ─ */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Blog Post Title &amp; Slug</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-center">Views</th>
                <th className="px-6 py-3.5">Published Date</th>
                <th className="px-6 py-3.5 text-right min-w-[220px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="font-semibold text-slate-700 text-base">No blog posts found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or publish a new article.</p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => {
                  return (
                    <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Title & Slug */}
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/blog/${post.id}/edit`} 
                          className="font-bold text-slate-900 hover:text-primary transition-colors line-clamp-1 block"
                        >
                          {post.title}
                        </Link>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>/blog/{post.slug}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        {post.category?.name ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {post.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled={statusUpdatingId === post.id}
                          onClick={() => handleToggleStatus(post)}
                          title="Click to toggle status (Published / Draft)"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            post.status === "PUBLISHED" 
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" 
                              : post.status === "ARCHIVED" 
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200" 
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          } ${statusUpdatingId === post.id ? "opacity-50" : ""}`}
                        >
                          {statusUpdatingId === post.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${post.status === "PUBLISHED" ? "bg-emerald-500" : "bg-slate-400"}`} />
                          )}
                          {post.status}
                        </button>
                      </td>

                      {/* Views */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100/80 shadow-2xs">
                          <Eye className="w-3.5 h-3.5 text-violet-500" />
                          <span>{(post.views || 0).toLocaleString()}</span>
                        </span>
                      </td>

                      {/* Published Date */}
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {post.publishDate ? (
                          new Date(post.publishDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })
                        ) : (
                          <span className="text-slate-400 italic">Not published</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View on storefront */}
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200/80 shadow-xs"
                            title="View post on live storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </a>

                          {/* Edit */}
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors shadow-xs"
                            title="Edit content, SEO, and keywords"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>

                          {/* Copy URL */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(post.slug, post.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Copy public URL"
                          >
                            {copiedId === post.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(post)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete this post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─ Delete Confirmation Modal ─ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Blog Post</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900 font-semibold">"{deleteTarget.title}"</strong>? 
              The post will be removed from your database and storefront immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
