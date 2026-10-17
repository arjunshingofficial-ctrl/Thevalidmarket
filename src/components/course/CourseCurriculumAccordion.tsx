"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  Play,
  Lock,
  Unlock,
  Clock,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { formatUsd } from "@/lib/currency";
import { addToCart } from "@/lib/cart";

export interface Lesson {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  duration?: number | null;
  isFree?: boolean | null;
}

export interface Module {
  id: string;
  title: string;
  description?: string | null;
  lessons: Lesson[];
}

export interface CourseCurriculumAccordionProps {
  modules: Module[];
  courseTitle: string;
  courseSlug?: string;
  productId?: string;
  courseThumbnail?: string | null;
  price?: number;
  salePrice?: number | null;
}

/**
 * Helper to identify and parse YouTube, Vimeo, or direct video URLs
 */
function getVideoEmbed(url?: string | null): {
  type: "youtube" | "vimeo" | "video" | "iframe";
  embedUrl: string;
} | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&badge=0`,
    };
  }

  // HTML5 Video
  if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(trimmed)) {
    return {
      type: "video",
      embedUrl: trimmed,
    };
  }

  // Generic Iframe / Stream
  if (trimmed.includes("embed") || trimmed.includes("stream") || trimmed.includes("player")) {
    return {
      type: "iframe",
      embedUrl: trimmed,
    };
  }

  // Fallback to video
  return {
    type: "video",
    embedUrl: trimmed,
  };
}

export default function CourseCurriculumAccordion({
  modules,
  courseTitle,
  courseSlug,
  productId,
  courseThumbnail,
  price,
  salePrice,
}: CourseCurriculumAccordionProps) {
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Collapsed state for modules
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Active preview lesson state
  const [activePreview, setActivePreview] = useState<{
    lesson: Lesson;
    moduleTitle: string;
    modIdx: number;
    lessonIdx: number;
  } | null>(null);

  // Locked lesson modal state
  const [lockedLesson, setLockedLesson] = useState<{
    lesson: Lesson;
    moduleTitle: string;
  } | null>(null);

  // Flatten all free lessons for navigation inside modal
  const allFreeLessons = useMemo(() => {
    const list: Array<{
      lesson: Lesson;
      moduleTitle: string;
      modIdx: number;
      lessonIdx: number;
    }> = [];
    modules.forEach((mod, modIdx) => {
      mod.lessons.forEach((l, lessonIdx) => {
        if (l.isFree) {
          list.push({ lesson: l, moduleTitle: mod.title, modIdx, lessonIdx });
        }
      });
    });
    return list;
  }, [modules]);

  // Handle ESC key to close modal & lock body scroll
  useEffect(() => {
    if (!activePreview && !lockedLesson) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePreview(null);
        setLockedLesson(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [activePreview, lockedLesson]);

  const toggleModule = (modId: string) => {
    setCollapsed((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleOpenPreview = (
    lesson: Lesson,
    moduleTitle: string,
    modIdx: number,
    lessonIdx: number
  ) => {
    setActivePreview({ lesson, moduleTitle, modIdx, lessonIdx });
  };

  const handleEnroll = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsEnrolling(true);

    if (productId) {
      addToCart({
        id: productId,
        name: courseTitle,
        slug: courseSlug || "",
        price: (salePrice !== null && salePrice !== undefined && salePrice > 0 ? salePrice : price) || 0,
        image: courseThumbnail || undefined,
      });
    }

    // Unlock body scroll and close modal
    document.body.style.overflow = "";
    setActivePreview(null);
    setLockedLesson(null);

    // Navigate to checkout
    router.push("/checkout");
  };

  const currentFreeIndex = activePreview
    ? allFreeLessons.findIndex((item) => item.lesson.id === activePreview.lesson.id)
    : -1;

  const prevFreeLesson = currentFreeIndex > 0 ? allFreeLessons[currentFreeIndex - 1] : null;
  const nextFreeLesson =
    currentFreeIndex >= 0 && currentFreeIndex < allFreeLessons.length - 1
      ? allFreeLessons[currentFreeIndex + 1]
      : null;

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
  const embed = activePreview ? getVideoEmbed(activePreview.lesson.videoUrl) : null;
  const displayPrice = salePrice !== null && salePrice !== undefined && salePrice > 0 ? salePrice : price;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>Course Curriculum</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span>
              {modules.length} {modules.length === 1 ? "Module" : "Modules"} • {totalLessons}{" "}
              {totalLessons === 1 ? "Lesson" : "Lessons"}
            </span>
            {allFreeLessons.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <Unlock className="w-3 h-3 text-emerald-600" />
                {allFreeLessons.length} Free {allFreeLessons.length === 1 ? "Preview" : "Previews"}{" "}
                Available
              </span>
            )}
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
          Self-Paced Learning
        </span>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.map((mod, modIdx) => {
          const isCollapsed = collapsed[mod.id] ?? false;

          return (
            <div
              key={mod.id}
              className="rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-50/40 transition-all hover:border-slate-300 shadow-2xs"
            >
              {/* Module Header Button */}
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className="w-full p-4 bg-white border-b border-slate-100 flex items-center justify-between text-left transition-colors hover:bg-slate-50/80 cursor-pointer"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0 pr-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    {modIdx + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {mod.title}
                    </h3>
                    {mod.description && (
                      <div
                        className="text-xs text-slate-500 mt-0.5 line-clamp-1 prose prose-xs max-w-none font-normal"
                        dangerouslySetInnerHTML={{ __html: mod.description }}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 font-medium">
                    {mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                  <div className="p-1 rounded-md bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors">
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Lessons List */}
              {!isCollapsed && mod.lessons.length > 0 && (
                <div className="divide-y divide-slate-100 bg-white">
                  {mod.lessons.map((lesson, lessonIdx) => {
                    const isFree = !!lesson.isFree;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          if (isFree) {
                            handleOpenPreview(lesson, mod.title, modIdx, lessonIdx);
                          } else {
                            setLockedLesson({ lesson, moduleTitle: mod.title });
                          }
                        }}
                        className={`py-3 px-4 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isFree
                            ? "hover:bg-emerald-50/50 group/lesson"
                            : "hover:bg-slate-50/70"
                        }`}
                      >
                        {/* Title & Icon */}
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <span className="text-[11px] font-mono text-slate-400 w-6 shrink-0">
                            {modIdx + 1}.{lessonIdx + 1}
                          </span>
                          <PlayCircle
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isFree
                                ? "text-emerald-600 group-hover/lesson:scale-110"
                                : "text-slate-400"
                            }`}
                          />
                          <span
                            className={`font-semibold truncate ${
                              isFree
                                ? "text-slate-900 group-hover/lesson:text-emerald-700"
                                : "text-slate-700"
                            }`}
                          >
                            {lesson.title}
                          </span>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {isFree ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs group-hover/lesson:bg-emerald-600 transition-colors">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>Free Preview</span>
                            </span>
                          ) : (
                            <span
                              className="text-slate-400 flex items-center gap-1 text-[11px]"
                              title="Locked: Enrollment Required"
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-300" />
                            </span>
                          )}

                          {lesson.duration && lesson.duration > 0 && (
                            <span className="text-slate-400 font-mono text-[11px]">
                              {lesson.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── FREE PREVIEW MODAL ── */}
      {activePreview && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[94vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> Free Course Preview
                  </span>
                  <span className="text-xs text-slate-400 font-medium truncate">
                    {activePreview.moduleTitle}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
                  {activePreview.lesson.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                aria-label="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Section */}
            <div className="aspect-video w-full bg-black relative shrink-0">
              {embed ? (
                embed.type === "youtube" || embed.type === "vimeo" || embed.type === "iframe" ? (
                  <iframe
                    src={embed.embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activePreview.lesson.title}
                  />
                ) : (
                  <video
                    src={embed.embedUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 shadow-lg">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-white text-base">
                    Lesson Notes &amp; Reading Preview
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    This free preview lesson is text &amp; lab guide based. Read the complete lesson
                    material, code snippets, and instructions below.
                  </p>
                </div>
              )}
            </div>

            {/* Scrollable Content & Lesson Notes */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-900 text-slate-200">
              {/* Prev / Next Free Lesson Controls */}
              {allFreeLessons.length > 1 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  {prevFreeLesson ? (
                    <button
                      type="button"
                      onClick={() => setActivePreview(prevFreeLesson)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-emerald-400" />
                      <span>Prev: {prevFreeLesson.lesson.title}</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextFreeLesson ? (
                    <button
                      type="button"
                      onClick={() => setActivePreview(nextFreeLesson)}
                      className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors cursor-pointer"
                    >
                      <span>Next: {nextFreeLesson.lesson.title}</span>
                      <ChevronRight className="w-4 h-4 text-emerald-400" />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              )}

              {/* Lesson Content / Notes */}
              {activePreview.lesson.content ? (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <FileText className="w-4 h-4" />
                    <span>Lesson Syllabus, Instructions &amp; Lab Notes</span>
                  </div>

                  {/<[a-z][\s\S]*>/i.test(activePreview.lesson.content) ? (
                    <div
                      className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: activePreview.lesson.content }}
                    />
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                      {activePreview.lesson.content}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
                  No additional notes attached for this lesson.
                </div>
              )}
            </div>

            {/* Modal Bottom CTA */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-center sm:text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ready to unlock the full course?</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Get instant lifetime access to all {totalLessons} video lessons, updates, and materials.
                </p>
              </div>

              <button
                type="button"
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>
                      Enroll Full Course {displayPrice ? `(${formatUsd(displayPrice)})` : ""}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOCKED LESSON PROMPT MODAL ── */}
      {lockedLesson && (
        <div
          className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLockedLesson(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Enrollment Required
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-2">
                {lockedLesson.lesson.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                This lesson is part of the premium curriculum. Enroll in the course to unlock all video
                lectures, downloads, and lifetime updates.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>
                      Enroll in Course {displayPrice ? `(${formatUsd(displayPrice)})` : ""}
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setLockedLesson(null)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
