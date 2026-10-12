import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Folders, BookOpen } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";
import BlogPostsTable from "@/components/admin/BlogPostsTable";

export const dynamic = "force-dynamic";

export default async function AdminBlog() {
  await requireAdmin("Content", "View");

  const [posts, categories] = await Promise.all([
    prisma.blogPost.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* ─ Header ─ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Blog &amp; News Posts
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Publish, edit, view, and manage blog articles, announcements, and SEO content.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href="/admin/blog/categories"
            className="flex-1 sm:flex-initial bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Folders className="h-4 w-4 text-slate-500" />
            <span>Categories</span>
          </Link>
          <Link
            href="/admin/blog/new"
            className="flex-1 sm:flex-initial bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Blog Post</span>
          </Link>
        </div>
      </div>

      {/* ─ Interactive Posts Table ─ */}
      <BlogPostsTable initialPosts={posts as any} categories={categories} />
    </div>
  );
}
