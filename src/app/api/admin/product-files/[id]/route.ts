import { NextRequest, NextResponse } from "next/server";
import { deleteProductFile } from "@/lib/actions/media";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    
    await deleteProductFile(id, productId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
