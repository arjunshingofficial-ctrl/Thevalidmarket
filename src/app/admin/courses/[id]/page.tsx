import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/actions/admin";
import { notFound } from "next/navigation";
import CourseEditor from "./CourseEditor";

export const dynamic = "force-dynamic";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("Courses", "View");
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      product: {
        include: {
          category: true,
        },
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

  return <CourseEditor course={course} />;
}
