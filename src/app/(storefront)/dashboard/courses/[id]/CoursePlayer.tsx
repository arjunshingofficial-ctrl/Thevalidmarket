"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  PlayCircle,
  Video,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Award,
  BookOpen,
  Loader2,
} from "lucide-react";
import { toggleLessonProgressAction } from "@/lib/actions/courses";

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  attachments: string | null;
  duration: number | null;
  sortOrder: number;
  isFree: boolean;
}

interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
}

interface CoursePlayerProps {
  course: {
    id: string;
    instructor: string | null;
    product: {
      name: string;
      slug: string;
    };
    modules: Module[];
  };
  initialProgressMap: Record<string, boolean>;
  initialLessonId?: string;
}

export default function CoursePlayer({
  course,
  initialProgressMap,
  initialLessonId,
}: CoursePlayerProps) {
  // Flatten all lessons in order
  const allLessons: { lesson: Lesson; moduleTitle: string; modIdx: number; lessonIdx: number }[] = [];
  course.modules.forEach((mod, modIdx) => {
    mod.lessons.forEach((les, lessonIdx) => {
      allLessons.push({ lesson: les, moduleTitle: mod.title, modIdx, lessonIdx });
    });
  });

  // Determine active lesson
  const defaultLesson =
    allLessons.find((item) => item.lesson.id === initialLessonId)?.lesson ||
    allLessons[0]?.lesson ||
    null;

  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    defaultLesson ? defaultLesson.id : null
  );
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>(initialProgressMap);
  const [savingProgress, setSavingProgress] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeItem = allLessons.find((item) => item.lesson.id === activeLessonId);
  const activeLesson = activeItem?.lesson || null;
  const currentIndex = allLessons.findIndex((item) => item.lesson.id === activeLessonId);

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1].lesson : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1].lesson
      : null;

  // Calculate overall progress
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((item) => progressMap[item.lesson.id]).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Toggle completion
  async function handleToggleComplete(lessonId: string) {
    const currentCompleted = !!progressMap[lessonId];
    const newCompleted = !currentCompleted;

    // Optimistic UI update
    setProgressMap((prev) => ({
      ...prev,
      [lessonId]: newCompleted,
    }));

    setSavingProgress(true);
    try {
      await toggleLessonProgressAction(lessonId, newCompleted);
    } catch (err) {
      // Revert on error
      setProgressMap((prev) => ({
        ...prev,
        [lessonId]: currentCompleted,
      }));
      console.error("Failed to update lesson progress:", err);
    } finally {
      setSavingProgress(false);
    }
  }

  // Helper for YouTube embed
  function getYouTubeEmbedUrl(url: string | null) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0` : null;
  }

  const embedUrl = activeLesson ? getYouTubeEmbedUrl(activeLesson.videoUrl) : null;
  const isCompleted = activeLesson ? !!progressMap[activeLesson.id] : false;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 sm:-m-6 bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/courses"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to My Courses"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-white truncate max-w-md">
              {course.product.name}
            </h1>
            <p className="text-[11px] text-slate-400">
              Instructor: {course.instructor || "The Valid Market Academy"}
            </p>
          </div>
        </div>

        {/* Progress Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-28 sm:w-36 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              {progressPercent}%
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Lesson Viewport (Left/Center) */}
        <main className="flex-1 overflow-y-auto bg-slate-900 flex flex-col">
          {activeLesson ? (
            <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 flex-1 flex flex-col">
              {/* Video Player */}
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                ) : activeLesson.videoUrl ? (
                  <video
                    src={activeLesson.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-950 to-slate-900">
                    <PlayCircle className="w-16 h-16 text-slate-700 mb-3" />
                    <p className="font-semibold text-slate-300 text-sm">
                      {activeLesson.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      No video stream attached. Read notes and materials below.
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson Controls & Header */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                      {activeItem?.moduleTitle}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                      {activeLesson.title}
                    </h2>
                    {activeLesson.duration && activeLesson.duration > 0 && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5" /> {activeLesson.duration} Minutes
                      </p>
                    )}
                  </div>

                  {/* Mark as Complete Button */}
                  <button
                    onClick={() => handleToggleComplete(activeLesson.id)}
                    disabled={savingProgress}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all shadow-sm ${
                      isCompleted
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    }`}
                  >
                    {savingProgress ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{isCompleted ? "Completed" : "Mark as Complete"}</span>
                  </button>
                </div>

                {/* Prev / Next Navigation */}
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  {prevLesson ? (
                    <button
                      onClick={() => setActiveLessonId(prevLesson.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg flex items-center gap-1.5 border border-slate-800"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous Lesson
                    </button>
                  ) : (
                    <div />
                  )}

                  {nextLesson && (
                    <button
                      onClick={() => setActiveLessonId(nextLesson.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      Next Lesson <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Lesson Notes & Content */}
              {activeLesson.content && (
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" /> Lesson Content & Notes
                  </h3>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {activeLesson.content}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <BookOpen className="w-12 h-12 mb-3 text-slate-600" />
              <p className="font-semibold text-slate-300">No lessons available in this course yet</p>
              <p className="text-xs mt-1">Please check back later or contact the instructor.</p>
            </div>
          )}
        </main>

        {/* Sidebar: Curriculum Outline */}
        <aside
          className={`fixed inset-y-14 right-0 z-30 w-80 sm:w-96 bg-slate-950 border-l border-slate-800 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Course Content
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {completedCount} of {totalLessons} completed ({progressPercent}%)
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {course.modules.map((mod, modIdx) => (
              <div key={mod.id} className="p-3">
                <div className="mb-2 px-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Module {modIdx + 1}
                  </span>
                  <h3 className="font-semibold text-xs text-slate-200 mt-0.5">{mod.title}</h3>
                </div>

                <div className="space-y-1">
                  {mod.lessons.map((les, lessonIdx) => {
                    const active = les.id === activeLessonId;
                    const done = !!progressMap[les.id];

                    return (
                      <button
                        key={les.id}
                        onClick={() => {
                          setActiveLessonId(les.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between gap-3 transition-colors ${
                          active
                            ? "bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 font-semibold"
                            : "hover:bg-slate-900 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(les.id);
                            }}
                            className="flex-shrink-0"
                          >
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>
                          <span className="truncate">
                            {modIdx + 1}.{lessonIdx + 1} {les.title}
                          </span>
                        </div>

                        {les.duration && les.duration > 0 && (
                          <span className="text-[10px] text-slate-500 flex-shrink-0">
                            {les.duration}m
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
