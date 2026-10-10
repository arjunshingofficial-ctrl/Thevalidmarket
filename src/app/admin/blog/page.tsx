import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, Settings } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminBlog() {
  await requireAdmin("Content", "View"); // Using a general 'Content' module permission

  const posts = await prisma.blogPost.findMany({
    include: {
      category: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">News & Announcements</h1>
          <p className="text-slate-500 mt-1">Manage news articles, updates, and announcements.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/blog/categories"
            className="bg-white border text-slate-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-slate-50 shadow-sm">
            Categories
          </Link>
          <Link href="/admin/blog/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 shadow-sm">
            <Plus className="h-4 w-4" /> Post News
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Published</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No news posts found</p>
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 line-clamp-1">{post.title}</div>
                    <div className="text-xs text-slate-500 mt-1">/{post.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {post.category?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      post.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" :
                      post.status === "ARCHIVED" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {post.publishDate ? new Date(post.publishDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/blog/${post.id}/edit`} className="p-1.5 text-slate-400 hover:text-primary rounded hover:bg-slate-100">
                        <Settings className="h-4 w-4" />
                      </Link>
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
