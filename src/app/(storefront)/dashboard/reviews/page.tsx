import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Star, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { WriteReviewButton } from "@/components/reviews/WriteReviewButton";
import Link from "next/link";
import Image from "next/image";
import { ReviewAvatar } from "@/components/reviews/ReviewAvatar";

export const dynamic = "force-dynamic";

export default async function DashboardReviewsPage() {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) {
    redirect("/login");
  }

  // Get user's existing reviews
  const myReviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          metadata: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get products they are eligible to review but haven't
  // 1. Paid orders
  const paidOrders = await prisma.order.findMany({
    where: { userId: session.user.id, paymentStatus: "PAID" },
    include: { items: true },
  });
  
  // 2. Active entitlements
  const activeEntitlements = await prisma.entitlement.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
  });

  const eligibleProductIds = new Set<string>();
  paidOrders.forEach(order => {
    order.items.forEach(item => eligibleProductIds.add(item.productId));
  });
  activeEntitlements.forEach(ent => {
    eligibleProductIds.add(ent.productId);
  });

  // Remove products already reviewed
  myReviews.forEach(rev => eligibleProductIds.delete(rev.productId));

  // Fetch the remaining products
  const productsToReview = await prisma.product.findMany({
    where: { id: { in: Array.from(eligibleProductIds) } },
    select: { id: true, name: true, slug: true, metadata: true },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your product reviews and ratings.</p>
        </div>
      </div>

      {/* Eligible Products to Review */}
      {productsToReview.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-800">Pending Reviews</h2>
            <p className="text-xs text-slate-500">Products you've purchased but haven't reviewed yet.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {productsToReview.map((product) => {
              const meta = product.metadata ? JSON.parse(product.metadata) : {};
              const image = meta.image || "/images/placeholder.jpg";
              return (
                <div key={product.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                      <Image src={image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <Link href={`/product/${product.slug}`} className="font-medium text-slate-900 hover:text-primary">
                        {product.name}
                      </Link>
                      <div className="text-sm text-slate-500">Not reviewed yet</div>
                    </div>
                  </div>
                  <div>
                    <WriteReviewButton productId={product.id} productName={product.name} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Reviewed Products ({myReviews.length})</h2>
        </div>
        
        {myReviews.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            You haven't submitted any reviews yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myReviews.map((review) => {
              const meta = review.product.metadata ? JSON.parse(review.product.metadata) : {};
              const image = meta.image || "/images/placeholder.jpg";
              
              let StatusIcon = Clock;
              let statusColor = "text-amber-500 bg-amber-50 border-amber-200";
              if (review.status === "APPROVED") {
                StatusIcon = CheckCircle2;
                statusColor = "text-green-600 bg-green-50 border-green-200";
              } else if (review.status === "REJECTED") {
                StatusIcon = XCircle;
                statusColor = "text-red-600 bg-red-50 border-red-200";
              } else if (review.status === "HIDDEN") {
                StatusIcon = AlertCircle;
                statusColor = "text-slate-500 bg-slate-50 border-slate-200";
              }

              return (
                <div key={review.id} className="p-4 flex flex-col sm:flex-row gap-6">
                  {/* Product Info */}
                  <div className="sm:w-1/3 flex gap-3 shrink-0">
                    <div className="h-16 w-16 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                      <Image src={image} alt={review.product.name} fill className="object-cover" />
                    </div>
                    <div>
                      <Link href={`/product/${review.product.slug}`} className="font-medium text-sm text-slate-900 hover:text-primary block line-clamp-2 leading-tight">
                        {review.product.name}
                      </Link>
                      <div className="mt-2 flex items-center gap-2">
                        <ReviewAvatar seed={review.avatarSeed} size={24} />
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" />
                          {review.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-4 h-4 ${review.rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                          />
                        ))}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </div>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-semibold text-slate-800 mt-2 text-sm">{review.title}</h4>
                    )}
                    <p className="text-slate-600 mt-1 text-sm whitespace-pre-wrap">
                      "{review.comment}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="sm:w-32 flex flex-col items-end shrink-0 justify-start">
                    <WriteReviewButton 
                      productId={review.productId} 
                      productName={review.product.name}
                      isEdit={true}
                      initialData={{
                        id: review.id,
                        rating: review.rating,
                        title: review.title || "",
                        comment: review.comment || ""
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
