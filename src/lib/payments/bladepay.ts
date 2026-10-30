import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { fulfillOrder } from "@/lib/fulfillment";
import { processReferralCommission } from "@/lib/referrals";
import { trackPurchaseCompleted } from "@/lib/analytics";
import { createUserNotification, createAdminNotification } from "@/lib/notifications";

export const DEFAULT_BLADEPAY_BASE_URL = "https://api.bladepay.pro";
export const DEFAULT_BLADEPAY_TOKEN = "gw_5bb3b36ca2c30c2e6793bf8fe275f9bdedc668c707557b61358bc993d04d8b1a";
export const BLADEPAY_MIN_INR = 100;
export const BLADEPAY_MAX_INR = 10000;

export interface BladePayConfig {
  baseUrl: string;
  token: string;
  merchantCode?: string;
  isEnabled: boolean;
  mode: "BLADEPAY" | "MANUAL";
}

/**
 * Retrieves the current BladePay configuration from DB (paymentMethodConfig) or environment
 */
export async function getBladePayConfig(): Promise<BladePayConfig> {
  try {
    const config = await prisma.paymentMethodConfig.findUnique({
      where: { code: "UPI" },
    });

    let settings: any = {};
    if (config?.settings) {
      try {
        settings = JSON.parse(config.settings);
      } catch (e) {
        settings = {};
      }
    }

    const mode = settings.gatewayMode || (config?.mode === "AUTOMATIC" ? "BLADEPAY" : "BLADEPAY");
    const token = settings.bladePayToken?.trim() || process.env.BLADEPAY_API_TOKEN || DEFAULT_BLADEPAY_TOKEN;
    const baseUrl = settings.bladePayBaseUrl?.trim() || process.env.BLADEPAY_BASE_URL || DEFAULT_BLADEPAY_BASE_URL;
    const merchantCode = settings.bladePayMerchantCode || "MCH-20261026-5480";

    return {
      baseUrl: baseUrl.replace(/\/+$/, ""),
      token,
      merchantCode,
      isEnabled: config?.isEnabled ?? true,
      mode: mode as "BLADEPAY" | "MANUAL",
    };
  } catch (error) {
    return {
      baseUrl: DEFAULT_BLADEPAY_BASE_URL,
      token: process.env.BLADEPAY_API_TOKEN || DEFAULT_BLADEPAY_TOKEN,
      merchantCode: "MCH-20261026-5480",
      isEnabled: true,
      mode: "BLADEPAY",
    };
  }
}

/**
 * Creates an automated UPI Payin Order on BladePay and returns the Cashier Link
 */
export async function createBladePayPayinOrder({
  merchantOrderNo,
  amountInr,
  customerName,
  customerPhone,
  customerEmail,
  notifyUrl,
  returnUrl,
}: {
  merchantOrderNo: string;
  amountInr: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notifyUrl: string;
  returnUrl: string;
}): Promise<{
  success: boolean;
  cashierUrl?: string;
  gatewayOrderNo?: string;
  amount?: number;
  error?: string;
  raw?: any;
}> {
  if (amountInr < BLADEPAY_MIN_INR || amountInr > BLADEPAY_MAX_INR) {
    return {
      success: false,
      error: `BladePay UPI transaction range is ₹${BLADEPAY_MIN_INR} - ₹${BLADEPAY_MAX_INR.toLocaleString()} INR. Order amount is ₹${amountInr.toFixed(2)} INR.`,
    };
  }

  const config = await getBladePayConfig();
  const endpoint = `${config.baseUrl}/merchant/api/payin/create`;

  const payload = {
    merchantOrderNo,
    amount: amountInr.toFixed(2),
    currency: "INR",
    payinName: customerName || "Customer",
    payinPhone: customerPhone ? customerPhone.replace(/\D/g, "").slice(-10) : "9876543210",
    payinEmail: customerEmail || "customer@market.com",
    notifyUrl,
    returnUrl,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();

    if (data.code === 0 && data.data?.cashierUrl) {
      return {
        success: true,
        cashierUrl: data.data.cashierUrl,
        gatewayOrderNo: data.data.gatewayOrderNo,
        amount: data.data.amount,
        raw: data,
      };
    }

    return {
      success: false,
      error: data.msg || data.error || `BladePay error code ${data.code}`,
      raw: data,
    };
  } catch (err: any) {
    console.error("[BladePay] createPayinOrder request failed:", err);
    return {
      success: false,
      error: err.message || "Network error connecting to BladePay gateway",
    };
  }
}

