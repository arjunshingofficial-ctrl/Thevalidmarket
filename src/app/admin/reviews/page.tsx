import { prisma } from "@/lib/prisma";
import { Star, Search, Plus } from "lucide-react";
import Link from "next/link";
import { ReviewActions } from "@/components/admin/ReviewActions";
import { ReviewAvatar } from "@/components/reviews/ReviewAvatar";

export const dynamic = "force-dynamic";

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;

  const reviews = await prisma.review.findMany({
    where: {
      ...(status && { status }),
      ...(q && {
        OR: [
          { title: { contains: q } },
          { comment: { contains: q } },
          { user: { email: { contains: q } } },
          { user: { name: { contains: q } } },
          { product: { name: { contains: q } } }
        ]
      })
    },
    include: { user: true, product: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reviews</h1>
          <p className="text-slate-500 mt-1">Moderate customer product reviews and add testimonials.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/blog/comments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors shadow-xs"
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>Store Page Reviews (/blog/the-valid-market-review)</span>
          </Link>
          <Link
            href="/admin/reviews/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Review
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        {["", "PENDING", "APPROVED", "REJECTED", "HIDDEN"].map((s) => (
          <a key={s} href={`?status=${s}`}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              (status || "") === s ? "bg-primary text-white border-primary" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {s || "All"}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-slate-50/50">
          <form className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="search" name="q" defaultValue={q} placeholder="Search reviews..."
              className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </form>
        </div>

        <div className="divide-y">
          {reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Star className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-medium text-slate-900">No reviews found</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <ReviewAvatar seed={review.avatarSeed} name={review.user.name || review.user.email} size={36} fallbackImageUrl={review.user.image} />
                        <div className="font-medium text-slate-900">{review.user.name || review.user.email}</div>
                        <div className="flex">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`h-4 w-4 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        review.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                        review.status === "REJECTED" ? "bg-red-100 text-red-700" :
                        review.status === "HIDDEN" ? "bg-slate-100 text-slate-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{review.status}</span>
                      
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        review.type === "ADMIN_TESTIMONIAL" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {review.type === "ADMIN_TESTIMONIAL" ? "Testimonial" : (review.verifiedPurchase ? "Verified Customer" : "Customer")}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">on <span className="font-medium text-slate-600">{review.product.name}</span></div>
                    {review.title && <div className="font-medium text-slate-800 mb-1">{review.title}</div>}
                    {review.comment && <div className="text-sm text-slate-600 whitespace-pre-wrap">{review.comment}</div>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <ReviewActions reviewId={review.id} currentStatus={review.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
