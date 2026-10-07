"use server";

import { trackAddToCart } from "@/lib/analytics";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function logAddToCartAction(productId: string, quantity: number) {
  try {
    const session = await getServerSession(authOptions) as any;
    await trackAddToCart(productId, quantity, session?.user?.id);
  } catch (error) {
    // Ignore, analytics must not break execution
  }
}
