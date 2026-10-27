"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare, CheckCircle, XCircle, Edit3, Trash2,
  Search, Filter, ExternalLink, Clock, ShieldCheck, RefreshCw,
  AlertCircle, Eye, Check, X, CornerDownRight, Star, Sparkles
} from "lucide-react";
import { parseBlogReviewContent } from "@/lib/blog-reviews";

interface CommentData {
  id: string;
  postId: string;
  userId: string | null;
  authorName: string;
  authorEmail: string | null;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

function parseReplyMeta(raw: string): { isReply: boolean; parentAuthor?: string; cleanText: string } {
  if (!raw) return { isReply: false, cleanText: "" };
  const match = raw.match(/^\[reply:([^:]+):@([^\]]+)\]\s*\n*/);
  if (match) {
    return {
      isReply: true,
      parentAuthor: match[2],
      cleanText: raw.slice(match[0].length).trim(),
    };
  }
  return {
    isReply: false,
    cleanText: raw,
  };
}

export default function BlogCommentsManager() {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingComment, setEditingComment] = useState<CommentData | null>(null);
  const [editAuthorName, setEditAuthorName] = useState("");
  const [editAuthorEmail, setEditAuthorEmail] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("APPROVED");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Notification message
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const url = (statusFilter === "ALL" || statusFilter === "STORE_REVIEWS")
        ? "/api/admin/blog/comments"
        : `/api/admin/blog/comments?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load comments");
      setComments(data.comments || []);
      setPendingCount(data.pendingCount || 0);
    } catch (err: any) {
      setBanner({ type: "error", text: err.message || "Failed to load comments" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Update Status Quick Action
  const handleUpdateStatus = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/blog/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update comment");

      setBanner({
        type: "success",
        text: `Comment marked as ${newStatus.toLowerCase()}!`,
      });
      // Refresh list
      fetchComments();
    } catch (err: any) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Comment Action
  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this comment?")) {
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/blog/comments/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete comment");

      setBanner({ type: "success", text: "Comment deleted successfully." });
      fetchComments();
    } catch (err: any) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (comment: CommentData) => {
    setEditingComment(comment);
    setEditAuthorName(comment.authorName);
    setEditAuthorEmail(comment.authorEmail || "");
    setEditContent(comment.content);
    setEditStatus(comment.status);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComment) return;

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/blog/comments/${editingComment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: editAuthorName.trim(),
          authorEmail: editAuthorEmail.trim() || null,
          content: editContent.trim(),
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update comment");

      setBanner({ type: "success", text: "Comment modified and saved successfully." });
      setEditingComment(null);
      fetchComments();
    } catch (err: any) {
      alert(err.message || "Failed to save comment edits");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filter comments locally by search query and store review filter
  const filteredComments = comments.filter((c) => {
    if (statusFilter === "STORE_REVIEWS") {
      const isReviewSlug = c.post.slug === "the-valid-market-review";
      const hasRatingTag = /\[rating:[1-5]\]/.test(c.content);
      if (!isReviewSlug && !hasRatingTag) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.authorName.toLowerCase().includes(q) ||
      (c.authorEmail && c.authorEmail.toLowerCase().includes(q)) ||
      c.content.toLowerCase().includes(q) ||
      c.post.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* ─ Header & Pending Counter ─ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Blog Comments Moderation Studio
              </h1>
              <p className="text-xs text-slate-500">
                Review, edit, approve, or reject user comments before or after they go live.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} Awaiting Review</span>
          </div>

          <button
            onClick={() => fetchComments()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh comments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ─ Banner ─ */}
      {banner && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold border ${
            banner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{banner.text}</span>
          </div>
          <button
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─ Filter Tabs & Search ─ */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: "ALL", label: "All Comments" },
            { id: "PENDING", label: `Pending (${pendingCount})` },
            { id: "STORE_REVIEWS", label: "⭐ The Valid Market Reviews" },
            { id: "APPROVED", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search author, email, text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
          />
        </div>
      </div>

      {/* ─ Comments List ─ */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs font-semibold">Loading comments...</p>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-slate-700">No comments found</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter !== "ALL"
                ? `No comments in "${statusFilter}" status.`
                : "No comments have been posted yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredComments.map((comment) => {
              const isActionLoading = actionLoadingId === comment.id;

              return (
                <div
                  key={comment.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-5"
                >
                  <div className="flex-1 space-y-3">
                    {/* Top Metadata */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          comment.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : comment.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {comment.status}
                      </span>

                      {/* Post Association Link */}
                      <span className="text-xs text-slate-400">on</span>
                      <Link
                        href={`/blog/${comment.post.slug}`}
                        target="_blank"
                        className="text-xs font-bold text-slate-800 hover:text-primary transition-colors flex items-center gap-1 group max-w-sm truncate"
                      >
                        <span>{comment.post.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary" />
                      </Link>

                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Author Details */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {comment.authorName}
                      </span>
                      {comment.authorEmail && (
                        <span className="text-xs text-slate-400">
                          ({comment.authorEmail})
                        </span>
                      )}
                    </div>

                    {/* Comment Content */}
                    {(() => {
                      const meta = parseBlogReviewContent(comment.content);
                      const isStoreReview = comment.post.slug === "the-valid-market-review";
                      const hasRating = /\[rating:[1-5]\]/.test(comment.content) || isStoreReview;

                      return (
                        <div className="space-y-2">
                          {/* Rating & Review Title Display */}
                          <div className="flex flex-wrap items-center gap-2">
                            {isStoreReview && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-indigo-600" />
                                Store Review
                              </span>
                            )}
                            {hasRating && (
                              <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <Star
                                      key={n}
                                      className={`w-3.5 h-3.5 ${
                                        n <= meta.rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] font-bold text-amber-900 ml-0.5">
                                  {meta.rating}/5
                                </span>
                              </div>
                            )}
                            {meta.title && (
                              <span className="text-xs font-bold text-slate-900 italic">
                                &ldquo;{meta.title}&rdquo;
                              </span>
                            )}
                          </div>

                          {meta.isReply && (
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                              <CornerDownRight className="w-3.5 h-3.5" />
                              <span>Replying to <strong>@{meta.parentAuthor}</strong></span>
                            </div>
                          )}
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {meta.cleanText}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions Column */}
                  <div className="flex md:flex-col items-center md:items-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* Approve Quick Button */}
                    {comment.status !== "APPROVED" && (
                      <button
                        onClick={() => handleUpdateStatus(comment.id, "APPROVED")}
                        disabled={isActionLoading}
                        className="stylish-btn btn-emerald btn-xs flex items-center gap-1 text-xs font-bold shadow-xs px-3 py-1.5"
                        title="Approve Comment"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {/* Reject Quick Button */}
                    {comment.status !== "REJECTED" && (
                      <button
                        onClick={() => handleUpdateStatus(comment.id, "REJECTED")}
                        disabled={isActionLoading}
                        className="stylish-btn btn-rose btn-xs flex items-center gap-1 text-xs font-bold shadow-xs px-3 py-1.5"
                        title="Reject Comment"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}

                    {/* Edit / Modify Modal Button */}
                    <button
                      onClick={() => handleOpenEdit(comment)}
                      disabled={isActionLoading}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5"
                      title="Edit / Modify Comment"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={isActionLoading}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─ Edit / Modify Modal ─ */}
      {editingComment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Edit &amp; Modify Comment
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fix typos, sanitize inappropriate words, or adjust author metadata.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingComment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editAuthorName}
                    onChange={(e) => setEditAuthorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author Email
                  </label>
                  <input
                    type="email"
                    value={editAuthorEmail}
                    onChange={(e) => setEditAuthorEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Comment Content
                </label>
                <textarea
                  rows={5}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value="APPROVED">APPROVED (Visible to all users)</option>
                  <option value="PENDING">PENDING (Awaiting review)</option>
                  <option value="REJECTED">REJECTED (Hidden from public)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="stylish-btn btn-primary btn-sm flex items-center gap-1.5 font-bold px-5 py-2"
                >
                  {editSubmitting ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
