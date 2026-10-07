import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/fulfillment";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const orderId = resolvedParams.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus !== "PAID") {
      return NextResponse.json({ error: "Cannot reconcile an unpaid order" }, { status: 400 });
    }

    // Delete existing incorrect SERVICE entitlements for downloadable products
    await prisma.entitlement.deleteMany({
      where: {
        orderId: orderId,
        type: "SERVICE",
        product: {
          type: { in: ["DIGITAL_DOWNLOAD", "DIGITAL", "SOFTWARE"] }
        }
      }
    });
    
    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: "PROCESSING" }
    });

    // Run fulfillment which will now pick up the correct DOWNLOAD type and metadata
    await fulfillOrder(orderId);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Reconciliation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
