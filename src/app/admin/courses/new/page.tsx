import { requireAdmin } from "@/lib/actions/admin";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import CreateCourseForm from "./CreateCourseForm";

export const dynamic = "force-dynamic";

export default async function AdminNewCoursePage() {
  await requireAdmin("Courses", "Create");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create New Course</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Add initial course metadata. You will be redirected to build modules and lessons.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <CreateCourseForm />
      </div>
    </div>
  );
}
