import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Search, 
  GraduationCap, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Sparkles, 
  BookOpen, 
  Layers, 
  MessageCircle, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  SlidersHorizontal
} from "lucide-react";
import CourseCard from "@/components/product/CourseCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses & Masterclasses | Asia D Market",
  description: "Learn practical, industry-proven digital skills from verified experts. Instant dashboard access, step-by-step video curriculums, and lifetime mentorship.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; q?: string; sort?: string }> | { page?: string; q?: string; sort?: string };
}) {
  const resolvedSearch = (await searchParams) || {};
  const page = Math.max(1, parseInt(resolvedSearch?.page || "1", 10));
  const limit = 12;
  const skip = (page - 1) * limit;
  const q = resolvedSearch?.q?.trim() || "";
  const sort = resolvedSearch?.sort || "newest";

  let products: any[] = [];
  let total = 0;
  let category: any = null;

  try {
    category = await prisma.category.findUnique({
      where: { slug: "courses" }
    });

    const whereClause: any = {
      status: "PUBLISHED",
      OR: [
        { type: "COURSE" },
        ...(category ? [{ categoryId: category.id }] : []),
      ],
    };

    if (q) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { shortDesc: { contains: q, mode: "insensitive" } },
          ]
        }
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };

    products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        fieldValues: { include: { field: true } },
        reviews: { where: { status: "APPROVED" }, select: { rating: true } },
        course: { select: { thumbnailUrl: true, instructor: true } },
      },
      orderBy,
      skip: (sort === "highest_rated" || sort === "most_popular") ? 0 : skip,
      take: (sort === "highest_rated" || sort === "most_popular") ? 1000 : limit,
    });

    total = await prisma.product.count({ where: whereClause });

    if (sort === "highest_rated") {
      products.sort((a, b) => {
        const avgA = a.reviews?.length ? a.reviews.reduce((s: any, r: any) => s + r.rating, 0) / a.reviews.length : 0;
        const avgB = b.reviews?.length ? b.reviews.reduce((s: any, r: any) => s + r.rating, 0) / b.reviews.length : 0;
        return avgB - avgA;
      });
      products = products.slice(skip, skip + limit);
    } else if (sort === "most_popular") {
      products = products.slice(skip, skip + limit);
    }
  } catch (error) {
    console.error("CoursesPage query error:", error);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      
      {/* ── HERO BANNER ──────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 text-white relative overflow-hidden border-b border-slate-800">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-emerald-500/15 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[500px] h-[250px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-emerald-400 text-xs font-semibold backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Elite Digital Academy • Verified Practical Skills</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Explore Premium <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-primary">Courses</span> &amp; Masterclasses
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Master hands-on technical skills with structured video modules, authorized lab walk-throughs, and instant lifetime access.
            </p>

            {/* Search Box */}
            <div className="max-w-xl mx-auto pt-2">
              <form action="/courses" method="GET" className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search courses, frameworks, topics..."
                  className="w-full h-13 pl-12 pr-28 rounded-2xl bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 backdrop-blur-md transition-all text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-sm"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Value Highlights Pill Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-slate-300 font-medium">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Instant Enrollment</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Lifetime Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Verified Curriculum</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <span>24/7 VIP Support</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Filter & Sort Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200/80">
          
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-slate-900 text-lg tracking-tight">Available Courses</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {total} {total === 1 ? "Course" : "Courses"}
            </span>
            {q && (
              <span className="text-xs text-slate-500">
                matching &ldquo;<strong className="text-slate-800">{q}</strong>&rdquo;
              </span>
            )}
          </div>

          {/* Quick Sort Tabs & Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <form action="/courses" method="GET" className="flex items-center gap-2">
              {q && <input type="hidden" name="q" value={q} />}
              <div className="relative flex items-center">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <select
                  name="sort"
                  defaultValue={sort}
                  onChange={(e) => e.target.form?.submit()}
                  className="text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 focus:ring-2 focus:ring-primary/40 focus:border-primary/50 cursor-pointer shadow-2xs"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="price_asc">Sort: Price Low → High</option>
                  <option value="price_desc">Sort: Price High → Low</option>
                  <option value="highest_rated">Sort: Highest Rated</option>
                </select>
              </div>
            </form>

            {q && (
              <Link
                href="/courses"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
              >
                Clear Filter
              </Link>
            )}
          </div>

        </div>

        {/* Courses Listing Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
              {q ? "No courses match your query." : "No courses published yet."}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto">
              {q 
                ? "Try adjusting your search terms or view our complete catalog." 
                : "New technical masterclasses are currently being prepared. Check back shortly!"}
            </p>
            {q ? (
              <Link 
                href="/courses" 
                className="stylish-btn btn-emerald btn-sm inline-flex items-center gap-1.5"
              >
                <span>View All Courses</span>
              </Link>
            ) : (
              <Link 
                href="/store" 
                className="stylish-btn btn-primary btn-sm inline-flex items-center gap-1.5"
              >
                <span>Browse Digital Store</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {products.map((product: any) => (
                <CourseCard key={product.id} course={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-14">
                {page > 1 && (
                  <Link 
                    href={`/courses?page=${page - 1}${q ? `&q=${q}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}`} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Link
                    key={i}
                    href={`/courses?page=${i + 1}${q ? `&q=${q}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-2xs ${
                      page === i + 1 
                        ? 'bg-primary text-primary-foreground border border-primary shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link 
                    href={`/courses?page=${page + 1}${q ? `&q=${q}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}`} 
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* ── WHY LEARN WITH US TRUST SECTION ─────────────────────────────────── */}
        <section className="mt-20 pt-12 border-t border-slate-200/80">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Why Learn With Asia D Market?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Engineered for professionals seeking real practical execution over theoretical slides.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">Practical Lab Deployments</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Learn with authentic step-by-step video lessons and isolated sandbox environment setups designed for immediate application.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">Automated Instant Delivery</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                No waiting for manual approvals. As soon as your order completes, all video lectures and files unlock directly in your student dashboard.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">24/7 VIP Live Support</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect directly with technical mentoring for questions regarding installation, configuration, or course syllabus concepts.
              </p>
            </div>

          </div>
        </section>

        {/* ── PRE-ENROLLMENT VIP CHAT BANNER ─────────────────────────────────── */}
        <section className="mt-12 bg-slate-950 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left z-10">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Have questions about a course before enrolling?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Our technical staff is available around the clock to answer questions about course prerequisites, software requirements, or syllabus modules.
            </p>
          </div>
          <Link
            href="/chat"
            className="stylish-btn btn-emerald btn-sm shrink-0 flex items-center gap-2 font-bold text-xs sm:text-sm z-10"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat With Support Now</span>
          </Link>
          <div className="absolute right-0 bottom-0 w-80 h-40 bg-emerald-500/10 blur-[80px] pointer-events-none" />
        </section>

      </div>

    </div>
  );
}
