"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  ShieldCheck,
  ThumbsUp,
  MessageSquare,
  CornerDownRight,
  X,
  Filter,
  Sparkles,
} from "lucide-react";
import { parseBlogReviewContent, ParsedBlogReview } from "@/lib/blog-reviews";

interface CommentItem {
  id: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  createdAt: string | Date;
}

interface TheValidMarketReviewSectionProps {
  postId: string;
  initialComments: CommentItem[];
}

export default function TheValidMarketReviewSection({
  postId,
  initialComments,
}: TheValidMarketReviewSectionProps) {
  const { data: session } = useSession();

  // Comments state
  const [comments, setComments] = useState<CommentItem[]>(initialComments);

  // Review submission form state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter & Search
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");

  // Inline Reply state
  const [replyingTo, setReplyingTo] = useState<{
    reviewId: string;
    authorName: string;
  } | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState("");
  const [replyAuthorEmail, setReplyAuthorEmail] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccessMessage, setReplySuccessMessage] = useState<string | null>(null);

  // Pre-fill user information if authenticated
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !authorName) {
        setAuthorName(session.user.name);
        setReplyAuthorName(session.user.name);
      }
      if (session.user.email && !authorEmail) {
        setAuthorEmail(session.user.email);
        setReplyAuthorEmail(session.user.email);
      }
    }
  }, [session, authorName, authorEmail]);

  // Parse all comments into reviews and threaded replies
  const { rootReviews, repliesByParent, avgRating, totalRatingsCount, ratingCounts } = useMemo(() => {
    const parsedList: ParsedBlogReview[] = comments.map((c) => {
      const parsed = parseBlogReviewContent(c.content);
      return {
        id: c.id,
        authorName: c.authorName,
        authorEmail: c.authorEmail,
        createdAt: c.createdAt,
        rating: parsed.rating,
        title: parsed.title,
        content: c.content,
        cleanText: parsed.cleanText,
        isReply: parsed.isReply,
        parentId: parsed.parentId,
        parentAuthor: parsed.parentAuthor,
      };
    });

    const idSet = new Set(parsedList.map((c) => c.id));
    const repliesMap = new Map<string, ParsedBlogReview[]>();
    const roots: ParsedBlogReview[] = [];

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;
    let countedRatings = 0;

    parsedList.forEach((c) => {
      if (c.isReply && c.parentId && idSet.has(c.parentId)) {
        const arr = repliesMap.get(c.parentId) || [];
        arr.push(c);
        repliesMap.set(c.parentId, arr);
      } else {
        roots.push(c);
        counts[c.rating] = (counts[c.rating] || 0) + 1;
        ratingSum += c.rating;
        countedRatings++;
      }
    });

    const average = countedRatings > 0 ? (ratingSum / countedRatings).toFixed(1) : "5.0";

    return {
      rootReviews: roots,
      repliesByParent: repliesMap,
      avgRating: average,
      totalRatingsCount: countedRatings,
      ratingCounts: counts,
    };
  }, [comments]);

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!authorName.trim() || !content.trim()) {
      setErrorMessage("Please enter your name and review details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          rating,
          title: reviewTitle.trim() || undefined,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          content: content.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      // Success: Clear fields and show ONLY "Thank you for Review us"
      setIsSubmitted(true);
      setReviewTitle("");
      setContent("");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reply Submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo) return;
    setErrorMessage(null);

    const nameToUse = replyAuthorName.trim() || authorName.trim();
    if (!nameToUse || !replyContent.trim()) {
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: nameToUse,
          authorEmail: replyAuthorEmail.trim() || authorEmail.trim() || undefined,
          content: replyContent.trim(),
          parentId: replyingTo.reviewId,
          parentAuthor: replyingTo.authorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit reply");
      }

      setReplyContent("");
      setReplyingTo(null);
      setReplySuccessMessage("Thank you for Review us");
      setTimeout(() => setReplySuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || "Failed to submit reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Filter root reviews
  const filteredReviews = useMemo(() => {
    if (filterRating === "ALL") return rootReviews;
    return rootReviews.filter((r) => r.rating === filterRating);
  }, [rootReviews, filterRating]);

  const ratingDescriptions: Record<number, string> = {
    5: "5 Stars — Outstanding & Highly Recommended",
    4: "4 Stars — Very Good Quality & Service",
    3: "3 Stars — Average / Satisfactory Experience",
    2: "2 Stars — Needs Improvement",
    1: "1 Star — Disappointed / Poor Experience",
  };

  return (
    <section className="mt-14 pt-8 border-t border-slate-200" id="reviews">
      {/* ── Trust Header & Stats ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-9 shadow-xl relative overflow-hidden mb-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left summary */}
          <div className="lg:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customer Reviews &amp; Ratings</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {avgRating}
              </span>
              <div>
                <div className="flex items-center text-amber-400 gap-1 mb-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-xs"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  {totalRatingsCount > 0
                    ? `Based on ${totalRatingsCount} verified ${
                        totalRatingsCount === 1 ? "review" : "reviews"
                      }`
                    : "Verified customer experiences"}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Read real, uncensored experiences from members who have purchased services,
              tools, courses, and digital solutions on The Valid Market.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-300">
              <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Genuine Reviews
              </span>
              <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                Open to All Members
              </span>
            </div>
          </div>

          {/* Right rating bars */}
          <div className="lg:col-span-7 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Rating Distribution
            </h4>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingCounts[stars] || 0;
              const percent = totalRatingsCount > 0 ? (count / totalRatingsCount) * 100 : 0;
              return (
                <button
                  key={stars}
                  onClick={() => setFilterRating(filterRating === stars ? "ALL" : stars)}
                  className={`w-full flex items-center gap-3 text-xs group transition-colors p-1 rounded-lg ${
                    filterRating === stars ? "bg-white/15" : "hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-1 w-14 font-semibold text-slate-200 shrink-0">
                    <span>{stars}</span>
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-slate-300 font-mono text-[11px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Write a Review Form Card ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-sm mb-12">
        {isSubmitted ? (
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-8 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-emerald-900 tracking-tight">
              Thank you for Review us
            </h3>
            <p className="text-sm text-emerald-700/90 max-w-md mx-auto mt-2 leading-relaxed">
              Your feedback has been successfully submitted. We deeply value your honest thoughts and support for The Valid Market community!
            </p>
            <div className="pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setRating(5);
                  setReviewTitle("");
                  setContent("");
                }}
                className="stylish-btn btn-emerald btn-sm font-bold px-6 py-2.5 shadow-sm cursor-pointer"
              >
                Write Another Review
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-3 pb-6 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Write a Review
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anyone can review. Share your thoughts, service experience, and ratings with the community.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Feedback</span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Overall Rating <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(star)}
                          className="p-1 text-slate-200 hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                          title={`${star} Star${star > 1 ? "s" : ""}`}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              active
                                ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    {ratingDescriptions[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label
                  htmlFor="reviewTitle"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Review Title <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="reviewTitle"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Instant delivery, high quality digital tools, 10/10 recommended"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                />
              </div>

              {/* Author Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="reviewAuthorName"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reviewAuthorName"
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. David Vance"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="reviewAuthorEmail"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Email Address <span className="text-slate-400 font-normal lowercase">(optional, kept private)</span>
                  </label>
                  <input
                    id="reviewAuthorEmail"
                    type="email"
                    maxLength={100}
                    placeholder="david@example.com"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
                  />
                </div>
              </div>

              {/* Review Content */}
              <div>
                <label
                  htmlFor="reviewContent"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Your Review &amp; Experience <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="reviewContent"
                  required
                  rows={4}
                  maxLength={2500}
                  placeholder="Share details about what you purchased, how customer support treated you, the speed of delivery, or your general satisfaction..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white resize-y min-h-[110px]"
                />
              </div>

              {/* Submit CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Your review will be presented to our moderation team
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting || !authorName.trim() || !content.trim()}
                  className="stylish-btn btn-primary btn-md font-bold px-7 py-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Review...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Reply Banner Notification ── */}
      {replySuccessMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{replySuccessMessage}</span>
        </div>
      )}

      {/* ── Reviews Stream & Filter ── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h4 className="text-lg font-black text-slate-900">
              Community Reviews ({rootReviews.length})
            </h4>
            <p className="text-xs text-slate-500">
              {filterRating === "ALL"
                ? "Showing all verified customer reviews"
                : `Showing ${filterRating}-star reviews only`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterRating("ALL")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterRating === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Reviews
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                onClick={() => setFilterRating(s)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filterRating === s
                    ? "bg-amber-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{s}</span>
                <Star className={`w-3 h-3 ${filterRating === s ? "fill-white" : "fill-amber-400 text-amber-400"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <h5 className="text-base font-bold text-slate-800">
              {filterRating === "ALL" ? "No Reviews Yet" : `No ${filterRating}-Star Reviews Found`}
            </h5>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Be the first to share your experience with The Valid Market! Use the form above to submit your review.
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const replies = repliesByParent.get(review.id) || [];
            const isReplying = replyingTo?.reviewId === review.id;

            return (
              <div
                key={review.id}
                className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                      {review.authorName ? review.authorName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-extrabold text-slate-900">
                          {review.authorName}
                        </h5>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl w-fit">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Star
                        key={num}
                        className={`w-3.5 h-3.5 ${
                          num <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-900 ml-1">
                      {review.rating}/5
                    </span>
                  </div>
                </div>

                {/* Review Title if present */}
                {review.title && (
                  <h6 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1.5 pl-13">
                    {review.title}
                  </h6>
                )}

                {/* Review Text */}
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-13">
                  {review.cleanText}
                </p>

                {/* Reply action bar */}
                <div className="pl-13 mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (isReplying) {
                        setReplyingTo(null);
                      } else {
                        setReplyingTo({
                          reviewId: review.id,
                          authorName: review.authorName,
                        });
                        setReplyContent("");
                        if (!replyAuthorName && authorName) {
                          setReplyAuthorName(authorName);
                        }
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>{isReplying ? "Cancel Reply" : "Reply"}</span>
                  </button>

                  {replies.length > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      {replies.length} {replies.length === 1 ? "response" : "responses"}
                    </span>
                  )}
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="ml-4 sm:ml-13 mt-4 p-4 rounded-2xl bg-slate-50 border border-indigo-100 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-indigo-700 inline-flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Replying to @{review.authorName}
                      </span>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleReplySubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Your Name *"
                          value={replyAuthorName}
                          onChange={(e) => setReplyAuthorName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <input
                          type="email"
                          placeholder="Your Email (optional)"
                          value={replyAuthorEmail}
                          onChange={(e) => setReplyAuthorEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <textarea
                        required
                        rows={3}
                        maxLength={1500}
                        placeholder={`Write your reply to ${review.authorName}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={
                            isSubmittingReply ||
                            !replyContent.trim() ||
                            !(replyAuthorName.trim() || authorName.trim())
                          }
                          className="stylish-btn btn-primary btn-xs font-bold px-4 py-1.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingReply ? "Submitting..." : "Post Reply"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Nested Replies Stream */}
                {replies.length > 0 && (
                  <div className="ml-4 sm:ml-13 mt-4 pt-3 border-t border-slate-100 space-y-3">
                    {replies.map((reply) => {
                      const isOfficialAdmin =
                        reply.authorName.toLowerCase().includes("valid market") ||
                        reply.authorName.toLowerCase().includes("support") ||
                        reply.authorName.toLowerCase().includes("admin");

                      return (
                        <div
                          key={reply.id}
                          className={`p-4 rounded-2xl border transition-colors ${
                            isOfficialAdmin
                              ? "bg-indigo-50/70 border-indigo-200"
                              : "bg-slate-50 border-slate-200/70"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                                  isOfficialAdmin
                                    ? "bg-indigo-600 text-white"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {reply.authorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h6 className="text-xs font-bold text-slate-900">
                                    {reply.authorName}
                                  </h6>
                                  {isOfficialAdmin && (
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                                      Official Response
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(reply.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] text-slate-500 font-medium">
                              Replying to @{reply.parentAuthor || review.authorName}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-9">
                            {reply.cleanText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
