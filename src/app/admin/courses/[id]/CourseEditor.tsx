"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Video,
  FileText,
  Clock,
  Eye,
  CheckCircle,
  ExternalLink,
  Loader2,
  FolderPlus,
  PlaySquare,
  Lock,
  Unlock,
  ImageIcon,
  Save,
} from "lucide-react";
import {
  updateCourseAction,
  setCoursePublishStatusAction,
  addModuleAction,
  deleteModuleAction,
  addLessonAction,
  deleteLessonAction,
} from "@/lib/actions/courses";

interface CourseEditorProps {
  course: any;
}

export default function CourseEditor({ course }: CourseEditorProps) {
  const router = useRouter();

  // State
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Thumbnail state
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(course.thumbnailUrl || "");
  const [thumbnailSaving, setThumbnailSaving] = useState(false);

  async function handleSaveThumbnail() {
    setThumbnailSaving(true);
    setMsg(null);
    try {
      await updateCourseAction(course.id, { thumbnailUrl: thumbnailUrl.trim() || "" });
      setMsg({ type: "success", text: "Thumbnail saved successfully!" });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to save thumbnail" });
    } finally {
      setThumbnailSaving(false);
    }
  }

  // Module Modal state
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");

  // Lesson Modal state
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("10");
  const [lessonIsFree, setLessonIsFree] = useState(false);

  // Publish toggle
  async function handleTogglePublish() {
    setPublishLoading(true);
    setMsg(null);
    try {
      const isCurrentlyPublished = course.status === "PUBLISHED";
      await setCoursePublishStatusAction(course.id, !isCurrentlyPublished);
      setMsg({
        type: "success",
        text: isCurrentlyPublished ? "Course saved as DRAFT" : "Course successfully PUBLISHED!",
      });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update status" });
    } finally {
      setPublishLoading(false);
    }
  }

  // Add Module
  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await addModuleAction(course.id, {
        title: moduleTitle,
        description: moduleDesc,
      });
      setShowModuleModal(false);
      setModuleTitle("");
      setModuleDesc("");
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to add module" });
    } finally {
      setLoading(false);
    }
  }

  // Delete Module
  async function handleDeleteModule(modId: string) {
    if (!confirm("Are you sure you want to delete this module and all its lessons?")) return;
    setLoading(true);
    try {
      await deleteModuleAction(modId);
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to delete module" });
    } finally {
      setLoading(false);
    }
  }

  // Add Lesson
  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!activeModuleId || !lessonTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await addLessonAction(activeModuleId, {
        title: lessonTitle,
        content: lessonContent,
        videoUrl: lessonVideoUrl,
        duration: parseInt(lessonDuration, 10) || 0,
        isFree: lessonIsFree,
      });
      setActiveModuleId(null);
      setLessonTitle("");
      setLessonContent("");
      setLessonVideoUrl("");
      setLessonDuration("10");
      setLessonIsFree(false);
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to add lesson" });
    } finally {
      setLoading(false);
    }
  }

  // Delete Lesson
  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Are you sure you want to delete this lesson?")) return;
    setLoading(true);
    try {
      await deleteLessonAction(lessonId);
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to delete lesson" });
    } finally {
      setLoading(false);
    }
  }

  const totalLessons = course.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{course.product.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  course.status === "PUBLISHED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {course.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instructor: <span className="text-slate-700 font-medium">{course.instructor}</span> • Slug:{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">
                {course.product.slug}
              </code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {course.status === "PUBLISHED" && (
            <Link
              href={`/product/${course.product.slug}`}
              target="_blank"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> View on Store
            </Link>
          )}

          <button
            onClick={handleTogglePublish}
            disabled={publishLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors ${
              course.status === "PUBLISHED"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {publishLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {course.status === "PUBLISHED" ? "Unpublish Course" : "Publish Course Now"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Thumbnail Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Course Thumbnail</h2>
            <p className="text-xs text-slate-500">Paste an image URL to display as the course cover</p>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Preview */}
            <div className="w-full sm:w-56 h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0 flex items-center justify-center">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Course thumbnail preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                  <p className="text-xs">No thumbnail</p>
                </div>
              )}
            </div>
            {/* Input */}
            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/course-thumbnail.jpg"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">Recommended: 1280×720px (16:9). Use any public image URL (e.g. Imgur, CDN, Google Drive direct link).</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveThumbnail}
                  disabled={thumbnailSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                >
                  {thumbnailSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Thumbnail
                </button>
                {thumbnailUrl && (
                  <button
                    onClick={() => setThumbnailUrl("")}
                    className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Modules</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{course.modules.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Lessons</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalLessons}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Regular Price</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">৳ {course.product.price}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Sale Price</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {course.product.salePrice ? `৳ ${course.product.salePrice}` : "None"}
          </p>
        </div>
      </div>

      {/* Curriculum Builder */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" /> Course Curriculum & Modules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize syllabus into modules and lessons with videos and notes
            </p>
          </div>
          <button
            onClick={() => setShowModuleModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
          >
            <FolderPlus className="w-4 h-4" /> Add Module
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {course.modules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <FolderPlus className="mx-auto w-10 h-10 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-800">No modules added yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Start by adding your first module (e.g. &ldquo;Module 1: Getting Started&rdquo;), then add lessons to it.
              </p>
              <button
                onClick={() => setShowModuleModal(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add First Module
              </button>
            </div>
          ) : (
            course.modules.map((mod: any, modIdx: number) => (
              <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {/* Module Header */}
                <div className="p-4 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      {modIdx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{mod.title}</h3>
                      {mod.description && <p className="text-xs text-slate-500">{mod.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModuleId(mod.id)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" /> Add Lesson
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="divide-y divide-slate-100 bg-white">
                  {mod.lessons.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No lessons inside this module yet. Click &ldquo;Add Lesson&rdquo; above.
                    </div>
                  ) : (
                    mod.lessons.map((lesson: any, lessonIdx: number) => (
                      <div
                        key={lesson.id}
                        className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <PlaySquare className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono">
                                {modIdx + 1}.{lessonIdx + 1}
                              </span>
                              <span className="font-medium text-slate-900 text-xs sm:text-sm">
                                {lesson.title}
                              </span>
                              {lesson.isFree ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Unlock className="w-3 h-3" /> FREE PREVIEW
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  <Lock className="w-3 h-3" /> PAID
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              {lesson.duration > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {lesson.duration}m
                                </span>
                              )}
                              {lesson.videoUrl && (
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Video className="w-3 h-3" /> Video Attached
                                </span>
                              )}
                              {lesson.content && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Content ({lesson.content.length} chars)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete lesson"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add New Module</h3>
            <form onSubmit={handleAddModule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Module Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction & Fundamentals"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What will learners understand in this module?"
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {activeModuleId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Lesson to Module</h3>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1.1 Course Setup & Tool Installation"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Video URL (YouTube, Vimeo, MP4 or CDN embed)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonIsFree}
                      onChange={(e) => setLessonIsFree(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Free Preview Lesson
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lesson Notes & Content (Markdown / Text)
                </label>
                <textarea
                  rows={4}
                  placeholder="Key concepts, step-by-step instructions, cheat sheet, code snippets..."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModuleId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
