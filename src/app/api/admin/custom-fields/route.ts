import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";
import type { Session } from "next-auth";

function requireAdmin(session: Session | null) {
  if (!session?.user) return false;
  return ["ADMIN", "STAFF", "MANAGER"].includes(session.user.role as string);
}

// GET — auth check, returns 403 if not admin
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session as Session | null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ message: "Use POST to create fields" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.formData();
  const name = data.get("name") as string;
  const slug = data.get("slug") as string;
  const type = data.get("type") as string;
  const required = data.get("required") === "true";
  const isActive = data.get("isActive") === "true";
  const defaultValue = data.get("defaultValue") as string;
  const sortOrder = parseInt(data.get("sortOrder") as string || "0");
  const rawOptions = data.get("options") as string;
  const options = rawOptions ? JSON.stringify(rawOptions.split(",").map((o: string) => o.trim()).filter(Boolean)) : null;
  const applyToTypesRaw = data.getAll("applyToTypes") as string[];
  const applyToTypes = applyToTypesRaw.length > 0 ? JSON.stringify(applyToTypesRaw) : null;

  const existing = await prisma.fieldDefinition.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "A field with this slug already exists" }, { status: 409 });

  const field = await prisma.fieldDefinition.create({
    data: { name, slug, type, required, isActive, defaultValue, sortOrder, options, applyToTypes }
  });

  await createAuditLog({ action: "FIELD_CREATED", entity: "FieldDefinition", entityId: field.id, metadata: { name, type } });
  return NextResponse.json(field, { status: 201 });
}
