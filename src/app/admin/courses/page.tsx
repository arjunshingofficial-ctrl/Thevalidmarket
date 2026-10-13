import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, BookOpen, Settings, ExternalLink, Edit } from "lucide-react";
import { requireAdmin } from "@/lib/actions/admin";
import { formatUsd } from "@/lib/currency";

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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Courses &amp; LMS</h1>
          <p className="text-slate-500 mt-1">Manage e-learning products, landing page designs, and curriculum.</p>
        </div>
        <Link href="/admin/courses/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-primary/90 shadow-sm transition-colors">
          <Plus className="h-4 w-4" /> Create Course
        </Link>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold">Course</th>
              <th className="px-6 py-4 font-semibold">Price</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Curriculum</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="font-medium text-slate-900">No courses found</p>
                  <p className="text-sm mt-1">Start by clicking &ldquo;Create Course&rdquo; above.</p>
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/admin/courses/${course.id}`} className="font-bold text-slate-900 hover:text-primary transition-colors block">
                      {course.product.name}
                    </Link>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Instructor: <span className="text-slate-700 font-medium">{course.instructor || "No Instructor"}</span> • <code className="text-[11px] text-slate-400 font-mono">/courses/{course.product.slug}</code>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {formatUsd(course.product.salePrice ?? course.product.price)}
                    {course.product.salePrice && (
                      <span className="text-xs text-slate-400 line-through ml-1.5 font-normal">
                        {formatUsd(course.product.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      course.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="font-semibold text-slate-900">{course.modules.length}</span> modules, <span className="font-semibold text-slate-900">{course.modules.reduce((acc, m) => acc + m.lessons.length, 0)}</span> lessons
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/courses/${course.product.slug}`}
                        target="_blank"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                        title="View Course Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                        <span>View</span>
                      </Link>
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit &amp; Design</span>
                      </Link>
                    </div>
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
