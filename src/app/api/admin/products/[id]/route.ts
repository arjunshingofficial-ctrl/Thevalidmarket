import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

function requireAdminSession(session: Session | null) {
  if (!session?.user) return false;
  return ["ADMIN", "STAFF", "MANAGER"].includes(session.user.role as string);
}

// GET /api/admin/products/[id] — auth check
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!requireAdminSession(session as Session | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

// PUT /api/admin/products/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!requireAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await req.formData();
  const name = data.get("name") as string;
  const slug = data.get("slug") as string;
  const categoryId = data.get("categoryId") as string;
  const type = data.get("type") as string;
  const price = parseFloat(data.get("price") as string);
  const salePrice = data.get("salePrice") ? parseFloat(data.get("salePrice") as string) : null;
  const status = data.get("status") as string || "DRAFT";
  const shortDesc = data.get("shortDesc") as string;
  const description = data.get("description") as string;
  const sku = data.get("sku") as string;
  const unlimitedStock = data.get("unlimitedStock") === "true";
  const stock = unlimitedStock ? -1 : parseInt(data.get("stock") as string || "0");

  const image = data.get("image") as string || "";
  let specifications = {};
  try {
    specifications = JSON.parse((data.get("specifications") as string) || "{}");
  } catch (e) {}

  let gallery: string[] = [];
  try {
    gallery = JSON.parse((data.get("gallery") as string) || "[]");
  } catch (e) {}

  let tags: string[] = [];
  const rawTags = data.get("tags") as string || "";
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
    
    // Wipe existing values for these fields (naive sync)
    await prisma.productFieldValue.deleteMany({
      where: { productId: id }
    });

    for (const key of fieldKeys) {
      const fieldSlug = key.replace("field_", "");
      const field = fields.find(f => f.slug === fieldSlug);
      if (!field) continue;
      
      const values = data.getAll(key);
      const valStr = values.length > 1 ? values.join(",") : (values[0] as string);
      
      if (valStr) {
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

  await createAuditLog({
    action: "PRODUCT_EDITED", entity: "Product", entityId: id,
    metadata: { name, status, actorEmail: session?.user?.email }
  });

  revalidatePath("/");
  revalidatePath("/store");
  if (product.category) {
    revalidatePath(`/category/${product.category.slug}`);
  }
  revalidatePath(`/product/${product.slug}`);

  return NextResponse.json(product);
}

// DELETE /api/admin/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!requireAdminSession(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Only Admins can delete products" }, { status: 403 });
  }

  const product = await prisma.product.findUnique({ 
    where: { id },
    include: {
      category: true,
      _count: {
        select: {
          orderItems: true,
          licenses: true,
          subscriptions: true,
          reviews: true,
          entitlements: true
        }
      }
    }
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

  await createAuditLog({
    action: "PRODUCT_DELETED", entity: "Product", entityId: id,
    metadata: { name: product.name, actorEmail: session?.user?.email }
  });

  revalidatePath("/");
  revalidatePath("/store");
  if (product.category) {
    revalidatePath(`/category/${product.category.slug}`);
  }
  revalidatePath(`/product/${product.slug}`);

  return NextResponse.json({ success: true });
}
