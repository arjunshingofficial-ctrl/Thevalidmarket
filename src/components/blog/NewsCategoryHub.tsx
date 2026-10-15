import Link from "next/link";
import Image from "next/image";
import { 
  Newspaper, Clock, ArrowRight, Eye, Tag, Search, 
  FolderKanban, Sparkles, ChevronRight, X, Filter,
  Calendar, BookOpen, Layers, CheckCircle2
} from "lucide-react";
import { normalizeImageUrl } from "@/lib/storage/client";
import BlogSidebar, { SidebarCategory } from "./BlogSidebar";

export interface HubPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featuredImage?: string | null;
  publishDate?: Date | string | null;
  createdAt: Date | string;
  views?: number | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface HubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  postCount?: number;
}

interface NewsCategoryHubProps {
  posts: HubPost[];
  categories: HubCategory[];
  activeCategory: HubCategory | null;
  searchQuery?: string;
  currentSort?: string;
  basePath?: string; // "/news" or "/blog"
  popularProducts: any[];
  featuredCourses: any[];
  recentPosts: any[];
}

export default function NewsCategoryHub({
  posts,
  categories,
  activeCategory,
  searchQuery = "",
  currentSort = "newest",
  basePath = "/news",
  popularProducts,
  featuredCourses,
  recentPosts,
}: NewsCategoryHubProps) {
  const totalPostsCount = categories.reduce((sum, c) => sum + (c.postCount || 0), 0);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thevalidmarket.com").replace(/\/$/, "");

  // Build JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": activeCategory ? (activeCategory.seoTitle || `${activeCategory.name} News & Guides`) : "News, Insights & Technical Guides",
    "description": activeCategory
      ? (activeCategory.seoDescription || activeCategory.description || `Browse expert articles and news on ${activeCategory.name}.`)
      : "Official technical news, proxy configurations, security analyses, and tutorials from Asia D Market.",
    "url": activeCategory ? `${siteUrl}${basePath}?category=${activeCategory.slug}` : `${siteUrl}${basePath}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": posts.length,
      "itemListElement": posts.map((post, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "url": `${siteUrl}/blog/${post.slug}`,
        "name": post.title,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "News",
        "item": `${siteUrl}${basePath}`,
      },
      ...(activeCategory
        ? [
            {
              "@type": "ListItem",
              "position": 3,
              "name": activeCategory.name,
              "item": `${siteUrl}${basePath}?category=${activeCategory.slug}`,
            },
          ]
        : []),
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 sm:py-12">
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ─ Breadcrumb Navigation ─ */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href={basePath} className={!activeCategory ? "text-slate-900 font-bold" : "hover:text-primary transition-colors"}>
            News &amp; Guides
          </Link>
          {activeCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-primary font-bold">{activeCategory.name}</span>
            </>
          )}
        </nav>

        {/* ─ Hero Header Banner ─ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 mb-10 shadow-xl border border-slate-800">
          {/* Subtle Background Glow Elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-300 border border-white/15 text-xs font-extrabold uppercase tracking-widest mb-4">
              {activeCategory ? (
                <>
                  <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
                  <span>Topic Category</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Asia D Market Hub</span>
                </>
              )}
            </div>

            {/* H1 Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-4">
              {activeCategory ? (
                activeCategory.seoTitle || activeCategory.name
              ) : (
                "News, Insights & Guides"
              )}
            </h1>

            {/* Subtitle / Description */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed mb-6 font-normal">
              {activeCategory
                ? activeCategory.seoDescription || activeCategory.description || `Explore verified guides, practical workflows, proxy setups, and technical developments in ${activeCategory.name}.`
                : "Expert software deployment guides, private proxy configurations, security analyses, and official platform announcements."}
            </p>

            {/* Active Meta Badges */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-white font-bold border border-white/10">
                <Newspaper className="w-3.5 h-3.5 text-primary-300" />
                {posts.length} {posts.length === 1 ? "Article" : "Articles"}
              </span>

              {activeCategory && (
                <Link
                  href={basePath}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold border border-white/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  Clear Category Filter
                </Link>
              )}

              {searchQuery && (
                <Link
                  href={activeCategory ? `${basePath}?category=${activeCategory.slug}` : basePath}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Search: &ldquo;{searchQuery}&rdquo;
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ─ Category Switcher Pills Bar ─ */}
        <div className="mb-8">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
              <Layers className="w-4 h-4 text-primary" />
              <span>Explore by Topic</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {categories.length} {categories.length === 1 ? "Category" : "Categories"} Available
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {/* "All Topics" Pill */}
            <Link
              href={basePath}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                !activeCategory
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-[1.02]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>All Topics</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  !activeCategory ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {totalPostsCount || posts.length}
              </span>
            </Link>

            {/* Individual Category Pills */}
            {categories.map((cat) => {
              const isSelected = activeCategory?.slug === cat.slug;
              return (
                <Link
                  key={cat.id}
                  href={`${basePath}?category=${cat.slug}`}
                  className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm shadow-primary/20 scale-[1.02]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.postCount !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
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

        {/* ─ Search & Filter Controls ─ */}
        <div className="mb-8 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <form action={basePath} method="GET" className="flex flex-col sm:flex-row gap-3">
            {/* Preserve category filter on search */}
            {activeCategory && (
              <input type="hidden" name="category" value={activeCategory.slug} />
            )}

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder={activeCategory ? `Search in ${activeCategory.name}...` : "Search tutorials, guides, and tools..."}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Sort Select */}
            <div className="flex gap-2">
              <select
                name="sort"
                defaultValue={currentSort}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Viewed</option>
                <option value="oldest">Oldest First</option>
              </select>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>
          </form>
        </div>

        {/* ─ Main Content Grid with Sticky Sidebar ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Main Articles Column */}
          <div className="lg:col-span-8">
            {posts.length === 0 ? (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <FolderKanban className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {searchQuery ? `No articles matching "${searchQuery}"` : "No articles published yet"}
                </h3>
                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
                  {activeCategory
                    ? `We haven't published articles in the "${activeCategory.name}" topic yet. Check back soon or explore our other technical categories.`
                    : "Fresh technical guides and announcements are coming soon. Browse the store or check back later."}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {activeCategory && (
                    <Link
                      href={basePath}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs"
                    >
                      Browse All Topics
                    </Link>
                  )}
                  <Link
                    href="/store"
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Explore Digital Store
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {posts.map((post) => {
                  const wordCount = post.content ? post.content.replace(/<[^>]+>/g, "").split(/\s+/).length : 0;
                  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                  return (
                    <article
                      key={post.id}
                      className="group flex flex-col bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Thumbnail Container */}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="w-full bg-slate-100 relative overflow-hidden block"
                        style={{ aspectRatio: "16 / 9" }}
                      >
                        {post.featuredImage ? (
                          <Image
                            src={normalizeImageUrl(post.featuredImage)}
                            alt={post.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-100 font-bold text-xs uppercase tracking-widest">
                            No Cover Image
                          </div>
                        )}

                        {/* Category Floating Tag */}
                        {post.category && (
                          <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/85 backdrop-blur-md text-white px-3 py-1 rounded-lg shadow-xs">
                            {post.category.name}
                          </span>
                        )}
                      </Link>

                      {/* Content Container */}
                      <div className="p-6 flex flex-col flex-1">
                        {/* Meta Info */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {readingTime} min read
                          </span>
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
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium text-slate-500">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>{(post.views || 0).toLocaleString()}</span>
                          </span>
                        </div>

                        {/* Post Title */}
                        <h2 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2.5">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>

                        {/* Post Excerpt */}
                        <p className="text-slate-500 text-xs sm:text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
                          {post.excerpt || "Read this complete technical guide and breakdown from Asia D Market."}
                        </p>

                        {/* Footer Link */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                              A
                            </span>
                            <span className="text-xs font-bold text-slate-700">Team Admin</span>
                          </div>
                          
                          <Link
                            href={`/blog/${post.slug}`}
                            className="text-xs font-extrabold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1"
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
                categories={categories}
                activeCategorySlug={activeCategory?.slug}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
