import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/actions/admin";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
  }

  const data = await req.formData();
  const id = data.get("id") as string;
  const isEnabled = data.get("isEnabled") === "true";
  const displayName = data.get("displayName") as string;
  const instructions = data.get("instructions") as string;
  const mode = (data.get("mode") as string) || "MANUAL";
  const settings = data.get("settings") as string;

  await prisma.paymentMethodConfig.update({
    where: { id },
    data: { isEnabled, displayName, instructions, mode, settings }
  });

  await createAuditLog({
    action: "PAYMENT_SETTINGS_CHANGED",
    entity: "PaymentMethodConfig",
    entityId: id,
    metadata: { isEnabled, displayName, mode, actorEmail: session.user.email }
  });

  return NextResponse.json({ success: true });
}
