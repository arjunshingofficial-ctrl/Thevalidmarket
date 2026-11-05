"use client";

import { useState } from "react";
import { Star, User, Users, Calendar, Camera, Upload, X, RefreshCw } from "lucide-react";
import { adminAddReview } from "@/lib/actions/admin-reviews";
import { useRouter } from "next/navigation";
import { ReviewAvatar } from "../reviews/ReviewAvatar";
import { normalizeImageUrl } from "@/lib/storage/client";

export function AdminReviewForm({ products, users }: { products: any[]; users: any[] }) {
  const [productId, setProductId] = useState("");
  const [reviewerMode, setReviewerMode] = useState<"custom" | "existing">("custom");
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("VERIFIED_CUSTOMER_REVIEW");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setError("Maximum 5 photos allowed per review.");
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          throw new Error(`"${file.name}" is not an image.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" is too large (max 10MB).`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/reviews/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || "Failed to upload image.");
        }

        setUploadedImages((prev) => [...prev, data.url]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !rating || !comment) {
      setError("Please select a product, rating, and write a review comment.");
      return;
    }

    if (reviewerMode === "custom" && !customName.trim()) {
      setError("Please enter a reviewer name.");
      return;
    }

    if (reviewerMode === "existing" && !userId) {
      setError("Please select an existing user account.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await adminAddReview({
        productId,
        userId: reviewerMode === "existing" ? userId : undefined,
        reviewerName: reviewerMode === "custom" ? customName.trim() : undefined,
        reviewerEmail: reviewerMode === "custom" && customEmail.trim() ? customEmail.trim() : undefined,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        type,
        avatarSeed,
        createdAt: customDate ? new Date(customDate).toISOString() : undefined,
      });

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

  const previewName = reviewerMode === "custom"
    ? (customName || "Reviewer")
    : (users.find(u => u.id === userId)?.name || "Reviewer");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Product selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Target Product or Course <span className="text-rose-500">*</span>
          </label>
          <select 
            value={productId} 
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
            required
          >
            <option value="">Select a product or course...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Reviewer Mode Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Reviewer Identity <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setReviewerMode("custom")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                reviewerMode === "custom"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Custom Name / Student Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setReviewerMode("existing")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                reviewerMode === "existing"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Select Existing User</span>
            </button>
          </div>

          {reviewerMode === "custom" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reviewer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={reviewerMode === "custom"}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Rahul Verma or Alex M."
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. student@example.com"
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Registered User
              </label>
              <select 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                required={reviewerMode === "existing"}
              >
                <option value="">Select a user...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Review Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Review Type</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          >
            <option value="VERIFIED_CUSTOMER_REVIEW">Verified Customer / Student Review (Badge Displayed)</option>
            <option value="ADMIN_TESTIMONIAL">Admin Testimonial (No Purchase Required)</option>
          </select>
        </div>

        {/* Avatar Preview & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Avatar Preview</label>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <ReviewAvatar
                seed={avatarSeed}
                name={previewName}
                size={44}
                fallbackImageUrl={reviewerMode === "existing" ? (users.find(u => u.id === userId)?.image || null) : null}
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={handleRegenerateAvatar}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors text-left"
                >
                  Regenerate Avatar
                </button>
                <span className="text-[11px] text-slate-400 mt-0.5">Unique geometric avatar seed</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Review Date (Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Leave empty to use current time.</span>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Rating <span className="text-rose-500">*</span>
          </label>
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

        {/* Review Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Title (Optional)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete A-to-Z Masterclass"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
          />
        </div>

        {/* Review Comment */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Review Comment <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write the review content here..."
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm min-h-[120px]"
            required
          />
        </div>

        {/* Attached Photos */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-primary" />
            <span>Review Photos / Proof <span className="text-slate-400 font-normal">(Optional - up to 5)</span></span>
          </label>

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2.5 mb-3">
              {uploadedImages.map((imgUrl, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs">
                  <img src={normalizeImageUrl(imgUrl)} alt={`Review upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadedImages.length < 5 && (
            <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-300 hover:border-primary rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-colors">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                className="hidden"
              />
              {isUploadingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-semibold text-slate-600">Uploading photo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-slate-600">Click to upload photos or screenshots</span>
                </>
              )}
            </label>
          )}
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
          className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving Review..." : "Add Review"}
        </button>
      </div>
    </form>
  );
}
