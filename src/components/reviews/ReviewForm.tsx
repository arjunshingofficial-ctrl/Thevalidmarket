"use client";

import { useState } from "react";
import { Star, X, Camera, Upload, RefreshCw } from "lucide-react";
import { submitReview } from "@/lib/actions/reviews";
import { ReviewAvatar } from "./ReviewAvatar";
import { normalizeImageUrl } from "@/lib/storage/client";

export function ReviewForm({
  productId,
  productName,
  initialRating = 5,
  initialTitle = "",
  initialComment = "",
  onSuccess,
  onCancel,
}: {
  productId: string;
  productName: string;
  initialRating?: number;
  initialTitle?: string;
  initialComment?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(initialTitle);
  const [comment, setComment] = useState(initialComment);
  const [avatarSeed, setAvatarSeed] = useState(() => Math.random().toString(36).substring(7));
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    if (comment.length < 10) {
      setError("Comment must be at least 10 characters long.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await submitReview({
        productId,
        rating,
        title,
        comment,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        avatarSeed,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full max-w-lg mx-auto">
      <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-800">
          Review {productName}
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Overall Rating</label>
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
          <label className="block text-sm font-medium text-slate-700 mb-3">Your Avatar</label>
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <ReviewAvatar seed={avatarSeed} size={48} />
            <button
              type="button"
              onClick={handleRegenerateAvatar}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Regenerate Avatar
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Review Title <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Excellent product, highly recommended!"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Review Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike?"
            className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px] resize-y"
            maxLength={1000}
            required
          />
          <div className="text-right text-xs text-slate-400 mt-1">
            {comment.length}/1000
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-primary" />
            <span>Attach Photos <span className="text-slate-400 font-normal">(Optional, up to 5)</span></span>
          </label>

          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {uploadedImages.map((imgUrl, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={normalizeImageUrl(imgUrl)} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadedImages.length < 5 && (
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-primary rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100/60 transition-colors">
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
                  <span className="text-xs font-medium text-slate-600">Uploading photo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-slate-600">Upload screenshot or photo</span>
                </>
              )}
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </form>
    </div>
  );
}
