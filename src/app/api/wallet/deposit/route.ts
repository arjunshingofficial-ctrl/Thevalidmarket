import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUsdToInrRate, getUsdToBtcRate } from "@/lib/fx";
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
    if (paymentMethod === "UPI") {
      paymentCurrency = "INR";
      fxRate = await getUsdToInrRate();
    } else if (paymentMethod === "BTC") {
      paymentCurrency = "BTC";
      fxRate = await getUsdToBtcRate();
    } else if (paymentMethod === "USDT" || paymentMethod === "USDT_TRC20") {
      paymentCurrency = "USDT";
      fxRate = 1;
    }

    const paymentAmount = amountUsd * fxRate;

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

    return NextResponse.json({
      success: true,
      depositId: deposit.id
    });
  } catch (error: any) {
    console.error("Wallet deposit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
