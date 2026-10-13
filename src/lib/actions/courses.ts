"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireAdmin, createAuditLog } from "@/lib/actions/admin";

// ----------------------------------------------------
// 1. ADMIN ACTIONS: CREATE / UPDATE / PUBLISH COURSE
// ----------------------------------------------------

export async function createCourseAction(data: {
  name: string;
  slug?: string;
  instructor?: string;
  shortDesc?: string;
  description?: string;
  price: number;
  salePrice?: number;
  thumbnailUrl?: string;
}) {
  await requireAdmin("Courses", "Create");

  const name = data.name.trim();
  if (!name) throw new Error("Course title is required");

  // Slug generation
  const baseSlug = (data.slug || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // Ensure "courses" category exists
  let category = await prisma.category.findUnique({ where: { slug: "courses" } });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Courses",
        slug: "courses",
        description: "Online video courses and tutorials",
        isActive: true,
      }
    });
  }

  // Create Product and Course within transaction
  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        slug,
        categoryId: category.id,
        type: "COURSE",
        price: Number(data.price) || 0,
        salePrice: data.salePrice ? Number(data.salePrice) : null,
        shortDesc: data.shortDesc || "",
        description: data.description || "",
        status: "DRAFT",
        stock: -1,
      }
    });

    const course = await tx.course.create({
      data: {
        productId: product.id,
        instructor: data.instructor || "Lead Instructor",
        thumbnailUrl: data.thumbnailUrl || null,
        status: "DRAFT",
      }
    });

    return { product, course };
  });

  await createAuditLog({
    action: "COURSE_CREATED",
    entity: "Course",
    entityId: result.course.id,
    metadata: { title: name, slug },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/store");

  return { success: true, courseId: result.course.id, productId: result.product.id };
}

export async function updateCourseAction(courseId: string, data: {
  name?: string;
  instructor?: string;
  shortDesc?: string;
  description?: string;
  price?: number;
  salePrice?: number;
  thumbnailUrl?: string;
  skillLevel?: string;
  language?: string;
  badge?: string;
  highlights?: string[] | string;
}) {
  await requireAdmin("Courses", "Edit");

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { product: true }
  });
  if (!course) throw new Error("Course not found");

  await prisma.$transaction(async (tx) => {
    // 1. Prepare updated metadata
    let meta: any = {};
    try {
      if (course.product?.metadata) {
        meta = JSON.parse(course.product.metadata);
      }
    } catch (e) {}

    let metaChanged = false;

    if (data.thumbnailUrl !== undefined) {
      meta.image = data.thumbnailUrl || "";
      metaChanged = true;
    }
    if (data.skillLevel !== undefined) {
      meta.skillLevel = data.skillLevel;
      metaChanged = true;
    }
    if (data.language !== undefined) {
      meta.language = data.language;
      metaChanged = true;
    }
    if (data.badge !== undefined) {
      meta.badge = data.badge;
      metaChanged = true;
    }
    if (data.highlights !== undefined) {
      meta.highlights = Array.isArray(data.highlights)
        ? data.highlights
        : (typeof data.highlights === "string" ? data.highlights.split("\n").map(s => s.trim()).filter(Boolean) : []);
      metaChanged = true;
    }

    // 2. Update Product record
    const productUpdateData: any = {};
    if (data.name) productUpdateData.name = data.name;
    if (data.shortDesc !== undefined) productUpdateData.shortDesc = data.shortDesc;
    if (data.description !== undefined) productUpdateData.description = data.description;
    if (data.price !== undefined) productUpdateData.price = Number(data.price);
    if (data.salePrice !== undefined) productUpdateData.salePrice = data.salePrice ? Number(data.salePrice) : null;
    if (metaChanged) productUpdateData.metadata = JSON.stringify(meta);

    if (Object.keys(productUpdateData).length > 0) {
      await tx.product.update({
        where: { id: course.productId },
        data: productUpdateData,
      });
    }

    // 3. Update Course record
    const courseUpdateData: any = {};
    if (data.instructor !== undefined) courseUpdateData.instructor = data.instructor;
    if (data.thumbnailUrl !== undefined) courseUpdateData.thumbnailUrl = data.thumbnailUrl || null;

    if (Object.keys(courseUpdateData).length > 0) {
      await tx.course.update({
        where: { id: courseId },
        data: courseUpdateData,
      });
    }
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/store");
  if (course.product?.slug) {
    revalidatePath(`/courses/${course.product.slug}`);
    revalidatePath(`/product/${course.product.slug}`);
  }

  return { success: true };
}

export async function setCoursePublishStatusAction(courseId: string, isPublished: boolean) {
  await requireAdmin("Courses", "Publish");

  const status = isPublished ? "PUBLISHED" : "DRAFT";

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { product: true }
  });
  if (!course) throw new Error("Course not found");

  await prisma.$transaction([
    prisma.course.update({
      where: { id: courseId },
      data: { status }
    }),
    prisma.product.update({
      where: { id: course.productId },
      data: { status }
    })
  ]);

  await createAuditLog({
    action: isPublished ? "COURSE_PUBLISHED" : "COURSE_UNPUBLISHED",
    entity: "Course",
    entityId: courseId,
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath("/store");
  revalidatePath("/dashboard/courses");

  return { success: true, status };
}

export async function deleteCourseAction(courseId: string) {
  await requireAdmin("Courses", "Delete");

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });
  if (!course) throw new Error("Course not found");

  // Deleting product will cascade delete course, modules, lessons, entitlements
  await prisma.product.delete({
    where: { id: course.productId }
  });

  await createAuditLog({
    action: "COURSE_DELETED",
    entity: "Course",
    entityId: courseId,
  });

  revalidatePath("/admin/courses");
  revalidatePath("/store");

  return { success: true };
}

