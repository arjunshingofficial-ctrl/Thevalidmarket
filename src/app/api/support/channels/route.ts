import { NextResponse } from "next/server";
import { getSupportSettings } from "@/lib/settings/support";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const support = await getSupportSettings();
    return NextResponse.json(support);
  } catch (error: any) {
    return NextResponse.json(
      {
        telegramUrl: "https://t.me/+xpN22t7nSkk4ZWJl",
        telegramActive: true,
        whatsappUrl: "",
        whatsappActive: false,
        supportEmail: "support@thevalidmarket.com",
      },
      { status: 200 }
    );
  }
}
