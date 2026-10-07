import { NextRequest, NextResponse } from "next/server";
import { uploadProductFile } from "@/lib/actions/media";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = await uploadProductFile(formData);
    return NextResponse.json(file);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
