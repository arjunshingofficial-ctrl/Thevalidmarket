"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, createAuditLog } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBlogCategory(data: FormData) {
  await requireAdmin("Blog", "Create");

  const name = (data.get("name") as string)?.trim();
  let slug = (data.get("slug") as string)?.trim();
  const description = (data.get("description") as string)?.trim() || null;
  const seoTitle = (data.get("seoTitle") as string)?.trim() || null;
  const seoDescription = (data.get("seoDescription") as string)?.trim() || null;

  if (!name) {
    throw new Error("Category name is required.");
  }

  if (!slug) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }

  // Ensure unique slug
  const existing = await prisma.blogCategory.findUnique({
    where: { slug },
  });

  if (existing) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const category = await prisma.blogCategory.create({
    data: {
      name,
      slug,
      description,
      seoTitle,
      seoDescription,
    },
  });

  await createAuditLog({
    action: "BLOG_CATEGORY_CREATED",
    entity: "BlogCategory",
    entityId: category.id,
    metadata: { name, slug },
  });

  revalidatePath("/admin/blog/categories");
  revalidatePath("/admin/blog");
  revalidatePath("/news");
  redirect("/admin/blog/categories");
}

export async function updateBlogCategory(id: string, data: FormData) {
  await requireAdmin("Blog", "Edit");

  const name = (data.get("name") as string)?.trim();
  let slug = (data.get("slug") as string)?.trim();
  const description = (data.get("description") as string)?.trim() || null;
  const seoTitle = (data.get("seoTitle") as string)?.trim() || null;
  const seoDescription = (data.get("seoDescription") as string)?.trim() || null;

  if (!name) {
    throw new Error("Category name is required.");
  }

  if (!slug) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }

  // Check if slug taken by another category
  const existing = await prisma.blogCategory.findUnique({
    where: { slug },
  });

  if (existing && existing.id !== id) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const category = await prisma.blogCategory.update({
    where: { id },
    data: {
      name,
      slug,
      description,
      seoTitle,
      seoDescription,
    },
  });

  await createAuditLog({
    action: "BLOG_CATEGORY_UPDATED",
    entity: "BlogCategory",
    entityId: category.id,
    metadata: { name, slug },
  });

  revalidatePath("/admin/blog/categories");
  revalidatePath("/admin/blog");
  revalidatePath("/news");
  redirect("/admin/blog/categories");
}

export async function deleteBlogCategory(id: string) {
  await requireAdmin("Blog", "Delete");

  // Detach posts from this category first
  await prisma.blogPost.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });

  const deleted = await prisma.blogCategory.delete({
    where: { id },
  });

  await createAuditLog({
    action: "BLOG_CATEGORY_DELETED",
    entity: "BlogCategory",
    entityId: id,
    metadata: { name: deleted.name, slug: deleted.slug },
  });

  revalidatePath("/admin/blog/categories");
  revalidatePath("/admin/blog");
  revalidatePath("/news");

  return { success: true };
}
