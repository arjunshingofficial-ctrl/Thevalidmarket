import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, Clock, Award, CheckCircle2, ShieldCheck, 
  Star, Users, ChevronRight, Zap, PlayCircle, Lock,
  Globe, Sparkles, MessageCircle, ArrowLeft, Layers
} from "lucide-react";
import AddToCartButton from "@/app/(storefront)/product/[slug]/AddToCartButton";
import { formatUsd } from "@/lib/currency";
import { normalizeImageUrl } from "@/lib/storage/client";
import { optimizeDescriptionHtml } from "@/lib/utils/html";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product || product.status !== "PUBLISHED") {
    return { title: "Course Not Found - Asia D Market" };
  }

  const metadata = (() => {
    try {
      return product.metadata ? JSON.parse(product.metadata) : {};
    } catch {
      return {};
    }
  })();

  const image = metadata.image || null;

  return {
    title: `${product.name} | Asia D Market Academy`,
    description: product.shortDesc || "Master advanced skills with this technical masterclass from Asia D Market.",
    openGraph: {
      title: `${product.name} | Asia D Market Academy`,
      description: product.shortDesc || undefined,
      images: image ? [{ url: normalizeImageUrl(image) }] : undefined,
    },
  };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                orderBy: { sortOrder: "asc" },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!product || product.status !== "PUBLISHED") {
    notFound();
  }

  const metadata = (() => {
    try {
      return product.metadata ? JSON.parse(product.metadata) : {};
    } catch {
      return {};
    }
  })();

  const image = metadata.image || product.course?.thumbnailUrl || null;
  const instructor = product.course?.instructor || metadata.instructor || "Instructor";
  const skillLevel = metadata.skillLevel || "All Skill Levels";
  const language = metadata.language || "English & Global Access";
  const courseBadge = metadata.badge || "Online Course";

  const rawHighlights = metadata.highlights;
  const highlights: string[] = Array.isArray(rawHighlights) && rawHighlights.length > 0
    ? rawHighlights
    : (typeof rawHighlights === "string" && rawHighlights.trim()
        ? rawHighlights.split("\n").map((s: string) => s.trim()).filter(Boolean)
        : []);

  const modules = product.course?.modules || [];
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const totalMinutes = modules.reduce(
    (acc, m) => acc + (m.lessons?.reduce((lAcc, l) => lAcc + (l.duration || 15), 0) || 0),
    0
  );

  const price = product.salePrice ?? product.price;
  const isSale = product.salePrice !== null && product.salePrice < product.price;

  // Reviews calculation
  const reviewsCount = product.reviews.length;
  const avgRating = reviewsCount > 0
    ? (product.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1)
    : "5.0";

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* ─ Top Hero Banner ─ */}
      <section className="bg-slate-950 text-white relative overflow-hidden border-b border-slate-800">
        {/* Ambient Gradient Glow */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-[400px] h-[200px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 truncate">{product.name}</span>
          </nav>

          <div className="max-w-3xl">
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="text-[11px] font-extrabold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{courseBadge}</span>
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Instant Auto-Dispatch</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {skillLevel}
              </span>
            </div>

            {/* Title & Excerpt */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              {product.name}
            </h1>

            {product.shortDesc && (
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6 font-medium">
                {product.shortDesc}
              </p>
            )}

            {/* Metrics Row */}
            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300 pt-2 border-t border-slate-800">
              {reviewsCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    {[...Array(Math.min(5, Math.round(Number(avgRating))))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="font-extrabold text-white">{avgRating}</span>
                  <span className="text-slate-400">({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>New Course</span>
                </div>
              )}

              {totalLessons > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{totalLessons} {totalLessons === 1 ? "Lesson" : "Lessons"}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>Instructor: <strong className="text-white">{instructor}</strong></span>
              </div>

              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>{language}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─ Main Body Content Grid ─ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ══ LEFT: Course Syllabus & Overview (8 cols) ══ */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* What You'll Learn Highlights Card (Only shown if custom highlights configured) */}
            {highlights.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>What You Will Master in This Course</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Curriculum & Syllabus Accordion (Only shown if modules configured) */}
            {modules.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      <span>Course Curriculum</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {modules.length} {modules.length === 1 ? "Module" : "Modules"} • {totalLessons} {totalLessons === 1 ? "Lesson" : "Lessons"}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Self-Paced Learning
                  </span>
                </div>

                <div className="space-y-4">
                  {modules.map((mod, idx) => (
                    <div key={mod.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
                      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-900">{mod.title}</h3>
                        </div>
                        <span className="text-xs text-slate-400">{mod.lessons.length} lessons</span>
                      </div>

                      {mod.lessons.length > 0 && (
                        <div className="p-3 divide-y divide-slate-100 space-y-1">
                          {mod.lessons.map((lesson) => (
                            <div key={lesson.id} className="py-2 px-2 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-slate-700">
                                <PlayCircle className="w-3.5 h-3.5 text-primary" />
                                <span className="font-semibold">{lesson.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.isFree ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    Free Preview
                                  </span>
                                ) : (
                                  <Lock className="w-3 h-3 text-slate-300" />
                                )}
                                {lesson.duration && (
                                  <span className="text-slate-400">{lesson.duration}m</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Detailed Description */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">
                Full Course Description
              </h2>

              <div
                className="product-description text-slate-700 text-sm sm:text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: optimizeDescriptionHtml(product.description) }}
              />
            </div>

            {/* Student Reviews & Rating */}
            {product.reviews.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center justify-between">
                  <span>Student Feedback &amp; Reviews</span>
                  <span className="text-xs text-slate-400">{product.reviews.length} Verified Reviews</span>
                </h2>

                <div className="space-y-4">
                  {product.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{rev.user?.name || "Student"}</span>
                          <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded">Verified Student</span>
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment || rev.title || "Great course!"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ══ RIGHT: Sticky Purchase & Enrollment Card (4 cols) ══ */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-lg shadow-slate-200/50">
                {/* Course Preview Thumbnail */}
                <div className="relative w-full aspect-video bg-slate-900 overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
                  {image ? (
                    <Image
                      src={normalizeImageUrl(image)}
                      alt={product.name}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 420px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <BookOpen className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/90 text-white px-2.5 py-1 rounded-lg backdrop-blur-md">
                    {courseBadge || "Full Video Course"}
                  </span>
                </div>

                <div className="p-6 sm:p-7">
                  {/* Pricing Box */}
                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {formatUsd(price)}
                    </span>
                    {isSale && product.salePrice && (
                      <span className="text-base text-slate-400 line-through font-semibold">
                        {formatUsd(product.price)}
                      </span>
                    )}
                    {isSale && (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Limited Sale
                      </span>
                    )}
                  </div>

                  {/* Add to Cart & Checkout Action */}
                  <div className="space-y-3 mb-6 transform transition-transform active:scale-[0.98]">
                    <AddToCartButton product={product} />
                  </div>

                  {/* Inclusions List */}
                  <div className="space-y-3 pt-6 border-t border-slate-100 text-xs text-slate-600">
                    <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                      This Course Includes:
                    </h4>

                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant Access via Student Dashboard</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Lifetime Access to all lessons &amp; slides</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Certificate of Completion</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span>Access on Mobile, Tablet &amp; Desktop</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <MessageCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Direct 24/7 VIP Setup Support</span>
                    </div>
                  </div>

                  {/* Guarantee Box */}
                  <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-900">100% Satisfaction Guarantee</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Automated replacement guarantee and responsive technical mentoring.
                    </p>
                  </div>

                </div>
              </div>

              {/* Need help assistance card */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 text-center border border-slate-800">
                <h4 className="font-bold text-sm text-white mb-1">
                  Have Pre-Enrollment Questions?
                </h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Chat directly with our technical support team to verify course curriculum, labs, and system compatibility.
                </p>
                <Link
                  href="/chat"
                  className="stylish-btn btn-emerald btn-xs w-full flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Ask in VIP Live Chat</span>
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
