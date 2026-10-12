import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";
import { sanitizeHtml } from "@/lib/sanitize";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";

function requireAdminSession(session: Session | null) {
  if (!session?.user) return false;
  const allowed = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  return allowed.includes((session.user as any).role as string);
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
  try {
    const session = await getServerSession(authOptions);
    if (!requireAdminSession(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.formData();
    const name = (data.get("name") as string)?.trim();
    let slug = (data.get("slug") as string)?.trim().toLowerCase();
    const categoryId = (data.get("categoryId") as string)?.trim();
    const type = (data.get("type") as string)?.trim() || "DIGITAL_DOWNLOAD";
    
    const priceRaw = parseFloat(data.get("price") as string);
    const price = isNaN(priceRaw) ? 0 : priceRaw;
    
    const salePriceRaw = data.get("salePrice") ? parseFloat(data.get("salePrice") as string) : null;
    const salePrice = (salePriceRaw !== null && !isNaN(salePriceRaw)) ? salePriceRaw : null;
    
    const status = (data.get("status") as string) || "DRAFT";
    const shortDesc = (data.get("shortDesc") as string) || null;
    const rawDescription = data.get("description") as string;
    const description = sanitizeHtml(rawDescription || "");
    const sku = (data.get("sku") as string) || null;
    const unlimitedStock = data.get("unlimitedStock") === "true";
    const rawStock = parseInt(data.get("stock") as string || "0");
    const stock = unlimitedStock ? -1 : (isNaN(rawStock) ? 0 : rawStock);

    const image = (data.get("image") as string) || "";
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

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Please select a category" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await prisma.product.create({
      data: { name, slug, categoryId, type, price, salePrice, status, shortDesc, description, sku, stock, metadata }
    });

    // Save Custom Fields safely
    const fieldKeys = Array.from(data.keys()).filter(k => k.startsWith("field_"));
    if (fieldKeys.length > 0) {
      const fields = await prisma.fieldDefinition.findMany({
        where: { slug: { in: fieldKeys.map(k => k.replace("field_", "")) } }
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
              productId: product.id,
              fieldId: field.id,
              value: valStr
            }
          });
        }
      }
    }

    try {
      await createAuditLog({
        action: "PRODUCT_CREATED", entity: "Product", entityId: product.id,
        metadata: { name, type, status, actorEmail: session?.user?.email }
      });
    } catch {}

    try {
      revalidatePath("/");
      revalidatePath("/store");
      revalidatePath(`/product/${product.slug}`);
    } catch {}

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
