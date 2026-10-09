import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Check, Shield, Download, ShieldCheck, ChevronRight, Zap, TrendingUp, SlidersHorizontal, BookOpen } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import ProductGallery from "@/components/product/ProductGallery";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewAvatar } from "@/components/reviews/ReviewAvatar";
import { trackProductView } from "@/lib/analytics";

import { unstable_cache } from "next/cache";

const getCachedProduct = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        course: {
          include: {
            modules: {
              orderBy: { sortOrder: "asc" },
              include: {
                lessons: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });
  },
  ["product-detail"],
  { revalidate: 300, tags: ["products"] }
);

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions) as any;
  const isAdmin = session?.user?.role === "SUPER_ADMIN";
  
  const t0 = performance.now();
  const product = await getCachedProduct(slug);
  const t1 = performance.now();
  console.log(`[Perf] /product/[slug] product query took ${(t1 - t0).toFixed(2)}ms`);

  if (!product || (product.status !== "PUBLISHED" && !isAdmin)) {
    notFound();
  }

  const t2 = performance.now();
  const reviews = await prisma.review.findMany({
    where: { 
      productId: product.id,
      status: "APPROVED" 
    },
    include: {
      user: {
        select: { name: true, image: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
  const t3 = performance.now();
  console.log(`[Perf] /product/[slug] reviews query took ${(t3 - t2).toFixed(2)}ms`);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "0.0";

  const metadata = product.metadata ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata) : {};
  const image = metadata.image || null;
  const badge = metadata.badge || null;
  const specs = metadata.specs || null;

  // Track product view safely
  await trackProductView(product.id, session?.user?.id);

  const price = product.salePrice ?? product.price;
  const isSale = product.salePrice !== null && product.salePrice < product.price;
  const discountAmount = isSale ? (product.price - product.salePrice!).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Dynamic Hero Section */}
      <div className="bg-white border-b border-slate-200/60 pb-16 pt-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-r from-primary/10 to-purple-500/10 blur-[100px] rounded-full opacity-50 pointer-events-none" />

        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center text-xs font-medium text-slate-500 mb-10">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 mx-1.5 opacity-50" />
            <Link href="/store" className="hover:text-primary transition-colors">Store</Link>
            <ChevronRight className="h-3.5 w-3.5 mx-1.5 opacity-50" />
            {product.category && (
              <>
                <Link href={`/store?category=${product.category.slug}`} className="hover:text-primary transition-colors uppercase tracking-wider">{product.category.name}</Link>
                <ChevronRight className="h-3.5 w-3.5 mx-1.5 opacity-50" />
              </>
            )}
            <span className="text-slate-900 line-clamp-1">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-12 xl:gap-16 items-start">
            
            {/* Left: Product Gallery */}
            <div className="space-y-6">
              <div className="p-2 bg-white rounded-3xl shadow-sm border border-slate-100 relative">
                 {badge && (
                  <div className="absolute top-6 left-6 z-10 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-md shadow-lg shadow-primary/30 tracking-widest uppercase">
                    {badge}
                  </div>
                )}
                <ProductGallery image={image} gallery={metadata.gallery || []} productName={product.name} />
              </div>
            </div>

            {/* Right: Floating Buy Box */}
            <div className="sticky top-28 bg-white rounded-3xl p-8 lg:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col relative z-20">
              
              <div className="flex items-center justify-between mb-4">
                {product.category && (
                  <div className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                    {product.category.name}
                  </div>
                )}
                <div className="flex items-center text-amber-500 font-bold text-sm bg-amber-50 px-2.5 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-amber-500 mr-1" />
                  {reviews.length > 0 ? avgRating : "New"}
                  <span className="text-slate-400 font-medium ml-1 text-xs">
                    ({reviews.length})
                  </span>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 leading-[1.1]">{product.name}</h1>
              
              <p className="text-slate-500 mb-8 text-base leading-relaxed">
                {product.shortDesc || "Elevate your workflow with this premium digital asset."}
              </p>

              <div className="flex items-end gap-4 mb-8 pb-8 border-b border-slate-100">
                <div className="flex flex-col">
                  {isSale && (
                    <span className="text-lg text-slate-400 line-through decoration-slate-300 font-semibold mb-1">${product.price.toFixed(2)}</span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">
                      ${price.toFixed(2)}
                    </span>
                    {metadata.billing && <span className="text-slate-500 font-medium">{metadata.billing}</span>}
                  </div>
                </div>
                {isSale && (
                  <div className="flex items-center gap-1 text-sm font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md mb-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Save ${discountAmount}
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-8 transform transition-transform active:scale-[0.98]">
                <AddToCartButton product={product} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Zap className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Instant</div>
                    <div className="text-xs text-slate-500 font-medium">Digital Access</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Secure</div>
                    <div className="text-xs text-slate-500 font-medium">256-bit Encrypted</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      {/* Details Sections below the fold */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl py-16">
        <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-12 xl:gap-16">
          
          <div className="space-y-16">
            
            {/* Specs (if available like for RDP) */}
            {specs && (
              <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200/60">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                  <SlidersHorizontal className="w-6 h-6 text-primary" /> Technical Specifications
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {Object.entries(specs).map(([key, value]) => {
                     if (key === 'desc') return null; // Skip desc from specs
                     return (
                       <div key={key} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{key}</div>
                         <div className="font-semibold text-slate-800 text-sm">{value as React.ReactNode}</div>
                       </div>
                     );
                   })}
                </div>
              </div>
            )}

            {/* Description Tab */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200/60">
              <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-primary" /> Product Overview
              </h2>
              <div 
                className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-2xl"
                dangerouslySetInnerHTML={{ __html: product.description || "<p>No description provided.</p>" }}
              />
            </div>

            {/* Course Section */}
            {product.course && product.course.modules.length > 0 && (
              <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200/60">
                <div className="border-b border-slate-100 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Curriculum & Syllabus</h2>
                    <p className="text-sm text-slate-500 mt-1.5 font-medium">
                      Instructor: <span className="font-bold text-slate-800">{product.course.instructor || "Lead Instructor"}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/5 px-4 py-2 rounded-lg border border-primary/10">
                    {product.course.modules.length} Modules • {product.course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons
                  </div>
                </div>

                <div className="space-y-4">
                  {product.course.modules.map((mod, modIdx) => (
                    <div key={mod.id} className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white shadow-sm hover:border-slate-300 transition-colors">
                      <div className="p-5 bg-slate-50 border-b border-slate-100 font-bold text-slate-900 flex justify-between items-center">
                        <span className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-primary shadow-sm border border-slate-100 text-xs">{modIdx + 1}</span>
                          {mod.title}
                        </span>
                        <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-full font-medium border border-slate-100">{mod.lessons.length} lessons</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {mod.lessons.map((lesson, lessonIdx) => (
                          <div key={lesson.id} className="p-4 px-6 flex items-center justify-between text-sm group hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-300 font-mono text-xs w-6">{modIdx + 1}.{lessonIdx + 1}</span>
                              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{lesson.title}</span>
                              {lesson.isFree && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                                  FREE PREVIEW
                                </span>
                              )}
                            </div>
                            {lesson.duration && lesson.duration > 0 ? (
                              <span className="text-slate-400 text-xs font-medium bg-slate-100 px-2 py-1 rounded">{lesson.duration}m</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-slate-200/60" id="reviews">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Verified Reviews</h2>
              </div>
              
              <div className="grid md:grid-cols-[240px_1fr] gap-12">
                {/* Reviews Summary */}
                <div className="space-y-6">
                  <div className="text-center md:text-left">
                    {reviews.length > 0 ? (
                      <>
                        <div className="text-6xl font-black text-slate-900 tracking-tighter mb-2">{avgRating}</div>
                        <div className="flex items-center justify-center md:justify-start gap-1 my-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-5 h-5 ${parseFloat(avgRating) >= star ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"}`} />
                          ))}
                        </div>
                        <p className="text-slate-500 font-medium text-sm">Based on {reviews.length} reviews</p>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter mb-3">0.0</div>
                        <p className="text-slate-500 font-medium text-sm">Be the first to review.</p>
                      </>
                    )}
                  </div>

                  {reviews.length > 0 && (
                    <div className="space-y-2.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter(r => r.rating === star).length;
                        const percent = Math.round((count / reviews.length) * 100);
                        return (
                          <div key={star} className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1 w-8 shrink-0 text-slate-600 font-bold">
                              {star} <Star className="w-3 h-3 fill-slate-400 text-slate-400" />
                            </div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} />
                            </div>
                            <div className="w-8 shrink-0 text-right text-slate-500 font-medium">{percent}%</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Review List */}
                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Star className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <h3 className="text-lg font-bold text-slate-900">No reviews yet</h3>
                      <p className="text-slate-500 mt-2 mb-6 font-medium max-w-xs mx-auto">Purchase this product to leave a verified review and share your experience.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {reviews.map(review => {
                        const name = review.user.name || "Customer";
                        return (
                          <div key={review.id} className="py-8 first:pt-0 last:pb-0">
                            <div className="flex justify-between items-start mb-5">
                              <div className="flex items-center gap-4">
                                <ReviewAvatar 
                                  seed={review.avatarSeed} 
                                  name={name} 
                                  size={48} 
                                  fallbackImageUrl={review.user.image} 
                                />
                                <div>
                                  <div className="font-bold text-slate-900">{name}</div>
                                  <div className="flex items-center gap-2 mt-1 text-[11px] font-bold tracking-wide uppercase">
                                    {review.type === "ADMIN_TESTIMONIAL" ? (
                                      <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Admin Testimonial</span>
                                    ) : review.verifiedPurchase ? (
                                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Verified
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Customer</span>
                                    )}
                                    <span className="text-slate-400 normal-case tracking-normal font-medium">
                                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                                        month: "long", year: "numeric"
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-0.5 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-3.5 h-3.5 ${review.rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-100"}`} />
                                ))}
                              </div>
                            </div>
                            
                            {review.title && (
                              <h4 className="font-bold text-slate-900 mb-2 text-lg">{review.title}</h4>
                            )}
                            <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
          
          {/* Right Sidebar Below Fold */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-[50px]" />
              <Shield className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">100% Secure Checkout</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
                Your purchase is protected by 256-bit military grade encryption. We never store your payment data.
              </p>
              <div className="flex gap-2">
                <div className="w-12 h-7 bg-white/10 rounded flex items-center justify-center text-[9px] font-bold">VISA</div>
                <div className="w-12 h-7 bg-white/10 rounded flex items-center justify-center text-[9px] font-bold">MC</div>
                <div className="w-12 h-7 bg-white/10 rounded flex items-center justify-center text-[9px] font-bold">AMEX</div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Need help?</h3>
              <p className="text-slate-500 text-sm mb-5 font-medium">Our dedicated support team is available 24/7 to help you.</p>
              <Link href="/contact" className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm font-bold border border-slate-200 hover:bg-slate-100 transition-colors">
                Contact Support
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
