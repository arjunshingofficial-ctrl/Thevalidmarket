import { prisma } from "@/lib/prisma";

export async function processReferralCommission(orderId: string) {
  try {
    // Get order with user and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: {
            referredBy: true
          }
        },
        items: true
      }
    });

    if (!order) return;

    // Check if user was referred
    const referral = order.user.referredBy;
    if (!referral) return; // No referrer

    // Idempotency: Ensure we haven't already created a commission for this order
    const existingCommission = await prisma.referralCommission.findUnique({
      where: {
        orderId_referrerId: {
          orderId: order.id,
          referrerId: referral.referrerId
        }
      }
    });

    if (existingCommission) return;

    // Get Referral Settings (hardcoded for now, or fetch from DB if implemented)
    // Default config:
    const commissionRate = 0.10; // 10%
    const holdPeriodDays = 0; // Instant
    
    // Check if globally enabled (we can assume yes if we reached here or add setting)
    // TODO: fetch setting from DB if `ReferralSetting` exists.
    
    // Calculate eligible amount
    // Right now, let's assume all items are eligible. But we apply order level discount proportionally if needed.
    // The easiest way is to apply the discount proportionally, or just use the item.price * quantity.
    
    // Total eligible base amount
    let eligibleAmount = 0;
    
    for (const item of order.items) {
      // In a full implementation, you'd check `item.product.referralEligible`
      eligibleAmount += item.price * item.quantity;
    }

    // Pro-rate the discount
    let finalEligibleAmount = eligibleAmount;
    if (order.discount > 0 && eligibleAmount > 0) {
       // Only proportional discount if subtotal matches eligible amount for simplicity.
       // E.g., if subtotal is 1000, discount is 100, eligible is 1000 -> final eligible = 900
       const ratio = eligibleAmount / order.subtotal;
       finalEligibleAmount = eligibleAmount - (order.discount * ratio);
    }
    
    // Deduct bonus money if used
    const walletTx = await prisma.walletTransaction.findFirst({
      where: {
        referenceId: order.id,
        referenceType: "ORDER",
        type: "PURCHASE"
      }
    });
    
    if (walletTx && walletTx.bonusAmount < 0) {
      const bonusUsed = Math.abs(walletTx.bonusAmount);
      // We assume bonus applies to the eligible amount 
      finalEligibleAmount = Math.max(0, finalEligibleAmount - bonusUsed);
    }

    if (finalEligibleAmount <= 0) return;

    const commissionAmount = finalEligibleAmount * commissionRate;

    // Calculate availableAt (hold period)
    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + holdPeriodDays);

    // Create commission
    const commission = await prisma.referralCommission.create({
      data: {
        referrerId: referral.referrerId,
        referredId: order.userId,
        orderId: order.id,
        amount: commissionAmount,
        rate: commissionRate,
        status: holdPeriodDays === 0 ? "PAID" : "PENDING", // Mark PAID if we instantly credit
        availableAt: availableAt
      }
    });

    // Instantly credit wallet
    if (holdPeriodDays === 0) {
      let referrerWallet = await prisma.wallet.findUnique({
        where: { userId: referral.referrerId }
      });
      if (!referrerWallet) {
        referrerWallet = await prisma.wallet.create({
          data: { userId: referral.referrerId }
        });
      }
      
      await prisma.walletTransaction.create({
        data: {
          walletId: referrerWallet.id,
          cashAmount: commissionAmount,
          type: "BONUS",
          status: "COMPLETED",
          referenceType: "ORDER",
          referenceId: order.id,
          description: `Referral commission for order ${order.id}`
        }
      });
    }

  } catch (err) {
    console.error("Error processing referral commission:", err);
  }
}

export async function reverseReferralCommission(orderId: string) {
  try {
    const commission = await prisma.referralCommission.findFirst({
      where: { orderId }
    });

    if (!commission) return;

    if (commission.status === "PAID") {
      // If already paid, we should ideally create a negative adjustment ledger entry.
      // For now, we'll just mark it REVERSED, but in a real system we'd deduct from their balance.
      await prisma.referralCommission.update({
        where: { id: commission.id },
        data: { status: "REVERSED" }
      });
      // Optionally create a negative adjustment here if required.
    } else {
      await prisma.referralCommission.update({
        where: { id: commission.id },
        data: { status: "CANCELLED" }
      });
    }
  } catch (err) {
    console.error("Error reversing referral commission:", err);
  }
}
