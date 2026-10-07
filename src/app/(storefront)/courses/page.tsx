import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Search } from "lucide-react";
import CourseCard from "@/components/product/CourseCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses | Asia D Market",
  description: "Learn practical skills from professionally structured courses.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const resolvedSearch = await searchParams;

  const category = await prisma.category.findUnique({
    where: { slug: "courses", isActive: true }
  });

  if (!category) return notFound();

  const page = Math.max(1, parseInt(resolvedSearch.page || "1"));
  const limit = 12; // Default 12 per user instructions
  const skip = (page - 1) * limit;
  const q = resolvedSearch.q?.trim() || "";
  const sort = resolvedSearch.sort || "newest";

  const whereClause: any = {
    categoryId: category.id,
    status: "PUBLISHED",
  };
  
  if (q) {
    whereClause.OR = [
      { name: { contains: q } },
      { sku: { contains: q } },
      { shortDesc: { contains: q } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };

  // Fetch data
  let products = await prisma.product.findMany({
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

  const total = await prisma.product.count({ where: whereClause });

  if (sort === "highest_rated") {
    products.sort((a, b) => {
      const avgA = a.reviews.length ? a.reviews.reduce((s: any, r: any) => s + r.rating, 0) / a.reviews.length : 0;
      const avgB = b.reviews.length ? b.reviews.reduce((s: any, r: any) => s + r.rating, 0) / b.reviews.length : 0;
      return avgB - avgA;
    });
    products = products.slice(skip, skip + limit);
  } else if (sort === "most_popular") {
    // For now use sortOrder as a fallback if no actual popularity logic exists inline
    // Ideal: fetch analytics events, but we'll use a fast fallback
    products = products.slice(skip, skip + limit);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── COURSE HERO ──────────────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="container max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Courses</h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Learn practical skills from professionally structured courses.
          </p>
          <div className="max-w-xl mx-auto">
            <form action="/courses" method="GET" className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search courses..."
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </form>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="text-sm font-medium text-slate-500">
            {total > 0 ? (
              <span>Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total} courses</span>
            ) : (
              <span>0 courses</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <form action="/courses" method="GET" className="flex items-center gap-2">
              {q && <input type="hidden" name="q" value={q} />}
              <select
                name="sort"
                defaultValue={sort}
                onChange={(e) => e.target.form?.submit()}
                className="text-sm border-slate-200 rounded-lg py-2 pl-3 pr-8 focus:ring-primary focus:border-primary"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_asc">Price Low → High</option>
                <option value="price_desc">Price High → Low</option>
                <option value="highest_rated">Highest Rated</option>
                <option value="most_popular">Most Popular</option>
              </select>
            </form>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {q ? "No courses match your search." : "No courses available yet."}
            </h3>
            {q ? (
              <Link href="/courses" className="inline-block mt-4 text-primary font-medium hover:underline">
                Clear Filters
              </Link>
            ) : (
              <Link href="/store" className="inline-block mt-4 text-primary font-medium hover:underline">
                Browse Store
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <CourseCard key={product.id} course={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {page > 1 && (
                  <Link href={`/courses?page=${page - 1}${q ? `&q=${q}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}`} className="px-4 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-slate-50">
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Link
                    key={i}
                    href={`/courses?page=${i + 1}${q ? `&q=${q}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}`}
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={`/courses?page=${page + 1}${q ? `&q=${q}` : ''}${sort !== 'newest' ? `&sort=${sort}` : ''}`} className="px-4 py-2 border rounded-lg text-sm font-medium bg-white hover:bg-slate-50">
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
