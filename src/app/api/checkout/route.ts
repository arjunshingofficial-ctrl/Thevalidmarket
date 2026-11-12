import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getWalletBalance, deductWalletFunds } from "@/lib/wallet";
import { createUserNotification, createAdminNotification } from "@/lib/notifications";
import { getBaseUrl } from "@/lib/siteUrl";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, paymentMethod, couponCode } = await req.json();
    
    if (!items || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Verify products exist and calculate total securely
    let subtotal = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      let product = await prisma.product.findUnique({ 
        where: { id: item.id },
        include: { category: true }
      });
      
      // Auto-create VIP Access product if it doesn't exist in the database
      if (!product && item.id === "vip-access") {
        let category = await prisma.category.findUnique({ where: { slug: "memberships" } });
        if (!category) {
          category = await prisma.category.create({ data: { name: "Memberships", slug: "memberships", isActive: true } });
        }
        product = await prisma.product.create({
          data: {
            id: "vip-access",
            categoryId: category.id,
            name: "VIP Access (1 Month)",
            slug: "vip-access",
            type: "SUBSCRIPTION",
            price: 10,
            status: "PUBLISHED"
          },
          include: { category: true }
        });
      }

      if (!product || product.status !== "PUBLISHED") {
        return NextResponse.json({ error: `Product ${item.name} is not available` }, { status: 400 });
      }
      
      let price = product.salePrice ?? product.price;

      // Make VIP Drops free for VIP users
      if (product.category?.slug === "vip-drops") {
        const hasVip = await prisma.orderItem.findFirst({
          where: {
            order: { userId: session.user.id, paymentStatus: "PAID" },
            product: { slug: "vip-access" }
          }
        });
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { role: true } });
        const isAdmin = user?.role?.name === "ADMIN";

        if (hasVip || isAdmin) {
          price = 0;
        }
      }

      subtotal += price * item.quantity;
      
      orderItemsToCreate.push({
        productId: product.id,
        price: price,
        quantity: item.quantity
      });
    }

    const tax = 0;
    let discount = 0;

    // Validate Coupon
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon) {
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
        }
        if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
          return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
        }
        
        appliedCoupon = coupon;
        if (coupon.discountType === "PERCENTAGE") {
          discount = subtotal * (coupon.discountValue / 100);
        } else if (coupon.discountType === "FIXED") {
          discount = coupon.discountValue;
        }
        // ensure discount doesn't exceed subtotal
        if (discount > subtotal) discount = subtotal;
      } else {
        return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
      }
    }

    const total = subtotal + tax - discount;

    if (total > 0 && !paymentMethod) {
      return NextResponse.json({ error: "Payment method required" }, { status: 400 });
    }

    // Auto-complete if free
    if (total === 0) {
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          subtotal,
          tax,
          discount,
          total,
          paymentStatus: "PAID",
          orderStatus: "PENDING",
          paymentCurrency: "USD",
          paymentAmount: 0,
          baseCurrency: "USD",
          fxRate: 1,
          items: {
            create: orderItemsToCreate
          }
        }
      });
      
      try {
        fetch(`${getBaseUrl()}/api/admin/payments/system-fulfill`, {
           method: 'POST', body: JSON.stringify({ orderId: order.id })
        }).catch(console.error);
      } catch(e) {}

      return NextResponse.json({ 
        success: true, 
        order, 
        redirectUrl: `/dashboard/orders/${order.id}`
      });
    }

    // Create Order in Database
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        subtotal,
        tax,
        discount,
        total,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        items: {
          create: orderItemsToCreate
        }
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    });

    // Increment coupon uses if applied
    if (appliedCoupon) {
      await prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: { currentUses: { increment: 1 } }
      });
    }

    // If Wallet payment
    if (paymentMethod === "WALLET") {
      const walletBalance = await getWalletBalance(session.user.id);
      
      if (!walletBalance.exists || walletBalance.status !== "ACTIVE") {
        return NextResponse.json({ error: "Wallet is suspended or not found" }, { status: 400 });
      }

      if (walletBalance.total < total) {
        return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
      }

      try {
        // Atomic deduction
        await deductWalletFunds(
          session.user.id,
          total,
          "ORDER",
          order.id,
          `Payment for Order #${order.id.slice(0, 8)}`
        );
        
        // Mark order as paid
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            paymentCurrency: "USD",
            paymentAmount: total,
            baseCurrency: "USD",
            fxRate: 1
          }
        });

        // Create Payment record for wallet payment
        await prisma.payment.create({
          data: {
            orderId: order.id,
            method: "WALLET",
            mode: "AUTOMATIC",
            transactionId: `WALLET-${order.id.slice(0, 8).toUpperCase()}`,
            amount: total,
            currency: "USD",
            baseAmount: total,
            baseCurrency: "USD",
            fxRate: 1,
            status: "PAID",
            verifiedAt: new Date(),
            metadata: JSON.stringify({
              couponCode: appliedCoupon?.code || null,
              discount,
              subtotal,
              walletPayment: true,
            }),
          },
        });

        // Trigger fulfillment via internal fetch or directly if imported
        // (Usually there's a webhook or fulfillment logic to call, but setting to PAID triggers UI at least)
        // Note: Full automatic fulfillment logic should run here or via a job.
        try {
          fetch(`${getBaseUrl()}/api/admin/payments/system-fulfill`, {
             method: 'POST', body: JSON.stringify({ orderId: order.id })
          }).catch(console.error);
        } catch(e) {}

        return NextResponse.json({ 
          success: true, 
          order, 
          redirectUrl: `/dashboard/orders/${order.id}`
        });

        // Trigger Notifications for Wallet Payment
        Promise.all([
          createUserNotification({
            userId: session.user.id,
            type: "ORDER",
            title: "Order Placed Successfully",
            message: `Your order for $${total.toFixed(2)} was paid via Wallet.`,
            priority: "NORMAL",
            actionUrl: `/dashboard/orders/${order.id}`,
            entityType: "ORDER",
            entityId: order.id
          }),
          createAdminNotification({
            type: "ORDER",
            title: "New Order (Wallet)",
            message: `Order #${order.id.slice(0,8)} placed by ${session.user.name || session.user.email} for $${total.toFixed(2)}.`,
            priority: "NORMAL",
            actionUrl: `/admin/orders/${order.id}`,
            entityType: "ORDER",
            entityId: order.id
          })
        ]).catch(err => console.error("Notification trigger failed", err));

      } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to process wallet payment" }, { status: 400 });
      }
    }

    // Check payment method config for external methods
    const methodConfig = await prisma.paymentMethodConfig.findUnique({
      where: { code: paymentMethod }
    });

    if (!methodConfig || !methodConfig.isEnabled) {
      return NextResponse.json({ error: "Selected payment method is unavailable" }, { status: 400 });
    }

    // Get current FX rates securely from the server
    const { getUpiEffectiveInrRate, getUsdToBtcRate } = await import("@/lib/fx");
    
    let fxRate = 1;
    let paymentCurrency = "USD";
    let paymentAmount = total;

    const isUpiPayment =
      paymentMethod === "SILKPAY" ||
      paymentMethod === "BLADEPAY" ||
      paymentMethod === "UPI" ||
      paymentMethod === "UPI_MANUAL" ||
      paymentMethod.startsWith("UPI");

    if (isUpiPayment) {
      // Silently apply 20% UPI tax to effective INR conversion
      fxRate = await getUpiEffectiveInrRate();
      paymentCurrency = "INR";
      paymentAmount = Number((total * fxRate).toFixed(2));
    } else if (paymentMethod === "BTC") {
      fxRate = await getUsdToBtcRate();
      paymentCurrency = "BTC";
      paymentAmount = total * fxRate;
    } else if (paymentMethod === "USDT_TRC20" || paymentMethod === "USDT") {
      fxRate = 1;
      paymentCurrency = "USDT";
      paymentAmount = total;
    }

    // Update order with FX and payment amount lock
    await prisma.order.update({
      where: { id: order.id },
      data: {
        baseCurrency: "USD",
        paymentCurrency,
        paymentAmount,
        fxRate
      }
    });

    // 1. SILKPAY / BLADEPAY AUTOMATED UPI GATEWAY
    if (paymentMethod === "SILKPAY" || paymentMethod === "BLADEPAY") {
      const { createBladePayPayinOrder } = await import("@/lib/payments/bladepay");
      const baseUrl = getBaseUrl();
      const notifyUrl = `${baseUrl}/api/payin-webhook`;
      const returnUrl = `${baseUrl}/payment-success?orderId=${order.id}`;

      const payinResult = await createBladePayPayinOrder({
        merchantOrderNo: order.id,
        amountInr: paymentAmount,
        customerName: session.user.name || "Customer",
        customerEmail: session.user.email || undefined,
        customerPhone: session.user.phone || undefined,
        notifyUrl,
        returnUrl,
      });

      if (payinResult.success && payinResult.cashierUrl) {
        const paymentRecord = await prisma.payment.create({
          data: {
            orderId: order.id,
            method: "SILKPAY",
            mode: "AUTOMATIC",
            transactionId: payinResult.gatewayOrderNo || order.id,
            amount: paymentAmount,
            currency: "INR",
            baseAmount: total,
            baseCurrency: "USD",
            fxRate,
            status: "PENDING",
            metadata: JSON.stringify({
              gatewayOrderNo: payinResult.gatewayOrderNo,
              cashierUrl: payinResult.cashierUrl,
              notifyUrl,
              returnUrl,
              couponCode: appliedCoupon?.code || null,
              discount,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          order,
          paymentRecord,
          redirectUrl: payinResult.cashierUrl,
        });
      } else {
        return NextResponse.json({
          error: payinResult.error || "SilkPay gateway is currently unavailable. Please select Direct UPI Transfer to complete your order."
        }, { status: 400 });
      }
    }

    // 2. DIRECT UPI PAYMENT (QR Code & VPA Transfer)
    if (paymentMethod === "UPI" || paymentMethod === "UPI_MANUAL") {
      let upiSettings: any = {};
      try {
        if (methodConfig.settings) upiSettings = JSON.parse(methodConfig.settings);
      } catch (e) {}

      const effectiveVpa = upiSettings?.vpa?.trim() || "eqw@upi";
      const effectiveReceiver = upiSettings?.receiverName?.trim() || "The Valid Market";
      const effectiveMode = upiSettings?.upiPaymentMode || (effectiveVpa ? "DIRECT_SUPPORT" : "SUPPORT");
      const whatsappNumber = upiSettings?.whatsappNumber || "+916389458286";
      const telegramUsername = upiSettings?.telegramUsername || "https://t.me/+xpN22t7nSkk4ZWJl";

      const mergedSettings = {
        ...upiSettings,
        vpa: effectiveVpa,
        receiverName: effectiveReceiver,
        upiPaymentMode: effectiveMode,
        whatsappNumber,
        telegramUsername,
        requireTransactionId: true,
        requireProof: true,
        couponCode: appliedCoupon?.code || null,
        discount,
      };

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
      const paymentRecord = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: "UPI",
          mode: "MANUAL",
          amount: paymentAmount,
          currency: "INR",
          baseAmount: total,
          baseCurrency: "USD",
          fxRate,
          status: "PAYMENT_REQUIRED",
          expiresAt,
          metadata: JSON.stringify(mergedSettings),
        },
      });

      createUserNotification({
        userId: session.user.id,
        type: "PAYMENT",
        title: "Payment Required - UPI Transfer",
        message: `Please complete your UPI payment of ₹${paymentAmount.toFixed(2)} to ${effectiveVpa} and submit your UTR.`,
        actionUrl: `/payment/${paymentRecord.id}`,
        entityType: "PAYMENT",
        entityId: paymentRecord.id
      }).catch(err => console.error("Notification trigger failed", err));

      return NextResponse.json({
        success: true,
        order,
        paymentRecord,
        redirectUrl: `/payment/${paymentRecord.id}`,
      });
    }

    if (methodConfig.mode === "MANUAL") {
      // Create Manual Payment Record
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      let parsedSettings: any = {};
      try {
        if (methodConfig.settings) parsedSettings = JSON.parse(methodConfig.settings);
      } catch (e) {}

      const paymentRecord = await prisma.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          mode: "MANUAL",
          amount: paymentAmount, // Store converted amount
          currency: paymentCurrency,
          baseAmount: total,     // Store original base amount
          baseCurrency: "USD",
          fxRate,
          metadata: JSON.stringify({
            ...parsedSettings,
            couponCode: appliedCoupon?.code || null,
            discount,
          }),
          status: "PAYMENT_REQUIRED",
          expiresAt: expiresAt
        }
      });

      // (We don't await this so it fires in the background)
      Promise.all([
        createUserNotification({
          userId: session.user.id,
          type: "PAYMENT",
          title: "Payment Initiated",
          message: `Please complete your payment of ${paymentCurrency} ${paymentAmount.toFixed(2)}.`,
          priority: "NORMAL",
          actionUrl: `/payment/${paymentRecord.id}`,
          entityType: "PAYMENT",
          entityId: paymentRecord.id
        }),
        createAdminNotification({
          type: "PAYMENT",
          title: "New Payment Attempt",
          message: `User ${session.user.name || session.user.email} started a ${paymentMethod} payment for Order #${order.id.slice(0,8)} (${paymentCurrency} ${paymentAmount.toFixed(2)}).`,
          priority: "NORMAL",
          actionUrl: `/admin/orders/${order.id}`,
          entityType: "PAYMENT",
          entityId: paymentRecord.id
        })
      ]).catch(err => console.error("Notification trigger failed", err));

      return NextResponse.json({ 
        success: true, 
        order, 
        paymentRecord,
        redirectUrl: `/payment/${paymentRecord.id}`
      });
    }

    // Safety fallback: Never create fake sandbox transactions in production
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "FAILED", orderStatus: "CANCELLED" },
    });

    return NextResponse.json({
      error: "The selected payment method is currently unavailable.",
    }, { status: 400 });

  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
