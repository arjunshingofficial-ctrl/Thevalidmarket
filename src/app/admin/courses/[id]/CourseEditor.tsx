"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
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
  Sparkles,
  Layers,
  Copy,
  Check,
  Award,
  Globe,
  Tag,
  DollarSign,
  X,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  updateCourseAction,
  setCoursePublishStatusAction,
  addModuleAction,
  updateModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  addLessonAction,
  updateLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
} from "@/lib/actions/courses";

interface CourseEditorProps {
  course: any;
}

export default function CourseEditor({ course }: CourseEditorProps) {
  const router = useRouter();

  // Tab State: "design" | "curriculum"
  const [activeTab, setActiveTab] = useState<"design" | "curriculum">("design");

  // Notifications
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initial metadata
  const initialMeta = (() => {
    try {
      return course.product?.metadata ? JSON.parse(course.product.metadata) : {};
    } catch {
      return {};
    }
  })();

  // Course Details State
  const [courseName, setCourseName] = useState(course.product?.name || "");
  const [instructor, setInstructor] = useState(course.instructor || "");
  const [price, setPrice] = useState(String(course.product?.price ?? "0"));
  const [salePrice, setSalePrice] = useState(course.product?.salePrice !== null && course.product?.salePrice !== undefined ? String(course.product.salePrice) : "");
  const [shortDesc, setShortDesc] = useState(course.product?.shortDesc || "");
  const [description, setDescription] = useState(course.product?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(course.thumbnailUrl || initialMeta.image || "");
  const [skillLevel, setSkillLevel] = useState<string>(initialMeta.skillLevel || "All Skill Levels");
  const [language, setLanguage] = useState<string>(initialMeta.language || "English & Global Access");
  const [badge, setBadge] = useState<string>(initialMeta.badge || "");
  const [highlights, setHighlights] = useState<string>(
    Array.isArray(initialMeta.highlights)
      ? initialMeta.highlights.join("\n")
      : (typeof initialMeta.highlights === "string" ? initialMeta.highlights : "")
  );
  const [detailsSaving, setDetailsSaving] = useState(false);

  // Curriculum State
  const [courseModules, setCourseModules] = useState<any[]>(course.modules || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCourseModules(course.modules || []);
  }, [course.modules]);

  // Add Module State
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");

  // Edit Module State
  const [editingModule, setEditingModule] = useState<any | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDesc, setEditModuleDesc] = useState("");

  // Add Lesson State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("10");
  const [lessonIsFree, setLessonIsFree] = useState(false);

  // Edit Lesson State
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonContent, setEditLessonContent] = useState("");
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("10");
  const [editLessonIsFree, setEditLessonIsFree] = useState(false);

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/courses/${course.product.slug}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // Save Course Page & Details
  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!courseName.trim()) {
      setMsg({ type: "error", text: "Course title cannot be empty." });
      return;
    }

    setDetailsSaving(true);
    setMsg(null);

    const parsedPrice = parseFloat(price);
    const parsedSale = salePrice.trim() ? parseFloat(salePrice) : undefined;

    try {
      await updateCourseAction(course.id, {
        name: courseName.trim(),
        instructor: instructor.trim(),
        price: isNaN(parsedPrice) ? 0 : parsedPrice,
        salePrice: parsedSale !== undefined && !isNaN(parsedSale) ? parsedSale : undefined,
        shortDesc: shortDesc.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        skillLevel: skillLevel.trim(),
        language: language.trim(),
        badge: badge.trim(),
        highlights: highlights.split("\n").map(s => s.trim()).filter(Boolean),
      });

      setMsg({ type: "success", text: "Course page details & design saved successfully!" });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to save course details." });
    } finally {
      setDetailsSaving(false);
    }
  }

  // Publish / Unpublish Toggle
  async function handleTogglePublish() {
    setPublishLoading(true);
    setMsg(null);
    try {
      const isCurrentlyPublished = course.status === "PUBLISHED";
      await setCoursePublishStatusAction(course.id, !isCurrentlyPublished);
      setMsg({
        type: "success",
        text: isCurrentlyPublished ? "Course set to DRAFT mode" : "Course successfully PUBLISHED!",
      });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update status." });
    } finally {
      setPublishLoading(false);
    }
  }

  // Move Module Up / Down (Change Sequence)
  async function handleMoveModule(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= courseModules.length) return;

    const updated = [...courseModules];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setCourseModules(updated);
    setMsg(null);

    try {
      await reorderModulesAction(course.id, updated.map(m => m.id));
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update module sequence." });
      setCourseModules(course.modules || []);
    }
  }

  // Move Lesson Up / Down within Module (Change Sequence)
  async function handleMoveLesson(moduleId: string, lessonIndex: number, direction: "up" | "down") {
    const modIndex = courseModules.findIndex(m => m.id === moduleId);
    if (modIndex === -1) return;

    const mod = courseModules[modIndex];
    const targetIndex = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIndex < 0 || targetIndex >= mod.lessons.length) return;

    const updatedLessons = [...mod.lessons];
    const [moved] = updatedLessons.splice(lessonIndex, 1);
    updatedLessons.splice(targetIndex, 0, moved);

    const updatedModules = [...courseModules];
    updatedModules[modIndex] = {
      ...mod,
      lessons: updatedLessons,
    };

    setCourseModules(updatedModules);
    setMsg(null);

    try {
      await reorderLessonsAction(moduleId, updatedLessons.map(l => l.id));
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update lesson sequence." });
      setCourseModules(course.modules || []);
    }
  }

  // Add Module
  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await addModuleAction(course.id, {
        title: moduleTitle.trim(),
        description: moduleDesc.trim() || undefined,
      });
      if (res.module) {
        setCourseModules(prev => [...prev, { ...res.module, lessons: [] }]);
      }
      setShowModuleModal(false);
      setModuleTitle("");
      setModuleDesc("");
      setMsg({ type: "success", text: "Module added successfully!" });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to add module" });
    } finally {
      setLoading(false);
    }
  }

  // Open Edit Module Modal
  const handleOpenEditModule = (mod: any) => {
    setEditingModule(mod);
    setEditModuleTitle(mod.title || "");
    setEditModuleDesc(mod.description || "");
  };

  // Update Module
  async function handleUpdateModule(e: React.FormEvent) {
    e.preventDefault();
    if (!editingModule || !editModuleTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      await updateModuleAction(editingModule.id, {
        title: editModuleTitle.trim(),
        description: editModuleDesc.trim() || undefined,
      });
      setCourseModules(prev =>
        prev.map(m =>
          m.id === editingModule.id
            ? { ...m, title: editModuleTitle.trim(), description: editModuleDesc }
            : m
        )
      );
      setEditingModule(null);
      setMsg({ type: "success", text: "Module updated successfully!" });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update module" });
    } finally {
      setLoading(false);
    }
  }

  // Delete Module
  async function handleDeleteModule(moduleId: string) {
    if (!confirm("Are you sure? All lessons inside this module will be permanently removed.")) return;
    setLoading(true);
    try {
      await deleteModuleAction(moduleId);
      setCourseModules(prev => prev.filter(m => m.id !== moduleId));
      setMsg({ type: "success", text: "Module deleted." });
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
      const res = await addLessonAction(activeModuleId, {
        title: lessonTitle.trim(),
        content: lessonContent || undefined,
        videoUrl: lessonVideoUrl.trim() || undefined,
        duration: parseInt(lessonDuration) || 0,
        isFree: lessonIsFree,
      });
      if (res.lesson) {
        setCourseModules(prev =>
          prev.map(m =>
            m.id === activeModuleId
              ? { ...m, lessons: [...m.lessons, res.lesson] }
              : m
          )
        );
      }
      setActiveModuleId(null);
      setLessonTitle("");
      setLessonContent("");
      setLessonVideoUrl("");
      setLessonDuration("10");
      setLessonIsFree(false);
      setMsg({ type: "success", text: "Lesson created successfully!" });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to add lesson" });
    } finally {
      setLoading(false);
    }
  }

  // Open Edit Lesson Modal
  const handleOpenEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setEditLessonTitle(lesson.title || "");
    setEditLessonContent(lesson.content || "");
    setEditLessonVideoUrl(lesson.videoUrl || "");
    setEditLessonDuration(String(lesson.duration ?? 0));
    setEditLessonIsFree(!!lesson.isFree);
  };

  // Update Lesson
  async function handleUpdateLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLesson || !editLessonTitle.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await updateLessonAction(editingLesson.id, {
        title: editLessonTitle.trim(),
        content: editLessonContent || "",
        videoUrl: editLessonVideoUrl.trim() || "",
        duration: parseInt(editLessonDuration) || 0,
        isFree: editLessonIsFree,
      });
      setCourseModules(prev =>
        prev.map(m => ({
          ...m,
          lessons: m.lessons.map((l: any) =>
            l.id === editingLesson.id ? { ...l, ...res.lesson } : l
          ),
        }))
      );
      setEditingLesson(null);
      setMsg({ type: "success", text: "Lesson updated successfully!" });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to update lesson" });
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
      setCourseModules(prev =>
        prev.map(m => ({
          ...m,
          lessons: m.lessons.filter((l: any) => l.id !== lessonId),
        }))
      );
      setMsg({ type: "success", text: "Lesson deleted." });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to delete lesson" });
    } finally {
      setLoading(false);
    }
  }

  const totalLessons = courseModules.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin/courses"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                {course.product.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  course.status === "PUBLISHED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {course.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span>Instructor: <strong className="text-slate-700">{course.instructor || "Not assigned"}</strong></span>
              <span>•</span>
              <span className="font-mono text-slate-400">/courses/{course.product.slug}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Direct Link to Storefront Course Landing Page */}
          <Link
            href={`/courses/${course.product.slug}`}
            target="_blank"
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>View Landing Page</span>
          </Link>

          <button
            type="button"
            onClick={handleCopyLink}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors"
            title="Copy course URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Publish / Draft Toggle */}
          <button
            onClick={handleTogglePublish}
            disabled={publishLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95 ${
              course.status === "PUBLISHED"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {publishLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{course.status === "PUBLISHED" ? "Unpublish Course" : "Publish Course Now"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold border flex items-center gap-2 animate-in fade-in ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {msg.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("design")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === "design"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Course Page Design &amp; Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("curriculum")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === "curriculum"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Curriculum &amp; Syllabus Builder ({course.modules.length} Modules • {totalLessons} Lessons)</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: COURSE PAGE DESIGN & METADATA EDITOR ───────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "design" && (
        <form onSubmit={handleSaveDetails} className="space-y-6">
          
          {/* Section: Main Identity & Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">General Information &amp; Pricing</h2>
                <p className="text-xs text-slate-500">Core details displayed on the course landing page and catalog</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Course Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Advanced Ethical Hacking & Exploit Development"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="e.g. Master Hacker, Security Researcher"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Course Badge / Tag
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Masterclass, Zero-Day Certified, Exclusive"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Regular Price ($ USD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="199.00"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Sale Price ($ USD) <span className="text-slate-400 font-normal lowercase">(optional discount)</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="99.00"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Skill Level
                </label>
                <input
                  type="text"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  placeholder="e.g. All Skill Levels, Beginner to Pro, Advanced"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Language &amp; Region Access
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. English & Global Access"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tagline / Hero Excerpt
              </label>
              <textarea
                rows={2}
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Brief high-impact summary shown in the dark hero banner..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Section: Thumbnail Image */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">Course Thumbnail &amp; Media Preview</h2>
                <p className="text-xs text-slate-500">16:9 banner preview image displayed on catalog and sticky buy card</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-full sm:w-64 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-900 relative flex items-center justify-center shrink-0">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Course Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                    <span className="text-xs font-semibold">No Image Provided</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thumbnail Image URL
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or public image URL"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900"
                />
                <p className="text-[11px] text-slate-400">
                  Recommended size: 1280×720px (16:9 ratio). Supports CDN URLs, Imgur, Cloudinary, AWS S3 direct links.
                </p>
                {thumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl("")}
                    className="text-xs text-rose-600 font-semibold hover:underline pt-1"
                  >
                    Remove Image
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Highlights & What You Will Master */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">&ldquo;What You Will Master&rdquo; Bullet Points</h2>
                <p className="text-xs text-slate-500">One bullet point per line. Displayed in the prominent checkmark box</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <textarea
                rows={6}
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="e.g. Master core principles and fundamental concepts&#10;Hands-on practical projects and real-world exercises&#10;Step-by-step guidance and best practices&#10;Industry-standard workflows and techniques"
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/40 text-slate-900 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                Tip: Enter each takeaway on a new line. The landing page will automatically render each line as an attractive checkmark item.
              </p>
            </div>
          </div>

          {/* Section: Full Detailed Description */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-slate-900">Full Course Description &amp; Overview</h2>
                <p className="text-xs text-slate-500">Detailed text, prerequisites, modules overview, and syllabus background</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <RichTextEditor
                name="description"
                value={description}
                defaultValue={description}
                onChange={(html) => setDescription(html)}
                placeholder="Write full course breakdown, prerequisites, learning outcomes, lab specifications, etc. Full rich block formatting supported..."
              />
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={detailsSaving}
              className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-60 active:scale-95"
            >
              {detailsSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Course Page...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Course Page Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: CURRICULUM & LESSONS BUILDER ───────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {activeTab === "curriculum" && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Curriculum &amp; Syllabus Modules</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reorder modules &amp; lessons, design syllabus notes with the block editor, attach videos, and set free previews
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModuleModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Add Module</span>
              </button>
            </div>

            <div className="p-5 space-y-5">
              {courseModules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                  <FolderPlus className="mx-auto w-10 h-10 text-slate-300 mb-2" />
                  <p className="font-bold text-slate-800 text-sm">No modules added yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Start by adding your first module (e.g. &ldquo;Module 1: Foundations &amp; Labs&rdquo;), then add lessons to it.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowModuleModal(true)}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Add First Module
                  </button>
                </div>
              ) : (
                courseModules.map((mod: any, modIdx: number) => (
                  <div key={mod.id} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/30 shadow-2xs">
                    {/* Module Header */}
                    <div className="p-4 bg-slate-100/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        {/* Module Sequence Reordering Buttons (Up & Down) */}
                        <div className="flex flex-col gap-0.5 shrink-0 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            disabled={modIdx === 0}
                            onClick={() => handleMoveModule(modIdx, "up")}
                            className="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                            title="Move Module Up in sequence"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={modIdx === courseModules.length - 1}
                            onClick={() => handleMoveModule(modIdx, "down")}
                            className="p-1 text-slate-500 hover:text-primary hover:bg-slate-100 rounded disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                            title="Move Module Down in sequence"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="w-7 h-7 rounded-lg bg-primary text-white text-xs font-black flex items-center justify-center shrink-0">
                          {modIdx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 flex-wrap">
                            <span>{mod.title}</span>
                            <span className="text-[11px] font-medium text-slate-400">
                              ({mod.lessons?.length || 0} {mod.lessons?.length === 1 ? "lesson" : "lessons"})
                            </span>
                          </h3>
                          {mod.description && (
                            <div
                              className="text-xs text-slate-500 mt-1 line-clamp-2 prose prose-xs max-w-none"
                              dangerouslySetInnerHTML={{ __html: mod.description }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModule(mod)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 shadow-2xs transition-colors"
                          title="Edit Module Details &amp; Syllabus Notes"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit Module</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveModuleId(mod.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Add Lesson</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons List */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {!mod.lessons || mod.lessons.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No lessons inside this module yet. Click &ldquo;Add Lesson&rdquo; above.
                        </div>
                      ) : (
                        mod.lessons.map((lesson: any, lessonIdx: number) => (
                          <div
                            key={lesson.id}
                            className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Lesson Sequence Reordering Buttons (Up & Down) */}
                              <div className="flex flex-col gap-0.5 shrink-0 bg-slate-50 border border-slate-200/80 rounded p-0.5">
                                <button
                                  type="button"
                                  disabled={lessonIdx === 0}
                                  onClick={() => handleMoveLesson(mod.id, lessonIdx, "up")}
                                  className="p-0.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded disabled:opacity-20 transition-colors"
                                  title="Move Lesson Up in sequence"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={lessonIdx === mod.lessons.length - 1}
                                  onClick={() => handleMoveLesson(mod.id, lessonIdx, "down")}
                                  className="p-0.5 text-slate-400 hover:text-primary hover:bg-slate-100 rounded disabled:opacity-20 transition-colors"
                                  title="Move Lesson Down in sequence"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>

                              <PlaySquare className="w-4 h-4 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-slate-400 font-mono">
                                    {modIdx + 1}.{lessonIdx + 1}
                                  </span>
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
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

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                                  {lesson.duration > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {lesson.duration}m
                                    </span>
                                  )}
                                  {lesson.videoUrl && (
                                    <span className="flex items-center gap-1 text-blue-600 font-medium truncate max-w-xs">
                                      <Video className="w-3 h-3" /> Video Attached
                                    </span>
                                  )}
                                  {lesson.content && (
                                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                      <FileText className="w-3 h-3" /> Rich Content / Notes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditLesson(lesson)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Lesson &amp; Rich Block Notes"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
        </div>
      )}

      {/* ── Modal 1: Add Module ── */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-emerald-600" />
                <span>Add Curriculum &amp; Syllabus Module</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddModule} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Core Fundamentals &amp; Setup"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Module Syllabus &amp; Overview (Block Editor)
                </label>
                <p className="text-[11px] text-slate-400">
                  Write module objectives, prerequisites, syllabus overview, tables, callouts, or notes:
                </p>
                <RichTextEditor
                  name="moduleDesc"
                  value={moduleDesc}
                  defaultValue={moduleDesc}
                  onChange={(html) => setModuleDesc(html)}
                  placeholder="Add module syllabus, learning objectives, lab requirements, or breakdown..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Module</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Edit Module ── */}
      {editingModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <span>Edit Module &amp; Syllabus Notes</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingModule(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateModule} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1: Core Fundamentals &amp; Setup"
                  value={editModuleTitle}
                  onChange={(e) => setEditModuleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Module Syllabus &amp; Overview (Block Editor)
                </label>
                <p className="text-[11px] text-slate-400">
                  Update syllabus overview, learning outcomes, tables, links, or notes:
                </p>
                <RichTextEditor
                  name="editModuleDesc"
                  value={editModuleDesc}
                  defaultValue={editModuleDesc}
                  onChange={(html) => setEditModuleDesc(html)}
                  placeholder="Edit module syllabus, learning objectives, lab requirements, or breakdown..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 3: Add Lesson ── */}
      {activeModuleId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlaySquare className="w-5 h-5 text-emerald-600" />
                <span>Add Lesson to Module</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveModuleId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLesson} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lesson Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1.1 Introduction to the Lab Environment"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Video URL (YouTube / Vimeo / Direct MP4 / Cloudflare Stream)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex items-center pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors w-full">
                    <input
                      type="checkbox"
                      checked={lessonIsFree}
                      onChange={(e) => setLessonIsFree(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Free Preview Lesson
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Allow prospective students to preview this lesson without enrolling
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lesson Content, Notes &amp; Lab Instructions (Block Editor)
                </label>
                <p className="text-[11px] text-slate-400">
                  Write detailed notes, step-by-step guides, code snippets, download links, callout warnings, tables, and images:
                </p>
                <RichTextEditor
                  name="lessonContent"
                  value={lessonContent}
                  defaultValue={lessonContent}
                  onChange={(html) => setLessonContent(html)}
                  placeholder="Write lesson notes, code snippets, cheat sheets, step-by-step lab instructions, images, tables..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModuleId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Lesson</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 4: Edit Lesson ── */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <span>Edit Lesson &amp; Rich Block Notes</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLesson} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lesson Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1.1 Introduction to the Lab Environment"
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Video URL (YouTube / Vimeo / Direct MP4 / Cloudflare Stream)
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
                  value={editLessonVideoUrl}
                  onChange={(e) => setEditLessonVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editLessonDuration}
                    onChange={(e) => setEditLessonDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <div className="flex items-center pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors w-full">
                    <input
                      type="checkbox"
                      checked={editLessonIsFree}
                      onChange={(e) => setEditLessonIsFree(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Free Preview Lesson
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        Allow prospective students to preview this lesson without enrolling
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lesson Content, Notes &amp; Lab Instructions (Block Editor)
                </label>
                <p className="text-[11px] text-slate-400">
                  Update detailed notes, step-by-step guides, code snippets, download links, callouts, tables, and images:
                </p>
                <RichTextEditor
                  name="editLessonContent"
                  value={editLessonContent}
                  defaultValue={editLessonContent}
                  onChange={(html) => setEditLessonContent(html)}
                  placeholder="Edit lesson notes, code snippets, cheat sheets, step-by-step lab instructions, images, tables..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
