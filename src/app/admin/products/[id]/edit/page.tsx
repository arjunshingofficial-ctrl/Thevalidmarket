import { prisma } from "@/lib/prisma";
import ProductEditor from "@/components/admin/ProductEditor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product = null;
  let categories: { id: string; name: string }[] = [];
  let fieldDefinitions: any[] = [];

  try {
    product = await prisma.product.findUnique({ 
      where: { id },
      include: { 
        files: { orderBy: { createdAt: "desc" } },
        fieldValues: { include: { field: true } }
      }
    });
  } catch (error) {
    console.error("Failed to load product:", error);
  }

  try {
    categories = await prisma.category.findMany({ 
      select: { id: true, name: true },
      orderBy: { name: "asc" } 
    });
  } catch (error) {
    console.error("Failed to load categories for edit product:", error);
  }

  try {
    fieldDefinitions = await prisma.fieldDefinition.findMany({ 
      where: { isActive: true }, 
      orderBy: { sortOrder: "asc" } 
    });
  } catch (error) {
    console.error("Failed to load field definitions for edit product:", error);
  }

  if (!product) notFound();

  return (
    <div className="max-w-6xl">
      <ProductEditor
        categories={categories}
        fieldDefinitions={fieldDefinitions}
        initialData={product as Record<string, unknown>}
        mode="edit"
        productId={product.id}
      />
    </div>
  );
}
