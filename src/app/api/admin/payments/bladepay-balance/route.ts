import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getBladePayBalance } from "@/lib/payments/bladepay";

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const balanceData = await getBladePayBalance();
    return NextResponse.json(balanceData);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query BladePay balance" },
      { status: 500 }
    );
  }
}
