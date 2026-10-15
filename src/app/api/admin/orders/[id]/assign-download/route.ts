import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    const body = await req.json();
    const { fileId, customNote } = body;

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const file = await prisma.productFile.findUnique({
      where: { id: fileId },
      include: { product: true },
    });

    if (!file) {
      return NextResponse.json({ error: "Product file not found" }, { status: 404 });
    }

    // Associate with the matching order item if product matches, otherwise the first item
    const matchingItem =
      order.items.find((item) => item.productId === file.productId) || order.items[0];

    if (!matchingItem) {
      return NextResponse.json(
        { error: "Order has no items to associate with entitlement" },
        { status: 400 }
      );
    }

    // Check if an entitlement already exists for this exact file on this order
    const existingEntitlement = await prisma.entitlement.findFirst({
      where: {
        orderId: order.id,
        userId: order.userId,
        type: "DOWNLOAD",
        metadata: { contains: file.id },
      },
    });

    if (existingEntitlement) {
      return NextResponse.json(
        {
          error: "This file is already assigned to this order",
          downloadUrl: `/api/download/${file.id}`,
        },
        { status: 400 }
      );
    }

    const metadata = {
      fileId: file.id,
      fileName: file.originalName,
      fileVersion: file.version,
      fileSize: file.fileSize,
      assignedBy: session.user.email,
      assignedAt: new Date().toISOString(),
      note: customNote || "Direct file assignment by administrator",
    };

    const entitlement = await prisma.entitlement.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        orderItemId: matchingItem.id,
        productId: file.productId,
        type: "DOWNLOAD",
        status: "ACTIVE",
        startsAt: new Date(),
        metadata: JSON.stringify(metadata),
      },
    });

    // Notify the customer in their account dashboard
    await createUserNotification({
      userId: order.userId,
      type: "ORDER_DOWNLOAD_ASSIGNED",
      title: "New Download File Available",
      message: `A downloadable file "${file.originalName}" has been assigned to your Order #${order.id
        .slice(0, 8)
        .toUpperCase()}. You can download it directly from your dashboard.`,
      actionUrl: "/dashboard/downloads",
      entityType: "Order",
      entityId: order.id,
    });

    return NextResponse.json({
      success: true,
      entitlement,
      file: {
        id: file.id,
        name: file.originalName,
        version: file.version,
        size: file.fileSize,
      },
      downloadUrl: `/api/download/${file.id}`,
    });
  } catch (err: any) {
    console.error("Assign download error:", err);
    return NextResponse.json({ error: err.message || "Failed to assign download" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN", "MANAGER", "STAFF"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    const { searchParams } = new URL(req.url);
    const entitlementId = searchParams.get("entitlementId");

    if (!entitlementId) {
      return NextResponse.json({ error: "Entitlement ID is required" }, { status: 400 });
    }

    await prisma.entitlement.delete({
      where: {
        id: entitlementId,
        orderId: orderId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Revoke download error:", err);
    return NextResponse.json({ error: err.message || "Failed to revoke download" }, { status: 500 });
  }
}
