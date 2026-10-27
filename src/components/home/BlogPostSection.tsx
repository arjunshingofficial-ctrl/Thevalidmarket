import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, User } from "lucide-react";
import { normalizeImageUrl } from "@/lib/storage/client";

function BlogPostCard({ post }: { post: any }) {
  if (!post?.id) return null;

  const href = `/blog/${post.slug}`;
  const date = post.publishDate
    ? new Date(post.publishDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300">
      
      {/* Featured Image */}
      <Link href={href} className="relative block overflow-hidden bg-slate-100 w-full aspect-video" style={{ aspectRatio: "16 / 9" }}>
        {post.featuredImage ? (
          <Image
            src={normalizeImageUrl(post.featuredImage)}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <div className="text-4xl font-black text-slate-200 select-none">
              {post.title.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        {/* Category badge overlay */}
        {post.category && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur text-primary text-[11px] font-bold rounded-lg uppercase tracking-widest shadow-sm">
              {post.category.name}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Category label (if no image overlay was shown) */}
        {!post.featuredImage && post.category && (
          <div className="text-[11px] font-bold text-primary/70 uppercase tracking-widest">
            {post.category.name}
          </div>
        )}

        {/* Title */}
        <Link href={href} className="font-bold text-slate-900 leading-snug line-clamp-2 hover:text-primary transition-colors">
          {post.title}
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta + CTA */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            {date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {date}
              </span>
            )}
          </div>
          <Link
            href={href}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            Read <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

interface BlogPostSectionProps {
  posts: any[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
}

export function BlogPostSection({
  posts,
  title = "Latest from the Blog",
  subtitle,
  showViewAll = true,
}: BlogPostSectionProps) {
  // Hide if no published posts
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="container max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-[11px] font-bold text-primary/60 uppercase tracking-widest mb-1">
              Blog
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-slate-500 mt-2 text-sm max-w-xl">{subtitle}</p>
            )}
          </div>
          {showViewAll && (
            <Link
              href="/blog"
              className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              View All Articles <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Subtle divider */}
        <div className="w-12 h-0.5 bg-primary/30 rounded-full mb-8" />

        {/* Blog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {posts.map((post: any) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
