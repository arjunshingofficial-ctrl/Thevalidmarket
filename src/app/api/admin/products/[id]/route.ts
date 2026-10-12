import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Session } from "next-auth";

function requireAdminSession(session: Session | null) {
  if (!session?.user) return false;
  const allowed = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  return allowed.includes((session.user as any).role as string);
}

// GET /api/admin/products/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!requireAdminSession(session as Session | null)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        files: true,
        fieldValues: { include: { field: true } }
      }
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!requireAdminSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data = await req.formData();
    const name = (data.get("name") as string)?.trim() || existing.name;
    let slug = (data.get("slug") as string)?.trim().toLowerCase() || existing.slug;
    const categoryId = (data.get("categoryId") as string)?.trim() || existing.categoryId;
    const type = (data.get("type") as string)?.trim() || existing.type;
    
    const priceRaw = parseFloat(data.get("price") as string);
    const price = isNaN(priceRaw) ? existing.price : priceRaw;
    
    const salePriceRaw = data.get("salePrice") ? parseFloat(data.get("salePrice") as string) : null;
    const salePrice = (salePriceRaw !== null && !isNaN(salePriceRaw)) ? salePriceRaw : null;
    
    const status = (data.get("status") as string) || existing.status;
    const shortDesc = (data.get("shortDesc") as string) ?? existing.shortDesc;
    
    const rawDescription = data.get("description");
    const description = rawDescription !== null ? sanitizeHtml(rawDescription as string) : existing.description;
    
    const sku = (data.get("sku") as string) ?? existing.sku;
    const unlimitedStock = data.get("unlimitedStock") === "true";
    const rawStock = parseInt(data.get("stock") as string || "0");
    const stock = unlimitedStock ? -1 : (isNaN(rawStock) ? (existing.stock ?? 0) : rawStock);

    const image = (data.get("image") as string) ?? "";
    let specifications = {};
    try {
      specifications = JSON.parse((data.get("specifications") as string) || "{}");
    } catch (e) {}

    let gallery: string[] = [];
    try {
      gallery = JSON.parse((data.get("gallery") as string) || "[]");
    } catch (e) {}

    let tags: string[] = [];
    const rawTags = (data.get("tags") as string) || "";
    try {
      tags = rawTags.startsWith("[") ? JSON.parse(rawTags) : rawTags.split(",").map(t => t.trim()).filter(Boolean);
    } catch (e) {
      tags = rawTags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const seoTitle = (data.get("seoTitle") as string) || "";
    const metaDescription = (data.get("metaDescription") as string) || "";
    const canonicalUrl = (data.get("canonicalUrl") as string) || "";
    const robots = (data.get("robots") as string) || "index,follow";

    const metadata = JSON.stringify({ 
      image, 
      gallery, 
      specifications,
      tags,
      seoTitle,
      metaDescription,
      canonicalUrl,
      robots
    });

    // Check slug collision with other products
    if (slug !== existing.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: { slug, id: { not: id } }
      });
      if (slugConflict) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: { name, slug, categoryId, type, price, salePrice, status, shortDesc, description, sku, stock, metadata },
      include: { category: true }
    });

    // Save Custom Fields
    const fieldKeys = Array.from(data.keys()).filter(k => k.startsWith("field_"));
    if (fieldKeys.length > 0) {
      const fields = await prisma.fieldDefinition.findMany({
        where: { slug: { in: fieldKeys.map(k => k.replace("field_", "")) } }
      });
      
      await prisma.productFieldValue.deleteMany({
        where: { productId: id }
      });

      const seenFields = new Set<string>();
      for (const key of fieldKeys) {
        const fieldSlug = key.replace("field_", "");
        const field = fields.find(f => f.slug === fieldSlug);
        if (!field || seenFields.has(field.id)) continue;
        seenFields.add(field.id);
        
        const values = data.getAll(key);
        const valStr = values.length > 1 ? values.join(",") : (values[0] as string);
        
        if (valStr !== undefined && valStr !== null && valStr !== "") {
          await prisma.productFieldValue.create({
            data: {
              productId: id,
              fieldId: field.id,
              value: valStr
            }
          });
        }
      }
    }

    try {
      await createAuditLog({
        action: "PRODUCT_EDITED", entity: "Product", entityId: id,
        metadata: { name, status, actorEmail: session?.user?.email }
      });
    } catch {}

    try {
      revalidatePath("/");
      revalidatePath("/store");
      if (product.category) {
        revalidatePath(`/category/${product.category.slug}`);
      }
      revalidatePath(`/product/${product.slug}`);
      if (existing.slug !== product.slug) {
        revalidatePath(`/product/${existing.slug}`);
      }
    } catch {}

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!requireAdminSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only Admins can delete products" }, { status: 403 });
    }

    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { category: true }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Safe to delete, execute in transaction to clean up cascading references safely
    await prisma.$transaction([
      prisma.productFieldValue.deleteMany({ where: { productId: id } }),
      prisma.productFile.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.licenseKey.deleteMany({ where: { productId: id } }),
      prisma.course.deleteMany({ where: { productId: id } }),
      prisma.subscription.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.entitlement.deleteMany({ where: { productId: id } }),
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } })
    ]);

    try {
      await createAuditLog({
        action: "PRODUCT_DELETED", entity: "Product", entityId: id,
        metadata: { name: product.name, actorEmail: session?.user?.email }
      });
    } catch {}

    try {
      revalidatePath("/");
      revalidatePath("/store");
      if (product.category) {
        revalidatePath(`/category/${product.category.slug}`);
      }
      revalidatePath(`/product/${product.slug}`);
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
