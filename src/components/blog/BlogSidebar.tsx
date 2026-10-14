import Link from "next/link";
import Image from "next/image";
import { 
  Flame, BookOpen, Sparkles, MessageCircle, ArrowRight, 
  Clock, ShieldCheck, ChevronRight, ShoppingBag, FolderKanban, Tag
} from "lucide-react";
import { normalizeImageUrl } from "@/lib/storage/client";

interface RecentPost {
  id: string;
  title: string;
  slug: string;
  featuredImage?: string | null;
  publishDate?: Date | string | null;
  createdAt: Date | string;
  category?: { name: string; slug: string } | null;
}

interface PopularProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  type: string;
  metadata?: string | null;
}

interface FeaturedCourse {
  id: string;
  title: string;
  slug: string;
  price: number;
  imageUrl?: string | null;
  level?: string | null;
}

export interface SidebarCategory {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
}

interface BlogSidebarProps {
  recentPosts: RecentPost[];
  popularProducts: PopularProduct[];
  featuredCourses: FeaturedCourse[];
  categories?: SidebarCategory[];
  activeCategorySlug?: string | null;
}

export default function BlogSidebar({
  recentPosts,
  popularProducts,
  featuredCourses,
  categories,
  activeCategorySlug,
}: BlogSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* ─ 0. Topics & Categories (If provided) ─ */}
      {categories && categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              <span>Topics &amp; Categories</span>
            </div>
            <Link
              href="/news"
              className="text-xs text-primary hover:underline font-semibold flex items-center"
            >
              All Topics <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-1">
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`/news?category=${cat.slug}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? "bg-primary text-white shadow-xs font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? "bg-white" : "bg-slate-300 group-hover:bg-primary"
                      } transition-colors`}
                    />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  {cat.postCount !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                      }`}
                    >
                      {cat.postCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
      {/* ─ 1. Popular Products & Digital Tools ─ */}
      {popularProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Popular Tools &amp; Products</span>
            </div>
            <Link
              href="/store"
              className="text-xs text-primary hover:underline font-semibold flex items-center"
            >
              All Store <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {popularProducts.map((prod) => {
              let image = "";
              if (prod.metadata) {
                try {
                  const meta = JSON.parse(prod.metadata);
                  image = meta.image || "";
                } catch {}
              }
              const displayPrice = prod.salePrice ?? prod.price;

              return (
                <Link
                  key={prod.id}
                  href={`/product/${prod.slug}`}
                  className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                >
                  <div className="relative w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200/60 flex items-center justify-center">
                    {image ? (
                      <Image
                        src={normalizeImageUrl(image)}
                        alt={prod.name}
                        fill
                        sizes="48px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                      {prod.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-extrabold text-emerald-600">
                        ${Number(displayPrice).toFixed(2)}
                      </span>
                      {prod.salePrice && prod.price > prod.salePrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          ${Number(prod.price).toFixed(2)}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        {prod.type.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ─ 2. Recent Articles & Guides ─ */}
      {recentPosts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Recent Guides &amp; News</span>
            </div>
            <Link
              href="/blog"
              className="text-xs text-primary hover:underline font-semibold flex items-center"
            >
              All Articles <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block"
              >
                {post.category && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-0.5">
                    {post.category.name}
                  </span>
                )}
                <p className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {post.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
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
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─ 3. Featured Masterclasses & Courses ─ */}
      {featuredCourses.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Featured Courses
            </span>
            <Link
              href="/courses"
              className="text-xs text-indigo-300 hover:text-white font-semibold"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {featuredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group block p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                    {course.level || "All Levels"}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400">
                    ${Number(course.price).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                  {course.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─ 4. 24/7 VIP Support & Community CTA ─ */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 text-center relative overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <p className="font-bold text-sm text-white mb-1">
          Need Setup Help or Custom Tools?
        </p>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Our team provides instant setup support, private proxy configurations, and automated account replacements 24/7.
        </p>
        <Link
          href="/chat"
          className="stylish-btn btn-emerald btn-sm w-full flex items-center justify-center gap-1.5 text-xs font-bold shadow-md shadow-emerald-500/20"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Live Support &amp; Chat</span>
        </Link>
      </div>
    </aside>
  );
}
