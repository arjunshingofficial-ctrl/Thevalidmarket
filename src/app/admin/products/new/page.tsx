import { prisma } from "@/lib/prisma";
import ProductEditor from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  let categories: { id: string; name: string }[] = [];
  let fieldDefinitions: any[] = [];

  try {
    categories = await prisma.category.findMany({ 
      select: { id: true, name: true },
      orderBy: { name: "asc" } 
    });
  } catch (error) {
    console.error("Failed to load categories for new product:", error);
  }

  try {
    fieldDefinitions = await prisma.fieldDefinition.findMany({ 
      where: { isActive: true }, 
      orderBy: { sortOrder: "asc" } 
    });
  } catch (error) {
    console.error("Failed to load field definitions for new product:", error);
  }

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
