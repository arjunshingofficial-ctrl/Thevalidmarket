import { NextRequest, NextResponse } from "next/server";
import { processBladePayWebhook } from "@/lib/payments/bladepay";

export async function POST(req: NextRequest) {
  try {
    let payload: Record<string, any> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((val, key) => {
        payload[key] = val;
      });
    } else {
      try {
        payload = await req.json();
      } catch {
        const text = await req.text();
        try {
          payload = JSON.parse(text);
        } catch {
          payload = Object.fromEntries(new URLSearchParams(text));
        }
      }
    }

    const result = await processBladePayWebhook(payload);

    if (!result.success) {
      return new NextResponse(result.message || "FAILED", {
        status: result.status || 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new NextResponse("SUCCESS", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    console.error("[Payin Webhook Route Error]:", err);
    return new NextResponse("SERVER_ERROR", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export async function GET() {
  return new NextResponse("BladePay Payin Webhook is Live", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
