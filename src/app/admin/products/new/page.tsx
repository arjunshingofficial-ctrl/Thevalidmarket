import { prisma } from "@/lib/prisma";
import ProductEditor from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, fieldDefinitions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.fieldDefinition.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="max-w-6xl">
      <ProductEditor
        categories={categories}
        fieldDefinitions={fieldDefinitions}
        mode="create"
      />
    </div>
  );
}
