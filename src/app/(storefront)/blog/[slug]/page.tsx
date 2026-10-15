import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, Calendar, Clock, Tag, 
  CheckCircle2, ShieldCheck, Eye 
} from "lucide-react";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogCommentsSection from "@/components/blog/BlogCommentsSection";
import BlogShareButton from "@/components/blog/BlogShareButton";
import { normalizeImageUrl } from "@/lib/storage/client";
import { optimizeDescriptionHtml } from "@/lib/utils/html";
import { getBaseUrl } from "@/lib/siteUrl";

export const revalidate = 300; // Cache on Vercel CDN for 5 minutes, background revalidate

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  
  if (!post || post.status !== "PUBLISHED") {
    return { title: "Post Not Found - The Valid Market" };
  }

  let keywords: string[] = [];
  if (post.focusKeyword) keywords.push(post.focusKeyword);
  if (post.secondaryKeywords) {
    try {
      const parsed = JSON.parse(post.secondaryKeywords);
      if (Array.isArray(parsed)) keywords.push(...parsed);
      else if (typeof parsed === "string") keywords.push(parsed);
    } catch {
      keywords.push(...post.secondaryKeywords.split(",").map((k: string) => k.trim()).filter(Boolean));
    }
  }
  if (post.tags) {
    try {
      const parsed = JSON.parse(post.tags);
      if (Array.isArray(parsed)) keywords.push(...parsed);
      else if (typeof parsed === "string") keywords.push(parsed);
    } catch {
      keywords.push(...post.tags.split(",").map((t: string) => t.trim()).filter(Boolean));
    }
  }
  keywords = Array.from(new Set(keywords.map(k => k.trim()).filter(Boolean)));

  return {
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: post.canonicalUrl || `/blog/${post.slug}`,
    },
    robots: post.robots || "index, follow",
    openGraph: {
      title: post.ogTitle || post.seoTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt || undefined,
      images: post.ogImage || post.featuredImage ? [{ url: (post.ogImage || post.featuredImage) as string }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.ogTitle || post.seoTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt || undefined,
      images: post.ogImage || post.featuredImage ? [(post.ogImage || post.featuredImage) as string] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 1. Fetch current post
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      category: true,
      comments: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          authorName: true,
          content: true,
          createdAt: true,
        },
      },
    },
  }).catch(async (err) => {
    console.error("Error fetching post with comments:", err);
    // Fallback without comments relation if model migration isn't recognized
    return prisma.blogPost.findUnique({
      where: { slug },
      include: { category: true },
    });
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  // Non-blockingly increment view counter
  prisma.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  }).catch((err) => console.error("Error updating blog view count:", err));

  // 2. Fetch Recent Posts with safe fallback
  let recentPosts: any[] = [];
  try {
    recentPosts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        NOT: { id: post.id },
      },
      orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        publishDate: true,
        createdAt: true,
        category: { select: { name: true, slug: true } },
      },
    });
  } catch (err) {
    console.error("Error fetching recent blog posts:", err);
  }

  // 3. Fetch Popular Tools & Products with safe fallback
  let popularProducts: any[] = [];
  try {
    popularProducts = await prisma.product.findMany({
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
  } catch (err) {
    console.error("Error fetching popular products:", err);
  }

  // 4. Fetch Featured Courses with safe fallback
  let featuredCourses: any[] = [];
  try {
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

    featuredCourses = coursesRaw
      .filter((c) => c && c.product)
      .map((c) => ({
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
  } catch (err) {
    console.error("Error fetching featured courses:", err);
  }

  // Calculate reading time
  const wordCount = post.content ? post.content.replace(/<[^>]+>/g, "").split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Parse tags
  let parsedTags: string[] = [];
  if (post.tags) {
    try {
      const parsed = JSON.parse(post.tags);
      parsedTags = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      parsedTags = post.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
  }

  const approvedComments = (post as any).comments || [];

  const siteUrl = getBaseUrl();
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const postImage = post.ogImage || post.featuredImage
    ? normalizeImageUrl((post.ogImage || post.featuredImage)!)
    : `${siteUrl}/og-image.jpg`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl,
    },
    "headline": post.seoTitle || post.title,
    "description": post.metaDescription || post.excerpt || "",
    "image": [postImage],
    "datePublished": post.publishDate ? new Date(post.publishDate).toISOString() : new Date(post.createdAt).toISOString(),
    "dateModified": new Date(post.updatedAt).toISOString(),
    "author": {
      "@type": "Organization",
      "name": "The Valid Market Editorial Team",
      "url": siteUrl,
    },
    "publisher": {
      "@type": "Organization",
      "name": "The Valid Market",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`,
      },
    },
    "keywords": parsedTags.join(", "),
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 sm:py-14">
      {/* Schema.org BlogPosting Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ─ Breadcrumbs & Navigation ─ */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All Articles</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Updated</span>
            <span className="font-semibold text-slate-700">
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
        </div>

        {/* ─ Main Layout Grid ─ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ══ Article Main Column (lg:col-span-8) ══ */}
          <article className="lg:col-span-8 space-y-8">
            
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
              {/* Category & Read Time */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {post.category && (
                  <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    {post.category.name}
                  </span>
                )}
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{readingTime} min read</span>
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {post.publishDate
                      ? new Date(post.publishDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : new Date(post.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                  </span>
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{((post.views || 0) + 1).toLocaleString()} views</span>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                {post.title}
              </h1>

              {/* Author & Editorial Badge */}
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-100 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-indigo-700 text-white font-extrabold flex items-center justify-center shadow-sm">
                    ADM
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900">The Valid Market Research</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-400">Verified Technical Editorial Team</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BlogShareButton title={post.title} />
                </div>
              </div>

              {/* Featured Image - Optimized with Next.js Image */}
              {post.featuredImage && (
                <div 
                  className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 w-full aspect-video relative bg-slate-100"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  <Image
                    src={normalizeImageUrl(post.featuredImage)}
                    alt={(post as any).featuredImageAlt || `${post.title} - The Valid Market`}
                    fill
                    priority
                    quality={75}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 860px"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Excerpt callout if present */}
              {post.excerpt && (
                <div className="p-5 rounded-2xl bg-slate-50 border-l-4 border-primary text-slate-700 text-base italic leading-relaxed mb-8">
                  &ldquo;{post.excerpt}&rdquo;
                </div>
              )}

              {/* Article HTML Content */}
              <div
                className="product-description text-slate-800 leading-relaxed text-base"
                dangerouslySetInnerHTML={{ __html: optimizeDescriptionHtml(post.content, (post as any).featuredImageAlt || post.title) }}
              />

              {/* Article Tags */}
              {parsedTags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                    <Tag className="w-3.5 h-3.5" /> Tags:
                  </span>
                  {parsedTags.map((tag: string) => (
                    <span
                      key={tag}
                      className="bg-slate-100 hover:bg-primary/10 hover:text-primary transition-colors text-slate-700 px-3 py-1 rounded-full text-xs font-semibold border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Editorial Guarantee Footnote */}
              <div className="mt-10 p-5 rounded-2xl bg-slate-900 text-white flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-white mb-0.5">Verified Knowledge Base Guarantee</p>
                  <p className="text-slate-400">
                    All guides, scripts, and product configurations on The Valid Market are tested for safety, zero backdoors, and maximum performance.
                  </p>
                </div>
              </div>
            </div>

            {/* ─ Comments Section Component ─ */}
            <BlogCommentsSection
              postId={post.id}
              initialComments={approvedComments}
            />
          </article>

          {/* ══ Sidebar Column (lg:col-span-4) ══ */}
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
