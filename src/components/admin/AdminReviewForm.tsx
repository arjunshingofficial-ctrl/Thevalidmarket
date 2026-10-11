"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { adminAddReview } from "@/lib/actions/admin-reviews";
import { useRouter } from "next/navigation";
import { ReviewAvatar } from "../reviews/ReviewAvatar";

export function AdminReviewForm({ products, users }: { products: any[]; users: any[] }) {
  const [productId, setProductId] = useState("");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("VERIFIED_CUSTOMER_REVIEW");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !userId || !rating || !comment) {
      setError("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await adminAddReview({ productId, userId, rating, title, comment, type, avatarSeed });
      if (res && !res.success) {
        setError(res.error || "Failed to add review");
        return;
      }
      router.push("/admin/reviews");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to add review");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
          <select 
            value={productId} 
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            required
          >
            <option value="">Select a product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reviewer (User)</label>
          <select 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            required
          >
            <option value="">Select a user...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Review Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          >
            <option value="VERIFIED_CUSTOMER_REVIEW">Verified Customer Review (Requires Purchase)</option>
            <option value="ADMIN_TESTIMONIAL">Admin Testimonial (No Purchase Required)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Avatar Preview</label>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <ReviewAvatar seed={avatarSeed} size={48} fallbackImageUrl={
              users.find(u => u.id === userId)?.image || null
            } />
            <div className="flex flex-col">
              <button
                type="button"
                onClick={handleRegenerateAvatar}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors text-left"
              >
                Regenerate Avatar
              </button>
              <span className="text-xs text-slate-500 mt-1">If the user has a real avatar, it will override this.</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
          <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                className="focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    (hoverRating || rating) >= star
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm min-h-[120px]"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => router.push("/admin/reviews")}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Review"}
        </button>
      </div>
    </form>
  );
}
