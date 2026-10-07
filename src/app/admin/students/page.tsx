import { GraduationCap, Search, Award, BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminStudents() {
  const users = await prisma.user.findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      orders: {
        select: { id: true, total: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Enrolled Students & Course Learners</h1>
          <p className="text-slate-500 mt-1">Track student progress, course enrollments, and completion certificates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <GraduationCap className="w-5 h-5" />
            <span className="font-semibold text-sm">Active Learners</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-semibold text-sm">Active Course Enrollments</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">38</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Award className="w-5 h-5" />
            <span className="font-semibold text-sm">Certificates Awarded</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">14</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Student Directory</h2>
        </div>
        <div className="divide-y divide-slate-200">
          {users.map((user) => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : "ST"}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{user.name || "Enrolled Student"}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  Enrolled ({user.orders.length} Courses/Digital Items)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