/**
 * Queries BladePay directly to check transaction status (Official Query API)
 */
export async function queryBladePayOrder(orderNo: string): Promise<{
  success: boolean;
  isPaid: boolean;
  status?: string;
  payinState?: number;
  utr?: string;
  actualAmount?: number;
  gatewayOrderNo?: string;
  error?: string;
  raw?: any;
}> {
  const config = await getBladePayConfig();
  const endpoint = `${config.baseUrl}/merchant/api/payin/query`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({ orderNo }),
      cache: "no-store",
    });

    const data = await res.json();

    if (data.code === 0 && data.data) {
      const d = data.data;
      return {
        success: true,
        isPaid: Boolean(d.isPaid || d.payinState === 2 || d.status === "PAID"),
        status: d.status || (d.payinState === 2 ? "PAID" : "PENDING"),
        payinState: d.payinState,
        utr: d.utr,
        actualAmount: d.actualAmount ? parseFloat(d.actualAmount) : undefined,
        gatewayOrderNo: d.gatewayOrderNo,
        raw: d,
      };
    }

    return {
      success: false,
      isPaid: false,
      error: data.msg || `Order query returned code ${data.code}`,
      raw: data,
    };
  } catch (err: any) {
    console.error("[BladePay] queryOrder failed:", err);
    return {
      success: false,
      isPaid: false,
      error: err.message || "Failed to query BladePay transaction status",
    };
  }
}

/**
 * Verifies the incoming BladePay Webhook signature using MD5
 */
export function verifyBladePaySignature(payload: Record<string, any>, token: string): boolean {
  if (!payload || !payload.sign) return false;

  const { sign, ...data } = payload;

  // 1. Sort non-empty keys in ASCII alphabetical order
  const sortedKeys = Object.keys(data).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const val = data[key];
    if (val !== "" && val !== null && val !== undefined) {
      pairs.push(`${key}=${val}`);
    }
  }

  // 2. Append &key=<merchant_api_token>
  const stringToSign = pairs.join("&") + `&key=${token}`;

  // 3. Compute MD5 hash (lowercase)
  const expectedSign = crypto.createHash("md5").update(stringToSign, "utf8").digest("hex").toLowerCase();

  return sign.toLowerCase() === expectedSign;
}

/**
 * Fetches merchant balance from BladePay
 */
