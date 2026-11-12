import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUsdToBtcRate, getUpiEffectiveInrRate } from "@/lib/fx";
import { createWalletIfNotExists } from "@/lib/wallet";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amountUsd, paymentMethod } = await req.json();

    if (!amountUsd || amountUsd <= 0 || !paymentMethod) {
      return NextResponse.json({ error: "Invalid deposit amount or method" }, { status: 400 });
    }

    // Load Wallet config
    const settings = await prisma.siteSettings.findUnique({ where: { id: "GLOBAL" } });
    const walletConfig = settings?.walletConfig ? JSON.parse(settings.walletConfig) : {
      depositEnabled: true,
      bonusEnabled: true,
      bonusRate: 100, // 100%
      minDeposit: 10,
      maxDeposit: 1000,
      maxBonus: 100
    };

    if (!walletConfig.depositEnabled) {
      return NextResponse.json({ error: "Deposits are currently disabled." }, { status: 400 });
    }

    if (amountUsd < (walletConfig.minDeposit || 0)) {
      return NextResponse.json({ error: `Minimum deposit is $${walletConfig.minDeposit}` }, { status: 400 });
    }

    if (amountUsd > (walletConfig.maxDeposit || 10000)) {
      return NextResponse.json({ error: `Maximum deposit is $${walletConfig.maxDeposit}` }, { status: 400 });
    }

    // Calculate Bonus
    let bonusAmountUsd = 0;
    if (walletConfig.bonusEnabled && amountUsd >= 50) {
      bonusAmountUsd = amountUsd * ((walletConfig.bonusRate || 0) / 100);
      if (walletConfig.maxBonus && bonusAmountUsd > walletConfig.maxBonus) {
        bonusAmountUsd = walletConfig.maxBonus;
      }
    }

    // Ensure wallet exists
    const wallet = await createWalletIfNotExists(session.user.id);

    if (wallet.status !== "ACTIVE") {
      return NextResponse.json({ error: "Wallet is suspended." }, { status: 400 });
    }

    // Determine FX Rate for external payment collection
    let fxRate = 1;
    let paymentCurrency = "USD";
    const isUpi = paymentMethod === "UPI" || paymentMethod === "UPI_MANUAL" || paymentMethod.startsWith("UPI");

    if (isUpi) {
      paymentCurrency = "INR";
      fxRate = await getUpiEffectiveInrRate(); // 20% UPI tax silently included
    } else if (paymentMethod === "BTC") {
      fxRate = await getUsdToBtcRate();
      paymentCurrency = "BTC";
    } else if (paymentMethod === "USDT" || paymentMethod === "USDT_TRC20") {
      paymentCurrency = "USDT";
      fxRate = 1;
    }

    const paymentAmount = Number((amountUsd * fxRate).toFixed(2));

    // Fetch Payment Method for Snapshotting
    const methodConfig = await prisma.paymentMethodConfig.findUnique({
      where: { code: paymentMethod }
    });

    // Create WalletDeposit
    const deposit = await prisma.walletDeposit.create({
      data: {
        walletId: wallet.id,
        amountUsd,
        bonusAmountUsd,
        paymentMethod,
        paymentCurrency,
        paymentAmount,
        fxRate,
        metadata: methodConfig?.settings, // Snapshot payment destination
        status: "PENDING",
      }
    });

    // If BladePay automated UPI is chosen (code === "UPI" and mode === "AUTOMATIC"), initiate BladePay cashier
    if (paymentMethod === "UPI" && methodConfig?.mode === "AUTOMATIC") {
      try {
        const { createBladePayPayinOrder } = await import("@/lib/payments/bladepay");
        const { getBaseUrl } = await import("@/lib/siteUrl");
        const baseUrl = getBaseUrl();
        const notifyUrl = `${baseUrl}/api/payin-webhook`;
        const returnUrl = `${baseUrl}/dashboard/wallet?depositSuccess=${deposit.id}`;

        const payinRes = await createBladePayPayinOrder({
          merchantOrderNo: `DEP-${deposit.id}`,
          amountInr: paymentAmount,
          customerName: session.user.name || "Wallet User",
          customerEmail: session.user.email || undefined,
          customerPhone: (session.user as any).phone || undefined,
          notifyUrl,
          returnUrl,
        });

        if (payinRes.success && payinRes.cashierUrl) {
          await prisma.walletDeposit.update({
            where: { id: deposit.id },
            data: {
              transactionId: payinRes.gatewayOrderNo || `BLADE_${deposit.id.slice(0, 8)}`,
              metadata: JSON.stringify({
                gatewayOrderNo: payinRes.gatewayOrderNo,
                cashierUrl: payinRes.cashierUrl,
                notifyUrl,
                returnUrl,
              }),
            },
          });

          return NextResponse.json({
            success: true,
            depositId: deposit.id,
            redirectUrl: payinRes.cashierUrl,
          });
        }
      } catch (bladeErr) {
        console.error("[Wallet Deposit] BladePay creation error:", bladeErr);
      }
    }

    return NextResponse.json({
      success: true,
      depositId: deposit.id,
      redirectUrl: `/dashboard/wallet/deposit/${deposit.id}`,
    });
  } catch (error: any) {
    console.error("Wallet deposit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
