import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";

import type { Session } from "next-auth";

function requireAdminSession(session: Session | null) {
  if (!session?.user) return false;
  const allowed = ["ADMIN", "STAFF", "MANAGER"];
  return allowed.includes(session.user.role as string);
}

// GET /api/admin/products — auth check only, returns 403 if not admin
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!requireAdminSession(session as Session | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ message: "Use POST to create products" }, { status: 200 });
}

// POST /api/admin/products
export async function POST(req: NextRequest) {
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

  const metadata = JSON.stringify({ image, gallery, specifications });

  if (!name || !slug || !categoryId || !type || isNaN(price)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const product = await prisma.product.create({
    data: { name, slug, categoryId, type, price, salePrice, status, shortDesc, description, sku, stock, metadata }
  });

  // Save Custom Fields
  const fieldKeys = Array.from(data.keys()).filter(k => k.startsWith("field_"));
  if (fieldKeys.length > 0) {
    const fields = await prisma.fieldDefinition.findMany({
      where: { slug: { in: fieldKeys.map(k => k.replace("field_", "")) } }
    });
    
    for (const key of fieldKeys) {
      const fieldSlug = key.replace("field_", "");
      const field = fields.find(f => f.slug === fieldSlug);
      if (!field) continue;
      
      const values = data.getAll(key);
      const valStr = values.length > 1 ? values.join(",") : (values[0] as string);
      
      await prisma.productFieldValue.create({
        data: {
          productId: product.id,
          fieldId: field.id,
          value: valStr
        }
      });
    }
  }

  await createAuditLog({
    action: "PRODUCT_CREATED", entity: "Product", entityId: product.id,
    metadata: { name, type, status, actorEmail: session?.user?.email }
  });

  return NextResponse.json(product, { status: 201 });
}
