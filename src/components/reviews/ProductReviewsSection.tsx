"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
  Star, 
  Check, 
  ShieldCheck, 
  Plus, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare, 
  RefreshCw,
  Camera,
  Upload,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { ReviewAvatar } from "./ReviewAvatar";
import { submitReview } from "@/lib/actions/reviews";
import { normalizeImageUrl } from "@/lib/storage/client";

export interface ReviewItem {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  images?: string | string[] | null;
  type?: string;
  verifiedPurchase?: boolean;
  avatarSeed?: string | null;
  createdAt: string | Date;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
}

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  initialReviews: ReviewItem[];
  isCourse?: boolean;
}

export default function ProductReviewsSection({
  productId,
  productName,
  productSlug,
  initialReviews = [],
  isCourse = false,
}: ProductReviewsSectionProps) {
  const { data: session } = useSession();

  // Reviews state
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);

  // Form toggle & state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lightbox State
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  const openLightbox = (images: string[], index: number) => {
    setLightboxState({
      isOpen: true,
      images,
      currentIndex: index,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const nextLightboxImage = () => {
    setLightboxState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
    }));
  };

  const prevLightboxImage = () => {
    setLightboxState((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length,
    }));
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxState.isOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightboxImage();
      if (e.key === "ArrowLeft") prevLightboxImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxState.isOpen]);

  // Filter
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");

  // Pre-fill user info if authenticated
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !authorName) {
        setAuthorName(session.user.name);
      }
      if (session.user.email && !authorEmail) {
        setAuthorEmail(session.user.email);
      }
    }
  }, [session, authorName, authorEmail]);

  // Aggregate stats
  const { avgRating, totalCount, distribution } = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        avgRating: "0.0",
        totalCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = (sum / total).toFixed(1);

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      dist[star] = (dist[star] || 0) + 1;
    });

    return {
      avgRating: avg,
      totalCount: total,
      distribution: dist,
    };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (filterRating === "ALL") return reviews;
    return reviews.filter((r) => Math.round(r.rating) === filterRating);
  }, [reviews, filterRating]);

  // Helper to parse review images
  const parseReviewImages = (images: string | string[] | null | undefined): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images.filter(Boolean);
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      if (typeof images === "string" && images.trim()) {
        return [images.trim()];
      }
    }
    return [];
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setErrorMessage("You can attach a maximum of 5 images per review.");
      return;
    }

    setIsUploadingImage(true);
    setErrorMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          throw new Error(`File "${file.name}" is not a valid image format.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds the 10 MB limit.`);
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
      setErrorMessage(err.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Review Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nameToSubmit = authorName.trim() || session?.user?.name?.trim();
    if (!nameToSubmit || nameToSubmit.length < 2) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      setErrorMessage("Review comment must be at least 3 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReview({
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        avatarSeed,
        authorName: nameToSubmit,
        authorEmail: authorEmail.trim() || undefined,
      });

      if (!res?.success) {
        throw new Error((res as any)?.error || "Failed to submit review.");
      }

      setSuccessMessage(
        res.message ||
          "Thank you for your review! It has been submitted and will appear once approved by an administrator."
      );
      // Clear form
      setTitle("");
      setComment("");
      setUploadedImages([]);
      setHoverRating(0);
      setRating(5);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return "5 - Excellent";
      case 4:
        return "4 - Very Good";
      case 3:
        return "3 - Average";
      case 2:
        return "2 - Below Average";
      case 1:
        return "1 - Poor";
      default:
        return "";
    }
  };

  return (
    <div
      className="bg-white rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xs border border-slate-200/80 transition-all"
      id="reviews"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{isCourse ? "Student Reviews & Ratings" : "Verified Customer Reviews"}</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {totalCount} {totalCount === 1 ? "Review" : "Reviews"}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isCourse
              ? "Real feedback from students and enrolled members."
              : "Authentic reviews from verified buyers and community members."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setSuccessMessage(null);
            setErrorMessage(null);
          }}
          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0 ${
            showForm
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95"
          }`}
        >
          {showForm ? (
            "Close Review Form"
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Write a Review</span>
            </>
          )}
        </button>
      </div>

      {/* ── Review Form (Expandable) ── */}
      {showForm && (
        <div className="mb-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200/70">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Write a Review for {productName}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Share your experience. All reviews are approved by our admin team before publication.
              </p>
            </div>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-900">Review Submitted Successfully!</p>
                <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-900">Failed to Submit</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Stars Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Overall Rating <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                        title={getRatingLabel(star)}
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 fill-slate-100"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Your Review Avatar
              </label>
              <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-200 w-fit">
                <ReviewAvatar seed={avatarSeed} name={authorName || "Reviewer"} size={44} />
                <div>
                  <div className="text-xs font-semibold text-slate-700">Identity Avatar</div>
                  <button
                    type="button"
                    onClick={regenerateAvatar}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors mt-0.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Change Avatar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Author Name and Email Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal lowercase">(optional - kept private)</span>
                </label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Review Headline / Title <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Instant setup, incredible value and zero issues!"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                maxLength={100}
              />
            </div>

            {/* Review Comment */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Review Details <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {comment.length}/1500
                </span>
              </div>
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like about this product? How did it help your project or learning workflow?"
                rows={4}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-y"
                maxLength={1500}
              />
            </div>

            {/* Review Photos Upload */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Attach Photos / Screenshots <span className="text-slate-400 font-normal lowercase">(optional - up to 5)</span></span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {uploadedImages.length}/5
                </span>
              </div>

              {/* Previews Grid */}
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-3">
                  {uploadedImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-xs">
                      <img
                        src={normalizeImageUrl(imgUrl)}
                        alt={`Review upload ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Trigger Dropzone */}
              {uploadedImages.length < 5 && (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white hover:bg-emerald-50/20 cursor-pointer transition-all group">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 text-slate-600 group-hover:text-emerald-700 font-semibold text-xs sm:text-sm">
                    {isUploadingImage ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Uploading photo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                        <span>Click to upload product photos or screenshots</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    PNG, JPG, WebP up to 10MB each
                  </p>
                </label>
              )}
            </div>

            {/* Admin Moderation Notice */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Admin Approval Notice:</strong> To maintain strict authenticity and protect community standards, every review is verified by an administrator before appearing publicly.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <span>Submit Review</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Ratings & Distribution Summary ── */}
      <div className="grid md:grid-cols-[240px_1fr] gap-8 lg:gap-12 pb-8 border-b border-slate-100">
        {/* Big Rating Block */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left justify-center">
          {reviews.length > 0 ? (
            <>
              <div className="text-6xl font-black text-slate-900 tracking-tighter mb-1">
                {avgRating}
              </div>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      parseFloat(avgRating) >= star
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200 fill-slate-100"
                    }`}
                  />
                ))}
              </div>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">
                Based on {totalCount} verified {totalCount === 1 ? "review" : "reviews"}
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-2">0.0</div>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-slate-200 fill-slate-100" />
                ))}
              </div>
              <p className="text-slate-500 font-medium text-xs sm:text-sm">
                No reviews yet. Be the first to share your experience!
              </p>
            </>
          )}
        </div>

        {/* Distribution Bars */}
        <div className="space-y-2.5 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const isSelected = filterRating === star;

            return (
              <button
                type="button"
                key={star}
                onClick={() => setFilterRating(isSelected ? "ALL" : star)}
                className={`flex items-center gap-3 text-xs w-full text-left p-1 rounded-lg transition-colors group ${
                  isSelected ? "bg-slate-100/80 font-bold" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1 w-12 shrink-0 text-slate-700 font-bold group-hover:text-amber-600">
                  {star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="w-16 shrink-0 text-right text-slate-500 text-[11px] font-mono">
                  {count} ({percent}%)
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filter Chips ── */}
      {reviews.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-6 pb-2">
          <span className="text-xs font-bold text-slate-500 mr-2">Filter Reviews:</span>
          <button
            type="button"
            onClick={() => setFilterRating("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              filterRating === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] || 0;
            if (count === 0) return null;
            return (
              <button
                type="button"
                key={star}
                onClick={() => setFilterRating(star)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  filterRating === star
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{star} ★</span>
                <span className="opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Reviews List ── */}
      <div className="mt-6">
        {reviews.length === 0 ? (
          <div className="p-10 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">No reviews yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6 max-w-sm mx-auto">
              Be the first to share your experience with {productName}. Everyone is welcome to review!
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Write the First Review</span>
            </button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm">No reviews match the selected {filterRating}-star filter.</p>
            <button
              type="button"
              onClick={() => setFilterRating("ALL")}
              className="text-xs text-emerald-600 hover:underline font-bold mt-2"
            >
              Show all reviews
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReviews.map((review) => {
              const name = review.user?.name || "Customer";
              const dateStr = new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });

              return (
                <div key={review.id} className="py-6 first:pt-2 last:pb-0">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <div className="flex items-center gap-3.5">
                      <ReviewAvatar
                        seed={review.avatarSeed || null}
                        name={name}
                        size={46}
                        fallbackImageUrl={review.user?.image}
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          <span>{name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-bold tracking-wide uppercase">
                          {review.type === "ADMIN_TESTIMONIAL" ? (
                            <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              Admin Testimonial
                            </span>
                          ) : review.verifiedPurchase ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 font-bold">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>{isCourse ? "Verified Student" : "Verified Buyer"}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {isCourse ? "Student Review" : "Community Review"}
                            </span>
                          )}
                          <span className="text-slate-400 normal-case tracking-normal font-medium">
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex gap-0.5 shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            review.rating >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 fill-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-bold text-slate-900 mb-1.5 text-sm sm:text-base">
                      {review.title}
                    </h4>
                  )}
                  <p className="text-slate-600 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Attached Review Photos */}
                  {parseReviewImages(review.images).length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2.5">
                      {parseReviewImages(review.images).map((imgUrl, imgIdx) => (
                        <button
                          type="button"
                          key={imgIdx}
                          onClick={() => openLightbox(parseReviewImages(review.images), imgIdx)}
                          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/20 transition-all group bg-slate-50 shrink-0"
                          title="Click to enlarge"
                        >
                          <img
                            src={normalizeImageUrl(imgUrl)}
                            alt={`Review image ${imgIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Image Lightbox Modal ── */}
      {lightboxState.isOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            title="Close image"
          >
            <X className="w-6 h-6" />
          </button>

          {lightboxState.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevLightboxImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                title="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextLightboxImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                title="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={normalizeImageUrl(lightboxState.images[lightboxState.currentIndex])}
              alt="Review attachment enlarged"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
            {lightboxState.images.length > 1 && (
              <div className="mt-3 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-mono font-bold tracking-wider">
                {lightboxState.currentIndex + 1} / {lightboxState.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
