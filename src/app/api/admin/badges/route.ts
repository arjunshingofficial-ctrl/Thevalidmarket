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

    const maxIso = (...isos: (string | null | undefined)[]): string | null => {
      const valid = isos.filter((s): s is string => Boolean(s));
      if (valid.length === 0) return null;
      valid.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      return valid[0];
    };

    const toIso = (date?: Date | null): string | null => {
      if (!date || isNaN(date.getTime())) return null;
      return date.toISOString();
    };

    // Run parallel count and latest timestamp queries with resilient fallbacks
    const [
      pendingOrders,
      latestOrder,
      pendingOrderPayments,
      latestOrderPayment,
      pendingWalletDeposits,
      latestWalletDeposit,
      newCustomers,
      latestUser,
      pendingChats,
      latestChat,
      openTickets,
      latestTicket,
      pendingComments,
      latestComment,
      pendingReviews,
      latestReview,
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
      prisma.order.findFirst({
        where: {
          OR: [
            { orderStatus: "PENDING" },
            { paymentStatus: "PENDING" },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }).catch(() => null),

      // 2. Order Payments in Review
      prisma.payment.count({
        where: {
          status: "PAYMENT_REVIEW",
          mode: "MANUAL",
        },
      }).catch(() => 0),
      prisma.payment.findFirst({
        where: {
          status: "PAYMENT_REVIEW",
          mode: "MANUAL",
        },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true, createdAt: true },
      }).catch(() => null),

      // 3. Wallet Deposits in Review
      prisma.walletDeposit.count({
        where: {
          status: "PAYMENT_REVIEW",
        },
      }).catch(() => 0),
      prisma.walletDeposit.findFirst({
        where: {
          status: "PAYMENT_REVIEW",
        },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true, createdAt: true },
      }).catch(() => null),

      // 4. New Customers in last 24h
      prisma.user.count({
        where: {
          createdAt: { gte: since24h },
        },
      }).catch(() => 0),
      prisma.user.findFirst({
        where: {
          createdAt: { gte: since24h },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }).catch(() => null),

      // 5. Chat Messages pending moderation
      prisma.chatMessage.count({
        where: {
          status: "PENDING",
        },
      }).catch(() => 0),
      prisma.chatMessage.findFirst({
        where: {
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }).catch(() => null),

      // 6. Open / Pending Support Tickets
      prisma.supportTicket.count({
        where: {
          status: { in: ["OPEN", "PENDING"] },
        },
      }).catch(() => 0),
      prisma.supportTicket.findFirst({
        where: {
          status: { in: ["OPEN", "PENDING"] },
        },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true, createdAt: true },
      }).catch(() => null),

      // 7. Blog Comments awaiting moderation
      prisma.blogComment.count({
        where: {
          status: "PENDING",
        },
      }).catch(() => 0),
      prisma.blogComment.findFirst({
        where: {
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }).catch(() => null),

      // 8. Product Reviews awaiting approval
      prisma.review.count({
        where: {
          status: "PENDING",
        },
      }).catch(() => 0),
      prisma.review.findFirst({
        where: {
          status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }).catch(() => null),
    ]);

    const totalPaymentReviews = pendingOrderPayments + pendingWalletDeposits;

    const latestOrderAt = toIso(latestOrder?.createdAt);
    const latestPaymentAt = maxIso(
      toIso(latestOrderPayment?.updatedAt || latestOrderPayment?.createdAt),
      toIso(latestWalletDeposit?.updatedAt || latestWalletDeposit?.createdAt)
    );
    const latestCustomerAt = toIso(latestUser?.createdAt);
    const latestChatAt = toIso(latestChat?.createdAt);
    const latestTicketAt = toIso(latestTicket?.updatedAt || latestTicket?.createdAt);
    const latestCommentAt = toIso(latestComment?.createdAt);
    const latestReviewAt = toIso(latestReview?.createdAt);

    const badges = {
      orders: pendingOrders,
      paymentReviews: totalPaymentReviews,
      customers: newCustomers,
      chat: pendingChats,
      support: openTickets,
      comments: pendingComments,
      reviews: pendingReviews,
    };

    const byPath: Record<string, { count: number; latestAt: string | null }> = {
      "/admin/orders": { count: pendingOrders, latestAt: latestOrderAt },
      "/admin/payments/review": { count: totalPaymentReviews, latestAt: latestPaymentAt },
      "/admin/customers": { count: newCustomers, latestAt: latestCustomerAt },
      "/admin/chat": { count: pendingChats, latestAt: latestChatAt },
      "/admin/support": { count: openTickets, latestAt: latestTicketAt },
      "/admin/blog/comments": { count: pendingComments, latestAt: latestCommentAt },
      "/admin/reviews": { count: pendingReviews, latestAt: latestReviewAt },
    };

    const byGroup: Record<string, { count: number; latestAt: string | null }> = {
      "ORDERS & COMMERCE": {
        count: pendingOrders + totalPaymentReviews,
        latestAt: maxIso(latestOrderAt, latestPaymentAt),
      },
      "CUSTOMERS": {
        count: newCustomers + pendingChats + openTickets + pendingReviews,
        latestAt: maxIso(latestCustomerAt, latestChatAt, latestTicketAt, latestReviewAt),
      },
      "CONTENT": {
        count: pendingComments,
        latestAt: latestCommentAt,
      },
    };

    const counts: Record<string, number> = {
      "/admin/orders": pendingOrders,
      "/admin/payments/review": totalPaymentReviews,
      "/admin/customers": newCustomers,
      "/admin/chat": pendingChats,
      "/admin/support": openTickets,
      "/admin/blog/comments": pendingComments,
      "/admin/reviews": pendingReviews,
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
      counts,
      total,
      recentItems,
    });
  } catch (error: any) {
    console.error("Error fetching admin badges:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch badges" }, { status: 500 });
  }
}
