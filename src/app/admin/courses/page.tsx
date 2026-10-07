import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, BookOpen, Settings } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminCourses() {
  await requireAdmin("Courses", "View");

  const courses = await prisma.course.findMany({
    include: {
      product: true,
      modules: { include: { lessons: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Courses & LMS</h1>
          <p className="text-slate-500 mt-1">Manage e-learning products and course content.</p>
        </div>
        <Link href="/admin/courses/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 shadow-sm">
          <Plus className="h-4 w-4" /> Create Course
        </Link>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Course</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Curriculum</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                  <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No courses found</p>
                  <p className="text-sm mt-1">First create a COURSE type product, then build its curriculum.</p>
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{course.product.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{course.instructor || "No Instructor"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      course.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {course.modules.length} modules, {course.modules.reduce((acc, m) => acc + m.lessons.length, 0)} lessons
                  </td>
                  <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" /> Edit Curriculum
                      </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
