import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminSEO() {
  // Find items missing SEO metadata
  const productsMissingSEO = await prisma.product.count({ where: { status: "PUBLISHED", AND: [{ metadata: null }] } });
  const productsTotal = await prisma.product.count({ where: { status: "PUBLISHED" } });
  const categoriesMissingSEO = await prisma.category.count({ where: { isActive: true, seoTitle: null } });
  const categoriesTotal = await prisma.category.count({ where: { isActive: true } });
  const blogsMissingSEO = await prisma.blogPost.count({ where: { status: "PUBLISHED", seoTitle: null } });
  const blogsTotal = await prisma.blogPost.count({ where: { status: "PUBLISHED" } });
  const pagesMissingSEO = await prisma.page.count({ where: { status: "PUBLISHED", seoTitle: null } });
  const pagesTotal = await prisma.page.count({ where: { status: "PUBLISHED" } });

  const checks = [
    { label: "Products missing SEO", missing: productsMissingSEO, total: productsTotal, href: "/admin/products" },
    { label: "Categories missing SEO", missing: categoriesMissingSEO, total: categoriesTotal, href: "/admin/categories" },
    { label: "Blog posts missing SEO", missing: blogsMissingSEO, total: blogsTotal, href: "/admin/blog" },
    { label: "Pages missing SEO", missing: pagesMissingSEO, total: pagesTotal, href: "/admin/pages" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">SEO Dashboard</h1>
        <p className="text-slate-500 mt-1">Monitor SEO coverage across your store.</p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Global SEO", href: "/admin/settings/seo" },
          { label: "Redirects", href: "/admin/settings/redirects" },
          { label: "Sitemap", href: "/sitemap.xml", external: true },
          { label: "Robots.txt", href: "/robots.txt", external: true },
        ].map(link => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            className="bg-white border rounded-lg p-4 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-primary/30 transition-colors shadow-sm"
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* SEO health check */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-lg text-slate-900">SEO Health Check</h2>
          <p className="text-sm text-slate-500 mt-0.5">Items missing SEO metadata that should be filled in.</p>
        </div>
        <div className="divide-y">
          {checks.map((check) => {
            const pct = check.total > 0 ? Math.round(((check.total - check.missing) / check.total) * 100) : 100;
            const isGood = check.missing === 0;
            return (
              <div key={check.label} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {!isGood && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    <span className="font-medium text-slate-900">{check.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isGood ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}`}>
                      {isGood ? "✓ All covered" : `${check.missing} missing`}
                    </span>
                    <Link href={check.href} className="text-xs text-primary hover:underline">Fix →</Link>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isGood ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400 mt-1">{check.total - check.missing} / {check.total} covered ({pct}%)</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
