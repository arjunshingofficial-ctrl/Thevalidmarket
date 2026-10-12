import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Metadata } from "next";
import { Clock, ArrowRight, Sparkles, Newspaper, ChevronRight } from "lucide-react";
import BlogSidebar from "@/components/blog/BlogSidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & Guides - Asia D Market",
  description: "Read the latest tutorials, proxy setups, security guides, and industry news from Asia D Market.",
};

export default async function BlogIndexPage() {
  // 1. Fetch published posts
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true },
    orderBy: { publishDate: "desc" },
  });

  // 2. Fetch sidebar data (recent posts, popular products, featured courses)
  const recentPosts = posts.slice(0, 4).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    featuredImage: p.featuredImage,
    publishDate: p.publishDate,
    createdAt: p.createdAt,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
  }));

  const popularProducts = await prisma.product.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      salePrice: true,
      type: true,
      metadata: true,
    },
  });

  const coursesRaw = await prisma.course.findMany({
    where: { status: "ACTIVE" },
    take: 2,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
        },
      },
    },
  });

  let featuredCourses = coursesRaw.map((c) => ({
    id: c.id,
    title: c.product.name,
    slug: c.product.slug,
    price: c.product.price,
    imageUrl: c.thumbnailUrl,
    level: "All Levels",
  }));

  if (featuredCourses.length === 0) {
    const fallbackCourseProducts = await prisma.product.findMany({
      where: { status: "PUBLISHED", type: "COURSE" },
      take: 2,
    });
    featuredCourses = fallbackCourseProducts.map((p) => ({
      id: p.id,
      title: p.name,
      slug: p.slug,
      price: p.price,
      imageUrl: null,
      level: "Masterclass",
    }));
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ─ Hero Header ─ */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold uppercase tracking-widest mb-4">
            <Newspaper className="w-3.5 h-3.5" />
            <span>Asia D Market Hub</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            News, Insights &amp; Tutorials
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Expert software deployment guides, private proxy configurations, security analyses, and official platform announcements.
          </p>
        </div>

        {/* ─ Two-Column Grid with Sticky Sidebar ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Main Articles Column */}
          <div className="lg:col-span-8">
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Newspaper className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No articles published yet</h3>
                <p className="text-slate-400 text-sm mt-1">Check back soon for fresh technical news and tutorials.</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {posts.map((post) => {
                  const wordCount = post.content ? post.content.replace(/<[^>]+>/g, "").split(/\s+/).length : 0;
                  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                  return (
                    <article
                      key={post.id}
                      className="group flex flex-col bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-primary/40 transition-all hover:-translate-y-1"
                    >
                      {/* Thumbnail */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="w-full aspect-video bg-slate-100 relative overflow-hidden block"
                        style={{ aspectRatio: "16 / 9" }}
                      >
                        {post.featuredImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={post.featuredImage}
                            alt={post.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-100 font-bold text-xs uppercase tracking-widest">
                            No Cover Image
                          </div>
                        )}
                        {post.category && (
                          <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg">
                            {post.category.name}
                          </span>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{readingTime} min read</span>
                          <span>•</span>
                          <span>
                            {post.publishDate
                              ? new Date(post.publishDate).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : new Date(post.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                          </span>
                        </div>

                        <h2 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2.5">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>

                        <p className="text-slate-500 text-xs sm:text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                          {post.excerpt || "Read this complete technical guide and breakdown from Asia D Market."}
                        </p>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <span className="text-xs font-bold text-slate-700">Team Admin</span>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs font-extrabold text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1"
                          >
                            Read Article <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <BlogSidebar
                recentPosts={recentPosts}
                popularProducts={popularProducts}
                featuredCourses={featuredCourses}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
