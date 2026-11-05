"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getUpiEffectiveInrRate, getUsdToInrRate, getUsdToBtcRate } from "@/lib/fx";
import { createBladePayPayinOrder, getBladePayConfig } from "@/lib/payments/bladepay";
import { getBaseUrl } from "@/lib/siteUrl";
import { getSupportSettings } from "@/lib/settings/support";

/**
 * Admin: Create a new custom Payment Link / Payment Page
 */
export async function createPaymentLink(data: {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  allowedMethods?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  singleUse?: boolean;
  customSlug?: string;
  expiresInDays?: number;
}) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized: Administrator access required" };
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Payment page title is required" };
    }

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Please enter a valid amount greater than 0" };
    }

    // Generate or sanitize slug
    let slug = "";
    if (data.customSlug && data.customSlug.trim()) {
      slug = data.customSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (!slug) {
      // Auto-generate clean, readable slug e.g. pay-8f3b2
      const randomPart = Math.random().toString(36).substring(2, 8);
      const titleSlug = data.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .substring(0, 15)
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      slug = titleSlug ? `${titleSlug}-${randomPart}` : `pay-${randomPart}`;
    }

    // Ensure slug uniqueness
    const existing = await prisma.paymentLink.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Expiration date
    let expiresAt: Date | null = null;
    if (data.expiresInDays && data.expiresInDays > 0) {
      expiresAt = new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000);
    }

    const paymentLink = await prisma.paymentLink.create({
      data: {
        slug,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        amount,
        currency: (data.currency || "USD").toUpperCase(),
        allowedMethods: data.allowedMethods || "ALL",
        customerName: data.customerName?.trim() || null,
        customerEmail: data.customerEmail?.trim()?.toLowerCase() || null,
        customerPhone: data.customerPhone?.trim() || null,
        singleUse: Boolean(data.singleUse),
        expiresAt,
        status: "ACTIVE",
        createdById: session.user.id,
      },
    });

    revalidatePath("/admin/payment-links");
    return { success: true, paymentLink };
  } catch (err: any) {
    console.error("Error creating payment link:", err);
    return { success: false, error: err.message || "Failed to create payment page" };
  }
}

/**
 * Admin: Toggle Payment Link status (ACTIVE <-> DISABLED)
 */
export async function togglePaymentLinkStatus(id: string) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || !["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const link = await prisma.paymentLink.findUnique({ where: { id } });
    if (!link) return { success: false, error: "Payment link not found" };

    const newStatus = link.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await prisma.paymentLink.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/admin/payment-links");
    revalidatePath(`/pay/${link.slug}`);
    return { success: true, status: newStatus };
  } catch (err: any) {
    console.error("Error toggling payment link:", err);
    return { success: false, error: err.message || "Failed to update payment link" };
  }
}

/**
 * Admin: Delete Payment Link
 */
export async function deletePaymentLink(id: string) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const link = await prisma.paymentLink.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!link) return { success: false, error: "Payment link not found" };

    // If orders already exist, disable instead of hard deleting to preserve financial audit history
    if (link._count.orders > 0) {
      await prisma.paymentLink.update({
        where: { id },
        data: { status: "DISABLED" },
      });
      revalidatePath("/admin/payment-links");
      return { success: true, message: "Payment link disabled (contains transaction history)" };
    }

    await prisma.paymentLink.delete({ where: { id } });
    revalidatePath("/admin/payment-links");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting payment link:", err);
    return { success: false, error: err.message || "Failed to delete payment link" };
  }
}

/**
 * Public: Fetch a payment link by its public URL slug
 */
export async function getPaymentLinkPublic(slug: string) {
  try {
    const link = await prisma.paymentLink.findUnique({
      where: { slug },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    });

    if (!link) {
      return { success: false, error: "Payment link not found" };
    }

    // Check expiration
    if (link.expiresAt && new Date() > new Date(link.expiresAt) && link.status === "ACTIVE") {
      await prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: "EXPIRED" },
      });
      link.status = "EXPIRED";
    }

    // Fetch FX rates, configs, and support settings concurrently
    const [inrRate, btcRate, paymentConfigs, bladePayConfig, supportSettings] = await Promise.all([
      getUpiEffectiveInrRate(),
      getUsdToBtcRate(),
      prisma.paymentMethodConfig.findMany(),
      getBladePayConfig(),
      getSupportSettings(),
    ]);

    const fxRates = {
      INR: inrRate,
      BTC: btcRate,
      USDT: 1.0,
    };

    // Calculate approximate amounts
    const amountInr = Math.round(link.amount * inrRate);

    // Parse methods settings
    const methods: Record<string, any> = {};
    for (const c of paymentConfigs) {
      try {
        methods[c.code] = c.settings ? JSON.parse(c.settings) : {};
        methods[c.code].isEnabled = c.isEnabled;
      } catch (e) {
        methods[c.code] = { isEnabled: c.isEnabled };
      }
    }

    return {
      success: true,
      link,
      fxRates,
      amountInr,
      methods,
      bladePayEnabled: bladePayConfig.isEnabled,
      supportSettings,
    };
  } catch (err: any) {
    console.error("Error fetching public payment link:", err);
    return { success: false, error: "Failed to load payment link" };
  }
}

/**
 * Public: Process payment for a Payment Link
 */
