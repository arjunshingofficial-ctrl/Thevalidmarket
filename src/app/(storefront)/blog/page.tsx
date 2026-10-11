import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News - Asia D Market",
  description: "Read the latest news, tutorials, and updates from Asia D Market.",
};

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true },
    orderBy: { publishDate: "desc" }
  });

  return (
    <div className="min-h-screen py-16 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">News</h1>
          <p className="mt-4 text-xl text-slate-500">Latest updates, announcements, and news from the team.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-full aspect-video bg-slate-100 relative overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                {post.featuredImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={post.featuredImage} alt={post.title} className="object-cover w-full h-full" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-100">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                {post.category && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    {post.category.name}
                  </span>
                )}
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 mb-3">
                  {post.title}
                </h2>
                <p className="text-slate-500 text-sm line-clamp-3 mb-4 flex-1">
                  {post.excerpt || "Read more about this topic in our latest article."}
                </p>
                <div className="text-xs text-slate-400 mt-auto pt-4 border-t border-slate-100">
                  {post.publishDate ? new Date(post.publishDate).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <h3 className="text-lg font-medium text-slate-900">No news yet</h3>
            <p className="text-slate-500 mt-1">Check back later for new content.</p>
          </div>
        )}
      </div>
    </div>
  );
}
