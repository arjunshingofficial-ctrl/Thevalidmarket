import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "STAFF", "MANAGER", "SUPER_ADMIN"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !ALLOWED_ROLES.includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Run parallel count queries with resilient fallbacks
    const [
      pendingOrders,
      pendingOrderPayments,
      pendingWalletDeposits,
      newCustomers,
      pendingChats,
      openTickets,
      pendingComments,
      pendingReviews,
    ] = await Promise.all([
      // 1. Pending / Needs Fulfillment Orders
      prisma.order.count({
        where: {
          OR: [
            { orderStatus: "PENDING" },
            { paymentStatus: "PENDING" },
          ],
        },
      }).catch(() => 0),

      // 2. Order Payments in Review
      prisma.payment.count({
        where: {
          status: "PAYMENT_REVIEW",
          mode: "MANUAL",
        },
      }).catch(() => 0),

      // 3. Wallet Deposits in Review
      prisma.walletDeposit.count({
        where: {
          status: "PAYMENT_REVIEW",
        },
      }).catch(() => 0),

      // 4. New Customers in last 24h
      prisma.user.count({
        where: {
          createdAt: { gte: since24h },
        },
      }).catch(() => 0),

      // 5. Chat Messages pending moderation
      prisma.chatMessage.count({
        where: {
          status: "PENDING",
        },
      }).catch(() => 0),

      // 6. Open / Pending Support Tickets
      prisma.supportTicket.count({
        where: {
          status: { in: ["OPEN", "PENDING"] },
        },
      }).catch(() => 0),

      // 7. Blog Comments awaiting moderation
      prisma.blogComment.count({
        where: {
          status: "PENDING",
        },
      }).catch(() => 0),

      // 8. Product Reviews awaiting approval
      prisma.review.count({
        where: {
          status: "PENDING",
        },
      }).catch(() => 0),
    ]);

    const totalPaymentReviews = pendingOrderPayments + pendingWalletDeposits;

    const badges = {
      orders: pendingOrders,
      paymentReviews: totalPaymentReviews,
      customers: newCustomers,
      chat: pendingChats,
      support: openTickets,
      comments: pendingComments,
      reviews: pendingReviews,
    };

    const byPath: Record<string, number> = {
      "/admin/orders": pendingOrders,
      "/admin/payments/review": totalPaymentReviews,
      "/admin/customers": newCustomers,
      "/admin/chat": pendingChats,
      "/admin/support": openTickets,
      "/admin/blog/comments": pendingComments,
      "/admin/reviews": pendingReviews,
    };

    const byGroup: Record<string, number> = {
      "ORDERS & COMMERCE": pendingOrders + totalPaymentReviews,
      "CUSTOMERS": newCustomers + pendingChats + openTickets + pendingReviews,
      "CONTENT": pendingComments,
    };

    const total =
      pendingOrders +
      totalPaymentReviews +
      newCustomers +
      pendingChats +
      openTickets +
      pendingComments +
      pendingReviews;

    // Fetch sample recent actionable items for quick navigation dropdown
    const recentItems: Array<{
      id: string;
      category: string;
      title: string;
      subtitle: string;
      href: string;
      time: string;
    }> = [];

    if (totalPaymentReviews > 0) {
      recentItems.push({
        id: "payment-reviews",
        category: "Payment Reviews",
        title: `${totalPaymentReviews} Payment ${totalPaymentReviews === 1 ? "Review" : "Reviews"} Pending`,
        subtitle: "Manual orders/deposits requiring payment verification",
        href: "/admin/payments/review",
        time: "Action Required",
      });
    }

    if (pendingOrders > 0) {
      recentItems.push({
        id: "orders-pending",
        category: "Orders",
        title: `${pendingOrders} Pending ${pendingOrders === 1 ? "Order" : "Orders"}`,
        subtitle: "Orders awaiting payment or fulfillment",
        href: "/admin/orders",
        time: "Needs Attention",
      });
    }

    if (pendingComments > 0) {
      recentItems.push({
        id: "comments-pending",
        category: "Comments",
        title: `${pendingComments} ${pendingComments === 1 ? "Comment" : "Comments"} Awaiting Approval`,
        subtitle: "New blog comments or user replies submitted",
        href: "/admin/blog/comments",
        time: "Moderation Queue",
      });
    }

    if (openTickets > 0) {
      recentItems.push({
        id: "tickets-open",
        category: "Support",
        title: `${openTickets} Open ${openTickets === 1 ? "Ticket" : "Tickets"}`,
        subtitle: "Customer support requests waiting for reply",
        href: "/admin/support",
        time: "Support Desk",
      });
    }

    if (pendingChats > 0) {
      recentItems.push({
        id: "chats-pending",
        category: "Chat",
        title: `${pendingChats} Chat ${pendingChats === 1 ? "Message" : "Messages"} Pending`,
        subtitle: "Community messages awaiting moderation",
        href: "/admin/chat",
        time: "Chat Room",
      });
    }

    if (newCustomers > 0) {
      recentItems.push({
        id: "new-users",
        category: "Customers",
        title: `${newCustomers} New ${newCustomers === 1 ? "User" : "Users"} Registered`,
        subtitle: "Accounts created in the last 24 hours",
        href: "/admin/customers",
        time: "New Registrations",
      });
    }

    if (pendingReviews > 0) {
      recentItems.push({
        id: "product-reviews",
        category: "Reviews",
        title: `${pendingReviews} Product ${pendingReviews === 1 ? "Review" : "Reviews"} Pending`,
        subtitle: "Customer ratings awaiting approval",
        href: "/admin/reviews",
        time: "Review Queue",
      });
    }

    return NextResponse.json({
      badges,
      byPath,
      byGroup,
      total,
      recentItems,
    });
  } catch (error: any) {
    console.error("Error fetching admin badges:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch badges" }, { status: 500 });
  }
}
