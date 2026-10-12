import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { normalizeImageUrl } from "@/lib/storage/client";

export const dynamic = "force-dynamic";

export default async function DashboardCoursesPage() {
  const session = (await getServerSession(authOptions)) as any;
  if (!session?.user) redirect("/login");

  const entitlements = await prisma.entitlement.findMany({
    where: { 
      userId: session.user.id,
      type: "COURSE",
      status: "ACTIVE"
    },
    include: {
      product: {
        include: {
          course: {
            include: {
              modules: {
                include: { lessons: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch all completed lessons for this user to compute progress per course
  const userProgress = await prisma.courseProgress.findMany({
    where: {
      userId: session.user.id,
      completed: true,
    },
    select: { lessonId: true }
  });
  const completedLessonIds = new Set(userProgress.map(p => p.lessonId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Courses</h1>
        <p className="text-muted-foreground mt-1">Access your enrolled courses and track your learning progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entitlements.length === 0 ? (
          <div className="col-span-full rounded-xl border bg-card shadow-sm overflow-hidden p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No courses found</h3>
            <p className="text-muted-foreground mb-4">You haven&apos;t enrolled in any courses yet.</p>
            <Link href="/store?category=courses" className="text-primary hover:underline font-medium">
              Browse Courses
            </Link>
          </div>
        ) : (
          entitlements.map(ent => {
            const course = ent.product.course;
            let totalLessons = 0;
            let completedLessons = 0;

            if (course?.modules) {
              for (const mod of course.modules) {
                for (const les of mod.lessons) {
                  totalLessons++;
                  if (completedLessonIds.has(les.id)) {
                    completedLessons++;
                  }
                }
              }
            }

            const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return (
              <div key={ent.id} className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="aspect-video bg-slate-100 relative">
                  {ent.product.metadata && JSON.parse(ent.product.metadata).image ? (
                    <Image 
                      src={normalizeImageUrl(JSON.parse(ent.product.metadata).image)} 
                      alt={ent.product.name} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
                      <BookOpen className="h-10 w-10 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {course?.instructor || "Academy Course"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Enrolled
                    </span>
                    {percent === 100 && (
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-lg line-clamp-2 text-slate-900">{ent.product.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4 flex-1 line-clamp-2">{ent.product.shortDesc}</p>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Progress</span>
                      <span>{completedLessons} / {totalLessons} Lessons ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                  
                  <Link 
                    href={`/dashboard/courses/${ent.product.course?.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm text-sm"
                  >
                    <PlayCircle className="h-4 w-4" /> Continue Learning
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