// ----------------------------------------------------
// 2. ADMIN ACTIONS: MODULES CRUD
// ----------------------------------------------------

export async function addModuleAction(courseId: string, data: {
  title: string;
  description?: string;
  sortOrder?: number;
}) {
  await requireAdmin("Courses", "Edit");

  const title = data.title.trim();
  if (!title) throw new Error("Module title is required");

  const maxOrder = await prisma.courseModule.aggregate({
    where: { courseId },
    _max: { sortOrder: true }
  });
  const sortOrder = data.sortOrder ?? ((maxOrder._max.sortOrder ?? -1) + 1);

  const newModule = await prisma.courseModule.create({
    data: {
      courseId,
      title,
      description: data.description || "",
      sortOrder,
    }
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/dashboard/courses/${courseId}`);

  return { success: true, module: newModule };
}

export async function updateModuleAction(moduleId: string, data: {
  title: string;
  description?: string;
  sortOrder?: number;
}) {
  await requireAdmin("Courses", "Edit");

  const mod = await prisma.courseModule.update({
    where: { id: moduleId },
    data: {
      title: data.title.trim(),
      description: data.description || "",
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder })
    }
  });

  revalidatePath(`/admin/courses/${mod.courseId}`);
  revalidatePath(`/dashboard/courses/${mod.courseId}`);

  return { success: true, module: mod };
}

export async function deleteModuleAction(moduleId: string) {
  await requireAdmin("Courses", "Edit");

  const mod = await prisma.courseModule.findUnique({ where: { id: moduleId } });
  if (!mod) throw new Error("Module not found");

  await prisma.courseModule.delete({ where: { id: moduleId } });

  revalidatePath(`/admin/courses/${mod.courseId}`);
  revalidatePath(`/dashboard/courses/${mod.courseId}`);

  return { success: true };
}

// ----------------------------------------------------
// 3. ADMIN ACTIONS: LESSONS CRUD
// ----------------------------------------------------

export async function addLessonAction(moduleId: string, data: {
  title: string;
  content?: string;
  videoUrl?: string;
  attachments?: string;
  duration?: number;
  sortOrder?: number;
  isFree?: boolean;
}) {
  await requireAdmin("Courses", "Edit");

  const title = data.title.trim();
  if (!title) throw new Error("Lesson title is required");

  const mod = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    include: { course: true }
  });
  if (!mod) throw new Error("Module not found");

  const maxOrder = await prisma.courseLesson.aggregate({
    where: { moduleId },
    _max: { sortOrder: true }
  });
  const sortOrder = data.sortOrder ?? ((maxOrder._max.sortOrder ?? -1) + 1);

  const lesson = await prisma.courseLesson.create({
    data: {
      moduleId,
      title,
      content: data.content || "",
      videoUrl: data.videoUrl || "",
      attachments: data.attachments || null,
      duration: data.duration ? Number(data.duration) : 0,
      sortOrder,
      isFree: !!data.isFree,
    }
  });

  // Also auto-initialize progress record for all currently enrolled students
  const entitlements = await prisma.entitlement.findMany({
    where: {
      productId: mod.course.productId,
      type: "COURSE",
      status: "ACTIVE"
    },
    select: { userId: true }
  });

  for (const ent of entitlements) {
    await prisma.courseProgress.upsert({
      where: {
        userId_lessonId: {
          userId: ent.userId,
          lessonId: lesson.id
        }
      },
      update: {},
      create: {
        userId: ent.userId,
        lessonId: lesson.id,
        completed: false
      }
    });
  }

  revalidatePath(`/admin/courses/${mod.courseId}`);
  revalidatePath(`/dashboard/courses/${mod.courseId}`);

  return { success: true, lesson };
}

export async function updateLessonAction(lessonId: string, data: {
  title: string;
  content?: string;
  videoUrl?: string;
  attachments?: string;
  duration?: number;
  sortOrder?: number;
  isFree?: boolean;
}) {
  await requireAdmin("Courses", "Edit");

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: { module: true }
  });
  if (!lesson) throw new Error("Lesson not found");

  const updated = await prisma.courseLesson.update({
    where: { id: lessonId },
    data: {
      title: data.title.trim(),
      content: data.content !== undefined ? data.content : lesson.content,
      videoUrl: data.videoUrl !== undefined ? data.videoUrl : lesson.videoUrl,
      attachments: data.attachments !== undefined ? data.attachments : lesson.attachments,
      duration: data.duration !== undefined ? Number(data.duration) : lesson.duration,
      sortOrder: data.sortOrder !== undefined ? data.sortOrder : lesson.sortOrder,
      isFree: data.isFree !== undefined ? !!data.isFree : lesson.isFree,
    }
  });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  revalidatePath(`/dashboard/courses/${lesson.module.courseId}`);

  return { success: true, lesson: updated };
}

export async function deleteLessonAction(lessonId: string) {
  await requireAdmin("Courses", "Edit");

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: { module: true }
  });
  if (!lesson) throw new Error("Lesson not found");

  await prisma.courseLesson.delete({ where: { id: lessonId } });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  revalidatePath(`/dashboard/courses/${lesson.module.courseId}`);

  return { success: true };
}

// ----------------------------------------------------
// 4. CUSTOMER ACTIONS: PROGRESS TRACKING & COMPLETION
// ----------------------------------------------------

export async function toggleLessonProgressAction(lessonId: string, completed: boolean) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in");
  }

  const userId = session.user.id;

  // Retrieve lesson and verify course entitlement
  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  const course = lesson.module.course;

  // Verify entitlement or admin status
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const entitlement = await prisma.entitlement.findFirst({
    where: {
      userId,
      productId: course.productId,
      type: "COURSE",
      status: "ACTIVE"
    }
  });

  if (!entitlement && !isAdmin) {
    // If not free lesson and no entitlement, reject!
    if (!lesson.isFree) {
      throw new Error("Access Denied: You do not have an active enrollment for this course.");
    }
  }

  // Update or insert progress in the database
  const progress = await prisma.courseProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    },
    update: {
      completed,
      lastAccessed: new Date(),
    },
    create: {
      userId,
      lessonId,
      completed,
      lastAccessed: new Date(),
    }
  });

  // Calculate new course progress for user
  const totalLessons = await prisma.courseLesson.count({
    where: { module: { courseId: course.id } }
  });

  const completedLessons = await prisma.courseProgress.count({
    where: {
      userId,
      completed: true,
      lesson: { module: { courseId: course.id } }
    }
  });

  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  revalidatePath(`/dashboard/courses/${course.id}`);
  revalidatePath("/dashboard/courses");

  return {
    success: true,
    completed: progress.completed,
    completedLessons,
    totalLessons,
    percentage,
  };
}
