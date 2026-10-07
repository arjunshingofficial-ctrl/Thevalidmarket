import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  
  if (!post || post.status !== "PUBLISHED") {
    return { title: "Post Not Found" };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.metaDescription || post.excerpt,
    alternates: {
      canonical: post.canonicalUrl || `/blog/${post.slug}`
    },
    robots: post.robots || "index, follow",
    openGraph: {
      title: post.ogTitle || post.seoTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt || undefined,
      images: post.ogImage || post.featuredImage ? [{ url: (post.ogImage || post.featuredImage) as string }] : undefined
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { category: true }
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="min-h-screen py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to blog
          </Link>
        </div>

        <header className="mb-12 text-center">
          {post.category && (
            <span className="text-sm font-bold text-primary uppercase tracking-widest mb-4 block">
              {post.category.name}
            </span>
          )}
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            {post.title}
          </h1>
          <div className="text-slate-500 flex items-center justify-center gap-4 text-sm">
            <span>By Admin</span>
            <span>&bull;</span>
            <time dateTime={post.publishDate?.toISOString() || post.createdAt.toISOString()}>
              {post.publishDate ? new Date(post.publishDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>
        </header>

        {post.featuredImage && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border border-slate-100 aspect-video relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.featuredImage} alt={post.title} className="object-cover w-full h-full" />
          </div>
        )}

        <div 
          className="prose prose-slate prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        
        {post.tags && (
          <div className="mt-12 pt-8 border-t flex flex-wrap gap-2">
            {JSON.parse(post.tags).map((tag: string) => (
              <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
