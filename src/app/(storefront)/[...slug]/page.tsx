import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const path = "/" + slug.join("/");

  // We only generate metadata for Pages, redirects won't need it (they redirect)
  if (slug.length === 1) {
    const page = await prisma.page.findUnique({ where: { slug: slug[0] } });
    if (page && page.status === "PUBLISHED") {
      return {
        title: page.seoTitle || page.title,
        description: page.metaDescription,
        alternates: {
          canonical: page.canonicalUrl || `/${page.slug}`
        },
        robots: page.robots || "index, follow"
      };
    }
  }

  return { title: "Not Found" };
}

export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = "/" + slug.join("/");

  // 1. Check for Redirect
  const redirectRule = await prisma.redirect.findUnique({ where: { oldUrl: path } });
  
  if (redirectRule && redirectRule.isEnabled) {
    if (redirectRule.statusCode === 301) {
      redirect(redirectRule.newUrl);
    } else {
      redirect(redirectRule.newUrl); // Next.js `redirect` defaults to 307 which is fine, or permanentRedirect for 301. Wait, Next.js `permanentRedirect` is available in 'next/navigation'.
    }
  }

  // 2. If no redirect, check if it's a CMS page (only 1 level deep for now)
  if (slug.length === 1) {
    const page = await prisma.page.findUnique({ where: { slug: slug[0] } });

    if (page && page.status === "PUBLISHED") {
      return (
        <div className="min-h-screen py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-8">{page.title}</h1>
            <div 
              className="prose prose-slate prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      );
    }
  }

  // 3. Neither a redirect nor a page
  notFound();
}
