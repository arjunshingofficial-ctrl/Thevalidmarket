import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, FolderOpen, ExternalLink } from "lucide-react";
import DeleteBlogCategoryButton from "./DeleteBlogCategoryButton";

export const dynamic = "force-dynamic";

export default async function AdminBlogCategories() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
    include: { 
      _count: { select: { posts: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Blog Categories</h1>
          <p className="text-slate-500 mt-1">Manage categories for your blog posts and articles.</p>
        </div>
        <Link 
          href="/admin/blog/categories/new" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Link>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Slug</th>
              <th className="px-6 py-4 font-semibold text-center">Posts</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No blog categories yet</p>
                  <p>Start by creating your first category.</p>
                </td>
              </tr>
            ) : (
              categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 flex items-center gap-2">
                      <span className="text-base">📂</span>
                      <span>{cat.name}</span>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {cat.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{cat.slug}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                      {cat._count.posts}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-100">
                      <a 
                        href={`/news?category=${cat.slug}`} 
                        target="_blank" 
                        rel="noreferrer"
                        title="View Category on Storefront"
                        className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Link 
                        href={`/admin/blog/categories/${cat.id}/edit`} 
                        title="Edit Category"
                        className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <DeleteBlogCategoryButton 
                        categoryId={cat.id} 
                        categoryName={cat.name} 
                        postsCount={cat._count.posts} 
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