export async function getBladePayBalance(): Promise<{
  success: boolean;
  merchantId?: string;
  availableBalance?: number;
  pendingBalance?: number;
  totalPayinVolume?: number;
  totalPayoutVolume?: number;
  totalFeeCollected?: number;
  error?: string;
}> {
  const config = await getBladePayConfig();
  const endpoint = `${config.baseUrl}/merchant/api/balance`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (data.code === 0 && data.data) {
      return {
        success: true,
        merchantId: data.data.merchantId,
        availableBalance: data.data.availableBalance,
        pendingBalance: data.data.pendingBalance,
        totalPayinVolume: data.data.totalPayinVolume,
        totalPayoutVolume: data.data.totalPayoutVolume,
        totalFeeCollected: data.data.totalFeeCollected,
      };
    }
    return { success: false, error: data.msg || `Error code ${data.code}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch BladePay balance" };
  }
}

/**
 * Creates a UPI Payout (V3) to instantly transfer money to a recipient's UPI ID
 */
export async function createBladePayUpiPayout({
  merchantOrderNo,
  amountInr,
  upiId,
  recipientName,
  recipientPhone,
  notifyUrl,
}: {
  merchantOrderNo: string;
  amountInr: number;
  upiId: string;
  recipientName?: string;
  recipientPhone?: string;
  notifyUrl?: string;
}): Promise<{
  success: boolean;
  gatewayOrderNo?: string;
  cashState?: number;
  error?: string;
  raw?: any;
}> {
  const config = await getBladePayConfig();
  const endpoint = `${config.baseUrl}/merchant/api/payout/create`;

  const payload = {
    merchantOrderNo,
    version: "V3",
    amount: amountInr.toFixed(2),
    cashNumber: upiId,
    cashName: recipientName || "User",
    cashPhone: recipientPhone || "9876543210",
    ...(notifyUrl ? { notifyUrl } : {}),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();
    if (data.code === 0 && data.data) {
      return {
        success: true,
        gatewayOrderNo: data.data.gatewayOrderNo,
        cashState: data.data.cashState,
        raw: data.data,
      };
    }
    return { success: false, error: data.msg || `Payout error ${data.code}`, raw: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to execute UPI payout" };
  }
}

/**
 * Handles incoming BladePay Webhooks for Payin & Payout callbacks
 * Verifies signature, marks order/deposit as PAID, runs instant fulfillment, and returns "SUCCESS"
 */
export async function processBladePayWebhook(payload: Record<string, any>): Promise<{
  success: boolean;
  status: number;
  message: string;
  orderId?: string;
  depositId?: string;
}> {
  const config = await getBladePayConfig();
  const token = config.token || DEFAULT_BLADEPAY_TOKEN;

  // 1. Validate signature using MD5 specification
  const isValidSign = verifyBladePaySignature(payload, token);

  if (!isValidSign) {
    // Secondary fallback: query API verification
    const orderRef = payload.gatewayOrderNo || payload.merchantOrderNo;
    const queryCheck = orderRef ? await queryBladePayOrder(orderRef) : null;
    if (!queryCheck?.isPaid) {
      console.error("[BladePay Webhook] Invalid signature from incoming payload:", payload);
      return { success: false, status: 400, message: "Invalid signature" };
    }
  }

  const { merchantOrderNo, gatewayOrderNo, payinState, cashState, utr, amount, actualAmount } = payload;
  const isPaid =
    Number(payinState) === 2 ||
    Number(cashState) === 4 ||
    payload.status === "PAID" ||
    payload.status === "SUCCESS";

  console.log(
    `[BladePay Webhook] Order: ${merchantOrderNo}, GatewayOrder: ${gatewayOrderNo}, PayinState: ${payinState}, Paid: ${isPaid}`
  );

  if (!isPaid) {
    return { success: true, status: 200, message: "SUCCESS" };
  }

  // 2. Check if this is an Order
  const cleanOrderNo = merchantOrderNo ? String(merchantOrderNo).trim() : "";
  const rawId = cleanOrderNo.replace(/^ORD-/, "");

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: cleanOrderNo },
        { id: rawId },
        { payments: { some: { transactionId: gatewayOrderNo } } },
        { payments: { some: { transactionId: cleanOrderNo } } },
      ],
    },
    include: {
      user: true,
      payments: true,
    },
  });

  if (order) {
    if (order.paymentStatus !== "PAID") {
      let paymentRecord = order.payments.find(
        (p) => p.transactionId === gatewayOrderNo || p.transactionId === cleanOrderNo || p.method === "UPI"
      );

      if (paymentRecord) {
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: "PAID",
            transactionId: utr || gatewayOrderNo || paymentRecord.transactionId,
            verifiedAt: new Date(),
            metadata: JSON.stringify(payload),
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: "UPI",
            mode: "BLADEPAY",
            status: "PAID",
            amount: parseFloat(actualAmount || amount || "0") || order.paymentAmount || 0,
            currency: "INR",
            baseAmount: order.total,
            baseCurrency: "USD",
            fxRate: order.fxRate || 1,
            transactionId: utr || gatewayOrderNo || cleanOrderNo,
            verifiedAt: new Date(),
            metadata: JSON.stringify(payload),
          },
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          orderStatus: "PROCESSING",
        },
      });

      // Log event
      await prisma.auditLog.create({
        data: {
          actorEmail: "system@bladepay.webhook",
          action: "BLADEPAY_WEBHOOK_FULFILLED",
          entity: "Order",
          entityId: order.id,
          metadata: JSON.stringify({ gatewayOrderNo, utr, amount: actualAmount || amount }),
        },
      });

      // Automated Fulfillment Engine
      try {
        await fulfillOrder(order.id);
      } catch (fulfillErr) {
        console.error("[BladePay Webhook] Fulfillment error:", fulfillErr);
      }

      // Process Referral Commission
      try {
        await processReferralCommission(order.id);
      } catch (refErr) {
        console.error("[BladePay Webhook] Referral commission error:", refErr);
      }

      // Track Analytics
      try {
        await trackPurchaseCompleted(order.id, order.userId);
      } catch (analyticsErr) {
        console.error("[BladePay Webhook] Analytics error:", analyticsErr);
      }

      // Customer Notification
      createUserNotification({
        userId: order.userId,
        type: "ORDER",
        title: "Payment Received & Order Fulfilled",
        message: `Your payment of INR ${actualAmount || amount || ""} via UPI was confirmed. Your digital goods are ready!`,
        actionUrl: `/dashboard/orders/${order.id}`,
        priority: "HIGH",
        entityType: "ORDER",
        entityId: order.id,
      }).catch(console.error);

      // Admin Notification
      createAdminNotification({
        type: "ORDER",
        title: "BladePay UPI Payment Confirmed",
        message: `Order #${order.id.slice(0, 8)} paid INR ${actualAmount || amount} (UTR: ${utr || "N/A"}). Fulfilled automatically.`,
        actionUrl: `/admin/orders/${order.id}`,
        priority: "NORMAL",
        entityType: "ORDER",
        entityId: order.id,
      }).catch(console.error);
    }

    return { success: true, status: 200, message: "SUCCESS", orderId: order.id };
  }

  // 3. Check if this is a Wallet Deposit
  const deposit = await prisma.walletDeposit.findFirst({
    where: {
      OR: [
        { id: cleanOrderNo },
        { id: rawId.replace(/^DEP-/, "") },
        { transactionId: gatewayOrderNo },
      ],
    },
    include: {
      wallet: true,
    },
  });

  if (deposit && deposit.status !== "APPROVED") {
    await prisma.$transaction(async (tx) => {
      await tx.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: "APPROVED",
          transactionId: utr || gatewayOrderNo,
          approvedAt: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: deposit.walletId,
          type: "DEPOSIT",
          cashAmount: deposit.amountUsd,
          bonusAmount: deposit.bonusAmountUsd || 0,
          description: `BladePay UPI Deposit #${deposit.id.slice(0, 8)} (UTR: ${utr || gatewayOrderNo || ""})`,
          referenceType: "DEPOSIT",
          referenceId: deposit.id,
          status: "COMPLETED",
        },
      });
    });

    createUserNotification({
      userId: deposit.wallet.userId,
      type: "WALLET",
      title: "Wallet Deposit Credited",
      message: `Your deposit of $${deposit.amountUsd.toFixed(2)} via UPI (BladePay) has been credited to your balance!`,
      actionUrl: "/dashboard/wallet",
      priority: "HIGH",
    }).catch(console.error);

    return { success: true, status: 200, message: "SUCCESS", depositId: deposit.id };
  }

  return { success: true, status: 200, message: "SUCCESS" };
}

