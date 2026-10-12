"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck, User } from "lucide-react";

interface CommentItem {
  id: string;
  authorName: string;
  content: string;
  createdAt: string | Date;
}

interface BlogCommentsSectionProps {
  postId: string;
  initialComments: CommentItem[];
}

export default function BlogCommentsSection({ postId, initialComments }: BlogCommentsSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!authorName.trim() || !content.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please provide your name and comment text.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: authorName.trim(),
          authorEmail: authorEmail.trim() || undefined,
          content: content.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit comment");
      }

      // Reset form
      setContent("");
      setStatusMessage({
        type: "success",
        text: "Thank you! Your comment has been received and is awaiting approval by our moderation team.",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-16 pt-10 border-t border-slate-200" id="comments">
      {/* ─ Section Header ─ */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Community Discussion
            </h3>
            <p className="text-xs text-slate-500">
              {comments.length} {comments.length === 1 ? "approved comment" : "approved comments"}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Moderated Community</span>
        </div>
      </div>

      {/* ─ Notification Banner ─ */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-sm">
            <p className="font-bold">
              {statusMessage.type === "success" ? "Comment Submitted!" : "Submission Failed"}
            </p>
            <p className="text-xs mt-0.5 opacity-90">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* ─ Leave a Comment Form ─ */}
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs mb-10">
        <h4 className="font-extrabold text-base text-slate-900 mb-1">
          Leave a Comment
        </h4>
        <p className="text-xs text-slate-500 mb-5">
          Join the conversation! Comments are reviewed by our team before going live.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="authorName"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="authorName"
                type="text"
                required
                maxLength={60}
                placeholder="e.g. Alex Rivera"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="authorEmail"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Email Address <span className="text-slate-400 font-normal lowercase">(optional, never published)</span>
              </label>
              <input
                id="authorEmail"
                type="email"
                maxLength={100}
                placeholder="alex@example.com"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="commentContent"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
            >
              Your Comment <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="commentContent"
              required
              rows={4}
              maxLength={2000}
              placeholder="Write your feedback, questions, or insights here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white resize-y min-h-[100px]"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending moderation approval before public display</span>
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !authorName.trim() || !content.trim()}
              className="stylish-btn btn-primary btn-sm flex items-center justify-center gap-2 font-bold px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─ Comments Stream ─ */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-700">No approved comments yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Be the first to share your thoughts on this article!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                    {comment.authorName ? comment.authorName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 leading-snug">
                      {comment.authorName}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>

              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-12">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
