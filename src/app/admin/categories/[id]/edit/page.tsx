import { prisma } from "@/lib/prisma";
import CategoryForm from "@/components/admin/CategoryForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({
    where: { id }
  });

  if (!category) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" }
  });

  return (
    <CategoryForm 
      mode="edit" 
      categoryId={category.id} 
      initialData={category} 
      categories={categories} 
    />
  );
}
