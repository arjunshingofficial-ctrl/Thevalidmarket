import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    });
    
    if (user?.role?.name !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const config = {
      depositEnabled: !!body.depositEnabled,
      bonusEnabled: !!body.bonusEnabled,
      bonusRate: Number(body.bonusRate) || 0,
      minDeposit: Number(body.minDeposit) || 0,
      maxDeposit: Number(body.maxDeposit) || 0,
      maxBonus: Number(body.maxBonus) || 0
    };

    await prisma.siteSettings.upsert({
      where: { id: "GLOBAL" },
      update: { walletConfig: JSON.stringify(config) },
      create: {
        id: "GLOBAL",
        walletConfig: JSON.stringify(config)
      }
    });

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    console.error("Wallet settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
