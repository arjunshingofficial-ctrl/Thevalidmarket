"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { trackActivityEvent } from "@/lib/analytics";
import type { Session } from "next-auth";

// ---------- AUDIT LOGGING ----------
export async function createAuditLog({
  action, entity, entityId, metadata
}: {
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const session = await getServerSession(authOptions);
    await prisma.auditLog.create({
      data: {
        actorId: session?.user?.id,
        actorEmail: session?.user?.email,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    });
  } catch {
    // Audit log failures should never break the main operation
    console.error("Audit log failed");
  }
}

// ---------- ADMIN GUARD ----------
export async function requireAdmin(module?: string, action?: string) {
  const session = await getServerSession(authOptions) as any;
  if (!session?.user) redirect("/login");
  const allowed = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];
  if (!allowed.includes(session.user.role as string)) {
    redirect("/dashboard");
  }

  // Super admins bypass granular checks
  if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
    return session;
  }

  // Check granular permissions for staff/manager if module specified
  if (module && action) {
    const role = await prisma.role.findUnique({
      where: { name: session.user.role },
      include: { permissions: true }
    });
    
    if (!role) redirect("/dashboard");

    const hasAccess = role.permissions.some(p => 
      p.module.toUpperCase() === module.toUpperCase() && 
      (p.action.toUpperCase() === action.toUpperCase() || p.action.toUpperCase() === "FULL" || p.action.toUpperCase() === "MANAGE")
    );

    if (!hasAccess) {
      throw new Error(`Unauthorized: Missing ${action} permission for ${module}`);
    }
  }

  return session;
}

