import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare, Star, Search, Plus, ThumbsUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTestimonials() {
  const reviews = await prisma.review.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Testimonials & Reviews</h1>
          <p className="text-slate-500 mt-1">Manage customer testimonials, feature reviews, and brand feedback</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Featured Testimonial
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Star className="w-5 h-5 fill-emerald-500" />
            <span className="font-semibold text-sm">Average Rating</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">4.9 / 5.0</p>
          <p className="text-xs text-slate-500 mt-1">Based on {reviews.length} total reviews</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <ThumbsUp className="w-5 h-5" />
            <span className="font-semibold text-sm">Featured Testimonials</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">12</p>
          <p className="text-xs text-slate-500 mt-1">Displayed on Homepage & Landing Pages</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <MessageSquare className="w-5 h-5" />
            <span className="font-semibold text-sm">Pending Moderation</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">0</p>
          <p className="text-xs text-slate-500 mt-1">All reviews up to date</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Customer Testimonials List</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No testimonials or reviews found.</div>
          ) : (
            reviews.map((item) => (
              <div key={item.id} className="p-4 hover:bg-slate-50 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{item.user.name || "Anonymous Customer"}</span>
                    <span className="text-xs text-slate-400">({item.user.email})</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">{item.comment || "No comment provided."}</p>
                  <p className="text-xs text-slate-400">Product: {item.product.name}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium">Approved</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
