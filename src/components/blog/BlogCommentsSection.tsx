"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  CornerDownRight,
  X,
} from "lucide-react";

interface CommentItem {
  id: string;
  authorName: string;
  content: string;
  createdAt: string | Date;
}

interface ParsedComment extends CommentItem {
  isReply: boolean;
  parentId?: string;
  parentAuthor?: string;
  cleanText: string;
}

interface BlogCommentsSectionProps {
  postId: string;
  initialComments: CommentItem[];
}

function parseComment(c: CommentItem): ParsedComment {
  const raw = c.content || "";
  const match = raw.match(/^\[reply:([^:]+):@([^\]]+)\]\s*\n*/);
  if (match) {
    return {
      ...c,
      isReply: true,
      parentId: match[1],
      parentAuthor: match[2],
      cleanText: raw.slice(match[0].length).trim(),
    };
  }
  return {
    ...c,
    isReply: false,
    cleanText: raw,
  };
}

export default function BlogCommentsSection({
  postId,
  initialComments,
}: BlogCommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);

  // Main comment form state
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline Reply state
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    authorName: string;
  } | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState("");
  const [replyAuthorEmail, setReplyAuthorEmail] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Success / error banner
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  // Parse comments into threaded structure
  const { rootComments, repliesByParent } = useMemo(() => {
    const parsed = comments.map(parseComment);
    const idSet = new Set(parsed.map((c) => c.id));
    const repliesMap = new Map<string, ParsedComment[]>();
    const roots: ParsedComment[] = [];

    parsed.forEach((c) => {
      if (c.isReply && c.parentId && idSet.has(c.parentId)) {
        const arr = repliesMap.get(c.parentId) || [];
        arr.push(c);
        repliesMap.set(c.parentId, arr);
      } else {
        roots.push(c);
      }
    });

    return { rootComments: roots, repliesByParent: repliesMap };
  }, [comments]);

  // Main comment submission
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

      setContent("");
      setStatusMessage({
        type: "success",
        text: "Thank You for commenting!",
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

  // Reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingTo) return;
    setStatusMessage(null);

    const nameToUse = (replyAuthorName.trim() || authorName.trim());
    if (!nameToUse || !replyContent.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please provide your name and reply text.",
      });
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
          authorEmail: (replyAuthorEmail.trim() || authorEmail.trim()) || undefined,
          content: replyContent.trim(),
          parentId: replyingTo.commentId,
          parentAuthor: replyingTo.authorName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit reply");
      }

      setReplyContent("");
      setReplyingTo(null);
      setStatusMessage({
        type: "success",
        text: "Thank You for commenting!",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleStartReply = (commentId: string, targetAuthor: string) => {
    if (replyingTo?.commentId === commentId) {
      setReplyingTo(null);
    } else {
      setReplyingTo({ commentId, authorName: targetAuthor });
      setReplyContent("");
      if (!replyAuthorName && authorName) {
        setReplyAuthorName(authorName);
      }
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
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
          <span>Discussion</span>
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
              {statusMessage.type === "success" ? "Thank You!" : "Submission Failed"}
            </p>
            <p className="text-xs mt-0.5 opacity-90">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* ─ Leave a Comment Form ─ */}
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs mb-10">
        <h4 className="font-extrabold text-base text-slate-900 mb-1">
          Leave a Comment
        </h4>
        <p className="text-xs text-slate-500 mb-5">
          Join the conversation and share your insights or questions with the community.
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
            <span className="text-[11px] text-slate-400">
              Share your thoughts with the community
            </span>

            <button
              type="submit"
              disabled={isSubmitting || !authorName.trim() || !content.trim()}
              className="stylish-btn btn-primary btn-sm flex items-center justify-center gap-2 font-bold px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
        {rootComments.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-slate-700">No comments yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Be the first to share your thoughts on this article!
            </p>
          </div>
        ) : (
          rootComments.map((comment) => {
            const replies = repliesByParent.get(comment.id) || [];
            const isReplying = replyingTo?.commentId === comment.id;

            return (
              <div
                key={comment.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
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

                {/* Comment Text */}
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-12">
                  {comment.cleanText}
                </p>

                {/* Action Bar (Reply Button) */}
                <div className="pl-12 mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleStartReply(comment.id, comment.authorName)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer py-1"
                  >
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>{isReplying ? "Cancel Reply" : "Reply"}</span>
                  </button>
                  {replies.length > 0 && (
                    <span className="text-xs text-slate-400 font-medium">
                      {replies.length} {replies.length === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="ml-4 sm:ml-12 mt-4 p-4 rounded-xl bg-slate-50 border border-indigo-100 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Replying to @{comment.authorName}
                      </span>
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Close reply form"
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
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <input
                          type="email"
                          placeholder="Your Email (optional)"
                          value={replyAuthorEmail}
                          onChange={(e) => setReplyAuthorEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <textarea
                        required
                        rows={3}
                        maxLength={1500}
                        placeholder={`Write your reply to ${comment.authorName}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingReply || !replyContent.trim() || !(replyAuthorName.trim() || authorName.trim())}
                          className="stylish-btn btn-primary btn-xs font-bold px-4 py-1.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingReply ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3" />
                              <span>Post Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Nested Replies Stream */}
                {replies.length > 0 && (
                  <div className="ml-4 sm:ml-12 mt-4 pt-3 border-t border-slate-100 space-y-3">
                    {replies.map((reply) => {
                      const isReplyingToSub = replyingTo?.commentId === reply.id;

                      return (
                        <div
                          key={reply.id}
                          className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {reply.authorName ? reply.authorName.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                              </div>
                              <div>
                                <h6 className="text-xs font-bold text-slate-900 leading-tight">
                                  {reply.authorName}
                                </h6>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(reply.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                              <CornerDownRight className="w-3 h-3" />
                              @{reply.parentAuthor || comment.authorName}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-9">
                            {reply.cleanText}
                          </p>

                          <div className="pl-9 mt-2 flex items-center">
                            <button
                              onClick={() => handleStartReply(reply.id, reply.authorName)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer"
                            >
                              <CornerDownRight className="w-3 h-3" />
                              <span>{isReplyingToSub ? "Cancel Reply" : "Reply"}</span>
                            </button>
                          </div>

                          {/* Sub-reply inline form */}
                          {isReplyingToSub && (
                            <div className="ml-4 mt-3 p-3 rounded-xl bg-white border border-indigo-100 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between mb-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                  <CornerDownRight className="w-3 h-3" />
                                  Replying to @{reply.authorName}
                                </span>
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="text-slate-400 hover:text-slate-600 p-0.5"
                                  title="Close"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <form onSubmit={handleReplySubmit} className="space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    required
                                    placeholder="Your Name *"
                                    value={replyAuthorName}
                                    onChange={(e) => setReplyAuthorName(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  <input
                                    type="email"
                                    placeholder="Your Email (optional)"
                                    value={replyAuthorEmail}
                                    onChange={(e) => setReplyAuthorEmail(e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <textarea
                                  required
                                  rows={2}
                                  maxLength={1500}
                                  placeholder={`Write your reply to ${reply.authorName}...`}
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setReplyingTo(null)}
                                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={isSubmittingReply || !replyContent.trim() || !(replyAuthorName.trim() || authorName.trim())}
                                    className="stylish-btn btn-primary btn-xs font-bold px-3 py-1 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  >
                                    {isSubmittingReply ? "Submitting..." : "Post Reply"}
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
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
