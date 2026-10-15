import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlogCategoryForm from "@/components/admin/BlogCategoryForm";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Blog Category | Admin - The Valid Market",
  description: "Edit existing blog category",
};

export default async function EditBlogCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await prisma.blogCategory.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return (
    <BlogCategoryForm
      mode="edit"
      categoryId={category.id}
      initialData={category}
    />
  );
}
