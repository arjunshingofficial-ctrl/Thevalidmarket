require('dotenv').config(); 
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function fulfillOrder(orderId) { 
  const order = await prisma.order.findUnique({ 
    where: { id: orderId }, 
    include: { items: { include: { product: true } }, entitlements: true } 
  }); 
  
  if (!order || order.paymentStatus !== 'PAID') return; 
  
  for (const item of order.items) { 
    const targetProduct = item.product; 
    if (targetProduct.type === 'SOFTWARE') { 
      const file = await prisma.productFile.findFirst({ 
        where: { productId: targetProduct.id, isActive: true, isLatest: true } 
      }); 
      
      if (file) {
        await prisma.entitlement.create({ 
          data: { userId: order.userId, productId: targetProduct.id, orderId: order.id, orderItemId: item.id, type: 'DOWNLOAD', status: 'ACTIVE', metadata: JSON.stringify({ fileId: file.id }) } 
        }); 
      }
      
      // Also assign static license
      const meta = targetProduct.metadata ? JSON.parse(targetProduct.metadata) : {};
      if (meta.staticLicense) {
        await prisma.licenseKey.create({
          data: {
            productId: targetProduct.id,
            licenseKey: `${meta.staticLicense}###${order.id}`,
            status: "ACTIVE",
            assignedToId: order.userId,
            orderId: order.id
          }
        });
      }
    } 
  } 
  
  await prisma.order.update({ 
    where: { id: orderId }, 
    data: { orderStatus: 'FULFILLED' } 
  }); 
} 

async function run() { 
  const orders = await prisma.order.findMany({ 
    where: { paymentStatus: 'PAID', orderStatus: 'PENDING' } 
  }); 
  
  for (const o of orders) { 
    await fulfillOrder(o.id); 
    console.log('Fixed stuck order ' + o.id); 
  } 
} 

run().catch(console.error).finally(() => prisma.$disconnect());
