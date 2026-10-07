import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !["ADMIN", "STAFF", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "30d"; // 7d, 30d, 90d, 1y

    let days = 30;
    if (range === "7d") days = 7;
    else if (range === "90d") days = 90;
    else if (range === "1y") days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: startDate }
      },
      select: { total: true, createdAt: true }
    });

    // Group by day
    const revenueByDay: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      revenueByDay[d.toISOString().split("T")[0]] = 0;
    }

    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split("T")[0];
      if (revenueByDay[dateKey] !== undefined) {
        revenueByDay[dateKey] += order.total;
      }
    }

    // Convert to sorted array
    const data = Object.keys(revenueByDay).sort().map(date => ({
      date,
      revenue: revenueByDay[date]
    }));

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
