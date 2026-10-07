import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

// Helper to get or set an anonymous session ID
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get("analytics_session_id")?.value;

  if (existingSessionId) {
    return existingSessionId;
  }

  const newSessionId = crypto.randomUUID();
  return newSessionId;
}

// ----------------------------------------------------------------------------
// PRODUCT VIEWS
// ----------------------------------------------------------------------------

export async function trackProductView(productId: string, userId?: string) {
  try {
    const sessionId = await getOrCreateSessionId();

    // Deduplication window: 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const existingView = await prisma.analyticsEvent.findFirst({
      where: {
        eventType: "PRODUCT_VIEW",
        productId,
        OR: [
          { sessionId },
          { userId: userId || "undefined_fallback" }
        ],
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (existingView) {
      return; // Already viewed recently, don't spam events
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType: "PRODUCT_VIEW",
        productId,
        userId,
        sessionId,
      }
    });
  } catch (error) {
    // Failure isolation: log and ignore
    console.error("Failed to track product view:", error);
  }
}

// ----------------------------------------------------------------------------
// ADD TO CART
// ----------------------------------------------------------------------------

export async function trackAddToCart(productId: string, quantity: number, userId?: string) {
  try {
    const sessionId = await getOrCreateSessionId();

    await prisma.analyticsEvent.create({
      data: {
        eventType: "ADD_TO_CART",
        productId,
        userId,
        sessionId,
        metadata: JSON.stringify({ quantity })
      }
    });
  } catch (error) {
    console.error("Failed to track add to cart:", error);
  }
}

// ----------------------------------------------------------------------------
// PURCHASE COMPLETED
// ----------------------------------------------------------------------------

export async function trackPurchaseCompleted(orderId: string, userId: string) {
  try {
    // Retrieve order items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) return;

    // Create an event for each item
    for (const item of order.items) {
      await prisma.analyticsEvent.create({
        data: {
          eventType: "PURCHASE_COMPLETED",
          productId: item.productId,
          userId,
          metadata: JSON.stringify({ orderId, quantity: item.quantity, price: item.price })
        }
      });
    }

    // Also trigger general activity event
    await trackActivityEvent("PURCHASE_COMPLETED", null, "New purchase completed");

  } catch (error) {
    console.error("Failed to track purchase completed:", error);
  }
}

// ----------------------------------------------------------------------------
// GENERAL ACTIVITY
// ----------------------------------------------------------------------------

export async function trackActivityEvent(eventType: string, productId?: string | null, message?: string) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        productId,
        metadata: message ? JSON.stringify({ message }) : null
      }
    });
  } catch (error) {
    console.error(`Failed to track activity event [${eventType}]:`, error);
  }
}
