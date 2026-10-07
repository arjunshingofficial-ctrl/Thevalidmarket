import { prisma } from "@/lib/prisma";
import ProductEditor from "@/components/admin/ProductEditor";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, fieldDefinitions] = await Promise.all([
    prisma.product.findUnique({ 
      where: { id },
      include: { 
        files: { orderBy: { createdAt: "desc" } },
        fieldValues: { include: { field: true } }
      }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.fieldDefinition.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

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
