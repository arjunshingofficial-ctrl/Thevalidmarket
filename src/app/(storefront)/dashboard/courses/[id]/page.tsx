import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import CoursePlayer from "./CoursePlayer";
import Link from "next/link";
import { Lock, BookOpen, ArrowLeft, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardCourseLearningPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lessonId?: string }>;
}) {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const { lessonId } = (await searchParams) || {};

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      product: {
        include: { category: true },
      },
      modules: {
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

  // Check if current user has an ACTIVE entitlement for this course
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId: session.user.id,
      productId: course.productId,
      type: "COURSE",
      status: "ACTIVE",
    },
  });

  const isEnrolled = !!entitlement || isAdmin;

  // Retrieve user's progress records
  const progressList = await prisma.courseProgress.findMany({
    where: {
      userId: session.user.id,
      lesson: { module: { courseId: course.id } },
    },
  });

  const progressMap: Record<string, boolean> = {};
  for (const p of progressList) {
    progressMap[p.lessonId] = p.completed;
  }

  // If user is NOT enrolled, show unauthorized / paywall overview
  if (!isEnrolled) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/courses"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{course.product.name}</h1>
            <p className="text-xs text-slate-500">Instructor: {course.instructor || "Lead Instructor"}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-900">Enrollment Required</h2>
            <p className="text-sm text-amber-700 max-w-md mx-auto mt-1">
              You do not have an active enrollment for this course. Purchase the course to unlock all video lectures, course materials, and progress tracking.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/product/${course.product.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Enroll Now (৳ {course.product.salePrice || course.product.price})
            </Link>
          </div>
        </div>

        {/* Syllabus Preview with lock indicators */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" /> Course Curriculum ({course.modules.length} Modules)
          </h3>
          <div className="space-y-4">
            {course.modules.map((mod, modIdx) => (
              <div key={mod.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-3.5 bg-slate-50 font-semibold text-slate-900 text-xs sm:text-sm">
                  Module {modIdx + 1}: {mod.title}
                </div>
                <div className="divide-y divide-slate-100 bg-white">
                  {mod.lessons.map((lesson, lessonIdx) => (
                    <div key={lesson.id} className="p-3 px-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-mono text-slate-400">{modIdx + 1}.{lessonIdx + 1}</span>
                        <span>{lesson.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // User IS enrolled: render full Course Player
  return (
    <CoursePlayer
      course={course}
      initialProgressMap={progressMap}
      initialLessonId={lessonId}
    />
  );
}
