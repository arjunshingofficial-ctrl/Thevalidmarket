import { prisma } from "@/lib/prisma";
import { processReferralCommission } from "@/lib/referrals";

export async function fulfillOrder(orderId: string) {
  // Use a transaction to ensure idempotency and atomic updates
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true,
        entitlements: true
      }
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.paymentStatus !== "PAID") {
      throw new Error(`Order ${orderId} is not paid. Cannot fulfill.`);
    }

    if (order.orderStatus === "FULFILLED") {
      // Idempotency: already fulfilled
      return true;
    }

    for (const item of order.items) {
      // Check if entitlement already exists to prevent duplication
      const existingEntitlement = order.entitlements.find(e => e.orderItemId === item.id);
      if (existingEntitlement) continue;

      let productIdsToProcess = [item.productId];
      const prodMeta = item.product.metadata ? JSON.parse(item.product.metadata as string) : {};
      
      if (prodMeta.isBundle && prodMeta.bundledProductIds) {
        productIdsToProcess = prodMeta.bundledProductIds;
      }

      for (const pId of productIdsToProcess) {
        const targetProduct = pId === item.productId ? item.product : await tx.product.findUnique({ where: { id: pId } });
        if (!targetProduct) continue;

        let entitlementType = "SERVICE";
        let metadata: any = {};
        let startsAt: Date | null = new Date();
        let expiresAt: Date | null = null;

        const productType = targetProduct.type;

        if (productType === "DIGITAL" || productType === "SOFTWARE" || productType === "DIGITAL_DOWNLOAD") {
          entitlementType = "DOWNLOAD";
          
          // Find latest file for this product
          const file = await tx.productFile.findFirst({
            where: { productId: pId, isActive: true, isLatest: true },
            orderBy: { createdAt: "desc" }
          });
          
          if (file) {
            metadata = { fileId: file.id };
          }
        } else if (productType === "COURSE") {
          entitlementType = "COURSE";
          
          const course = await tx.course.findUnique({ where: { productId: pId } });
          if (course) {
            metadata = { courseId: course.id };
            // Enroll user in course progress
            const lessons = await tx.courseLesson.findMany({
              where: { module: { courseId: course.id } }
            });
            
            for (const lesson of lessons) {
              await tx.courseProgress.upsert({
                where: {
                  userId_lessonId: {
                    userId: order.userId,
                    lessonId: lesson.id
                  }
                },
                update: {},
                create: {
                  userId: order.userId,
                  lessonId: lesson.id,
                  completed: false
                }
              });
            }
          }
        } else if (productType === "SUBSCRIPTION") {
          const metadataSettings = targetProduct.metadata ? JSON.parse(targetProduct.metadata as string) : {};
          expiresAt = new Date();
          if (metadataSettings.billingInterval === "YEARLY") {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setDate(expiresAt.getDate() + 30);
          }
        } else if (productType === "VPN" || productType === "PROXY") {
          entitlementType = productType;
          const metadataSettings = targetProduct.metadata ? JSON.parse(targetProduct.metadata as string) : {};
          expiresAt = new Date();
          if (metadataSettings.billingInterval === "YEARLY") {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setDate(expiresAt.getDate() + 30);
          }
        }

        // 1. Create unified Entitlement
        const entitlement = await tx.entitlement.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            orderItemId: item.id, // associate with the original bundle purchase item
            productId: pId,
            type: entitlementType,
            status: "ACTIVE",
            startsAt,
            expiresAt,
            metadata: JSON.stringify(metadata)
          }
        });

        // 2. Legacy/Specific actions based on type
        if (entitlementType === "SUBSCRIPTION") {
          await tx.subscription.create({
            data: {
              userId: order.userId,
              productId: pId,
              orderId: order.id,
              status: "ACTIVE",
              startsAt: startsAt || new Date(),
              expiresAt
            }
          });
        }

        // If product requires a license, assign one
        const isLicenseRequired = targetProduct.type === "SOFTWARE" || targetProduct.type === "VPN" || targetProduct.type === "PROXY"; 
        if (isLicenseRequired) {
          // System modified to ALWAYS use static/generated keys instead of a depletable pool
          const prodMeta = targetProduct.metadata ? JSON.parse(targetProduct.metadata as string) : {};
          let generatedKey;
          
          if (prodMeta.staticLicense) {
            // Append a hidden unique suffix to bypass Prisma @unique constraint for identical static keys
            generatedKey = `${prodMeta.staticLicense}###${order.id}-${pId}`;
          } else {
            const randomString = () => Math.random().toString(36).substring(2, 6).toUpperCase();
            generatedKey = `SOCKS5-${randomString()}-${randomString()}-${randomString()}`;
          }
          
          await tx.licenseKey.create({
            data: {
              productId: pId,
              licenseKey: generatedKey,
              status: "ASSIGNED",
              assignedToId: order.userId,
              orderId: order.id,
              activatedAt: new Date()
            }
          });

          await tx.license.create({
            data: {
              userId: order.userId,
              productId: pId,
              orderId: order.id,
              licenseKey: generatedKey,
              status: "ACTIVE"
            }
          });
        }
      }
    }

    // Update order status
    await tx.order.update({
      where: { id: orderId },
      data: { orderStatus: "FULFILLED" }
    });

    // Create Notification
    await tx.notification.create({
      data: {
        userId: order.userId,
        type: "ORDER",
        title: "Order Fulfilled",
        message: `Your order #${order.id.slice(-6).toUpperCase()} is ready!`,
        actionUrl: `/dashboard/orders/${order.id}`
      }
    });

    return true;
  });
  
  // Process referral commission asynchronously after fulfillment succeeds
  processReferralCommission(orderId).catch(err => console.error("Referral processing error:", err));

  return result;
}