export async function processPaymentLinkCheckout(data: {
  slug: string;
  name: string;
  email: string;
  phone?: string;
  paymentMethod: "BLADEPAY" | "UPI_MANUAL" | "USDT" | "BTC";
  utrTransactionId?: string;
  customerNote?: string;
}) {
  try {
    const { slug, name, email, phone, paymentMethod, utrTransactionId, customerNote } = data;

    if (!slug) return { success: false, error: "Invalid payment link" };
    if (!name || name.trim().length < 2) return { success: false, error: "Please enter your full name" };
    if (!email || !email.includes("@")) return { success: false, error: "Please enter a valid email address" };

    const link = await prisma.paymentLink.findUnique({ where: { slug } });
    if (!link) return { success: false, error: "Payment page not found" };

    if (link.status !== "ACTIVE") {
      return { success: false, error: `This payment page is currently ${link.status.toLowerCase()}` };
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      await prisma.paymentLink.update({ where: { id: link.id }, data: { status: "EXPIRED" } });
      return { success: false, error: "This payment page has expired" };
    }

    if (link.singleUse && link.paymentsCount > 0) {
      await prisma.paymentLink.update({ where: { id: link.id }, data: { status: "PAID" } });
      return { success: false, error: "This single-use payment link has already been paid" };
    }

    // Authenticated user check or lookup/create customer account
    const session = (await getServerSession(authOptions)) as any;
    let userId: string;

    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      const cleanEmail = email.trim().toLowerCase();
      let customer = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (!customer) {
        let customerRole = await prisma.role.findUnique({ where: { name: "CUSTOMER" } });
        if (!customerRole) {
          customerRole = await prisma.role.create({ data: { name: "CUSTOMER" } });
        }
        const accountId = Math.floor(10000000 + Math.random() * 90000000).toString();
        customer = await prisma.user.create({
          data: {
            name: name.trim(),
            email: cleanEmail,
            phone: phone?.trim() || null,
            accountId,
            roleId: customerRole.id,
          },
        });
      }
      userId = customer.id;
    }

    // Determine FX Rate & INR Amount
    const inrRate = await getUpiEffectiveInrRate();
    const amountInr = Math.round(link.amount * inrRate);

    // Create unique Order ID
    const orderId = `ORD-PL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 1. Create the Order
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId,
        paymentLinkId: link.id,
        subtotal: link.amount,
        discount: 0,
        tax: 0,
        total: link.amount,
        baseCurrency: "USD",
        paymentCurrency: paymentMethod.includes("UPI") ? "INR" : paymentMethod,
        paymentAmount: paymentMethod.includes("UPI") ? amountInr : link.amount,
        fxRate: paymentMethod.includes("UPI") ? inrRate : 1.0,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
      },
    });

    const baseUrl = getBaseUrl();

    // 2. Handle BladePay Instant UPI Gateway
    if (paymentMethod === "BLADEPAY") {
      const bladePayOrder = await createBladePayPayinOrder({
        merchantOrderNo: order.id,
        amountInr,
        customerName: name.trim(),
        customerPhone: phone?.trim(),
        customerEmail: email.trim(),
        notifyUrl: `${baseUrl}/api/webhooks/bladepay`,
        returnUrl: `${baseUrl}/payment-success?orderId=${order.id}&paymentLinkId=${link.id}`,
      });

      if (!bladePayOrder.success || !bladePayOrder.cashierUrl) {
        return {
          success: false,
          error: bladePayOrder.error || "Failed to initialize automated UPI gateway. Please try manual UPI or crypto.",
        };
      }

      // Record payment
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "UPI",
          mode: "BLADEPAY",
          status: "PAYMENT_REQUIRED",
          amount: amountInr,
          currency: "INR",
          baseAmount: link.amount,
          baseCurrency: "USD",
          fxRate: inrRate,
          transactionId: bladePayOrder.gatewayOrderNo || null,
          metadata: JSON.stringify({
            paymentLinkId: link.id,
            cashierUrl: bladePayOrder.cashierUrl,
            customerNote,
          }),
        },
      });

      return {
        success: true,
        type: "REDIRECT",
        cashierUrl: bladePayOrder.cashierUrl,
        orderId: order.id,
      };
    }

    // 3. Handle Manual UPI or Crypto Transfer
    const isUpiManual = paymentMethod === "UPI_MANUAL";
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: isUpiManual ? "UPI" : paymentMethod,
        mode: "MANUAL",
        status: utrTransactionId?.trim() ? "PAYMENT_REVIEW" : "PAYMENT_REQUIRED",
        amount: isUpiManual ? amountInr : link.amount,
        currency: isUpiManual ? "INR" : paymentMethod,
        baseAmount: link.amount,
        baseCurrency: "USD",
        fxRate: isUpiManual ? inrRate : 1.0,
        transactionId: utrTransactionId?.trim() || null,
        submittedAt: utrTransactionId?.trim() ? new Date() : null,
        metadata: JSON.stringify({
          paymentLinkId: link.id,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone?.trim(),
          customerNote: customerNote?.trim(),
        }),
      },
    });

    if (utrTransactionId?.trim()) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAYMENT_REVIEW",
          orderStatus: "ON_HOLD",
        },
      });

      // Update payment link counts
      await prisma.paymentLink.update({
        where: { id: link.id },
        data: {
          paymentsCount: { increment: 1 },
          lastPaidAt: new Date(),
        },
      });
    }

    return {
      success: true,
      type: "DIRECT",
      paymentId: payment.id,
      orderId: order.id,
      paymentStatus: payment.status,
    };
  } catch (err: any) {
    console.error("Error in processPaymentLinkCheckout:", err);
    return { success: false, error: err.message || "Failed to process payment" };
  }
}