// ---------- PRODUCTS ----------
export async function createProduct(data: FormData) {
  const session = await requireAdmin("Products", "Create");

  const name = data.get("name") as string;
  const slug = data.get("slug") as string;
  const categoryId = data.get("categoryId") as string;
  const type = data.get("type") as string;
  const price = parseFloat(data.get("price") as string);
  const salePrice = data.get("salePrice") ? parseFloat(data.get("salePrice") as string) : null;
  const comparePrice = data.get("comparePrice") ? parseFloat(data.get("comparePrice") as string) : null;
  const status = data.get("status") as string || "DRAFT";
  const shortDesc = data.get("shortDesc") as string;
  const description = data.get("description") as string;
  const sku = data.get("sku") as string;
  const stock = data.get("unlimitedStock") === "true" ? -1 : parseInt(data.get("stock") as string || "0");
  const image = data.get("image") as string;
  const metadata = JSON.stringify({ image });

  const product = await prisma.product.create({
    data: {
      name, slug, categoryId, type, price,
      salePrice, status, shortDesc, description, sku, stock, metadata
    }
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
    action: "PRODUCT_CREATED",
    entity: "Product",
    entityId: product.id,
    metadata: { name, type, status, actorEmail: session.user.email }
  });

  if (status === "PUBLISHED") {
    await trackActivityEvent("PRODUCT_PUBLISHED", product.id, `New product published: ${name}`);
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}/edit`);
}

export async function updateProduct(id: string, data: FormData) {
  const session = await requireAdmin("Products", "Edit");

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
  const stock = data.get("unlimitedStock") === "true" ? -1 : parseInt(data.get("stock") as string || "0");
  const image = data.get("image") as string;
  const metadata = JSON.stringify({ image });

  const existingProduct = await prisma.product.findUnique({ where: { id } });

  await prisma.product.update({
    where: { id },
    data: { name, slug, categoryId, type, price, salePrice, status, shortDesc, description, sku, stock, metadata }
  });

  if (existingProduct?.status !== "PUBLISHED" && status === "PUBLISHED") {
    await trackActivityEvent("PRODUCT_PUBLISHED", id, `Product published: ${name}`);
  }

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
    action: "PRODUCT_EDITED",
    entity: "Product",
    entityId: id,
    metadata: { name, status, actorEmail: session.user.email }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
}

export async function archiveProduct(id: string) {
  const session = await requireAdmin("Products", "Edit");
  await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  await createAuditLog({ action: "PRODUCT_ARCHIVED", entity: "Product", entityId: id });
  revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
  const session = await requireAdmin("Products", "Delete");
  const p = await prisma.product.findUnique({ where: { id } });
  await prisma.product.delete({ where: { id } });
  await createAuditLog({
    action: "PRODUCT_DELETED", entity: "Product", entityId: id,
    metadata: { name: p?.name, actorEmail: session.user.email }
  });
  revalidatePath("/admin/products");
}

// ---------- CATEGORIES ----------
export async function createCategory(data: FormData) {
  await requireAdmin("Categories", "Create");
  const name = data.get("name") as string;
  const slug = data.get("slug") as string;
  const description = data.get("description") as string;
  const parentId = data.get("parentId") as string || null;
  const icon = data.get("icon") as string;
  const image = data.get("image") as string;
  const seoTitle = data.get("seoTitle") as string;
  const seoDescription = data.get("seoDescription") as string;
  const sortOrder = parseInt(data.get("sortOrder") as string || "0");
  const isActive = data.get("isActive") !== "false";
  const displayMode = data.get("displayMode") as string || "GRID";
  const productsPerPage = parseInt(data.get("productsPerPage") as string || "20");
  const tableColumns = data.get("tableColumns") as string || null;

  await prisma.category.create({ 
    data: { name, slug, description, parentId, icon, image, seoTitle, seoDescription, sortOrder, isActive, displayMode, productsPerPage, tableColumns } 
  });
  await createAuditLog({ action: "CATEGORY_CREATED", entity: "Category", metadata: { name } });
  
  if (isActive) {
    await trackActivityEvent("CATEGORY_CREATED", null, `New category added: ${name}`);
  }
  
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, data: FormData) {
  await requireAdmin("Categories", "Edit");
  const name = data.get("name") as string;
  const slug = data.get("slug") as string;
  const description = data.get("description") as string;
  const parentId = data.get("parentId") as string || null;
  const icon = data.get("icon") as string;
  const image = data.get("image") as string;
  const seoTitle = data.get("seoTitle") as string;
  const seoDescription = data.get("seoDescription") as string;
  const sortOrder = parseInt(data.get("sortOrder") as string || "0");
  const isActive = data.get("isActive") !== "false";
  const displayMode = data.get("displayMode") as string || "GRID";
  const productsPerPage = parseInt(data.get("productsPerPage") as string || "20");
  const tableColumns = data.get("tableColumns") as string || null;

  await prisma.category.update({ 
    where: { id }, 
    data: { name, slug, description, parentId, icon, image, seoTitle, seoDescription, sortOrder, isActive, displayMode, productsPerPage, tableColumns } 
  });
  await createAuditLog({ action: "CATEGORY_EDITED", entity: "Category", entityId: id, metadata: { name } });
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin("Categories", "Delete");
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new Error(`Cannot delete category with ${productCount} products. Please reassign them first.`);
  }
  await prisma.category.delete({ where: { id } });
  await createAuditLog({ action: "CATEGORY_DELETED", entity: "Category", entityId: id });
  revalidatePath("/admin/categories");
}

// ---------- CUSTOM FIELDS ----------
export async function createFieldDefinition(data: FormData) {
  await requireAdmin("Products", "Manage");
  const name = data.get("name") as string;
  const slug = data.get("slug") as string;
  const type = data.get("type") as string;
  const required = data.get("required") === "true";
  const defaultValue = data.get("defaultValue") as string;
  const options = data.get("options") as string; // comma-separated → JSON
  const applyToTypes = data.get("applyToTypes") as string;
  const sortOrder = parseInt(data.get("sortOrder") as string || "0");

  const optionsJson = options ? JSON.stringify(options.split(",").map(o => o.trim())) : null;

  await prisma.fieldDefinition.create({
    data: { name, slug, type, required, defaultValue, options: optionsJson, sortOrder, applyToTypes }
  });
  await createAuditLog({ action: "FIELD_CREATED", entity: "FieldDefinition", metadata: { name, type } });
  revalidatePath("/admin/custom-fields");
  redirect("/admin/custom-fields");
}

export async function deleteFieldDefinition(id: string) {
  await requireAdmin("Products", "Manage");
  await prisma.fieldDefinition.delete({ where: { id } });
  await createAuditLog({ action: "FIELD_DELETED", entity: "FieldDefinition", entityId: id });
  revalidatePath("/admin/custom-fields");
}

// ---------- CUSTOMERS ----------
export async function suspendCustomer(id: string) {
  const session = await requireAdmin("Customers", "Manage");
  // We use emailVerified = null as a soft-suspend flag for simplicity
  await prisma.user.update({ where: { id }, data: { emailVerified: null } });
  await createAuditLog({
    action: "CUSTOMER_SUSPENDED", entity: "User", entityId: id,
    metadata: { actorEmail: session.user.email }
  });
  revalidatePath("/admin/customers");
}

// ---------- PAYMENT SETTINGS ----------
export async function updatePaymentMethod(id: string, data: FormData) {
  const session = await requireAdmin("Payments", "Manage");
  const isEnabled = data.get("isEnabled") === "true";
  const displayName = data.get("displayName") as string;
  const instructions = data.get("instructions") as string;
  const isTestMode = data.get("isTestMode") === "true";

  await prisma.paymentMethodConfig.update({
    where: { id },
    data: { isEnabled, displayName, instructions }
  });

  await createAuditLog({
    action: "PAYMENT_SETTINGS_CHANGED", entity: "PaymentMethodConfig", entityId: id,
    metadata: { isEnabled, displayName, actorEmail: session.user.email }
  });
  revalidatePath("/admin/settings/payments");
}

// ---------- COUPONS ----------
export async function createCoupon(data: FormData) {
  await requireAdmin("Coupons", "Create");
  const code = data.get("code") as string;
  const discountType = data.get("discountType") as string;
  const discountValue = parseFloat(data.get("discountValue") as string);
  const maxUses = data.get("maxUses") ? parseInt(data.get("maxUses") as string) : null;
  const expiresAt = data.get("expiresAt") ? new Date(data.get("expiresAt") as string) : null;

  await prisma.coupon.create({
    data: { code: code.toUpperCase(), discountType, discountValue, maxUses, expiresAt }
  });
  await createAuditLog({ action: "COUPON_CREATED", entity: "Coupon", metadata: { code } });
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function updateCoupon(id: string, data: FormData) {
  await requireAdmin("Coupons", "Edit");
  const code = data.get("code") as string;
  const discountType = data.get("discountType") as string;
  const discountValue = parseFloat(data.get("discountValue") as string);
  const maxUses = data.get("maxUses") ? parseInt(data.get("maxUses") as string) : null;
  const expiresAt = data.get("expiresAt") ? new Date(data.get("expiresAt") as string) : null;

  await prisma.coupon.update({
    where: { id },
    data: { code: code.toUpperCase(), discountType, discountValue, maxUses, expiresAt }
  });
  await createAuditLog({ action: "COUPON_EDITED", entity: "Coupon", entityId: id, metadata: { code } });
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(id: string) {
  await requireAdmin("Coupons", "Delete");
  await prisma.coupon.delete({ where: { id } });
  await createAuditLog({ action: "COUPON_DELETED", entity: "Coupon", entityId: id });
  revalidatePath("/admin/coupons");
}

// ---------- STAFF ----------
export async function updateUserRole(userId: string, roleName: string) {
  await requireAdmin("Staff", "Manage");
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw new Error("Role not found");

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: role.id }
  });

  await createAuditLog({ action: "USER_ROLE_UPDATED", entity: "User", entityId: userId, metadata: { roleName } });
  revalidatePath("/admin/staff");
}

export async function updateProxyLicenses(proxies: {id: string, staticLicense: string}[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized");
  }

  for (const p of proxies) {
    const product = await prisma.product.findUnique({ where: { id: p.id } });
    if (product) {
      const meta = product.metadata ? JSON.parse(product.metadata as string) : {};
      meta.staticLicense = p.staticLicense;
      await prisma.product.update({
        where: { id: p.id },
        data: { metadata: JSON.stringify(meta) }
      });
    }
  }

  revalidatePath("/admin/network-services/proxies");
}
