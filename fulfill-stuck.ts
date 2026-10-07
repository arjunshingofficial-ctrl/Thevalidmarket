import { fulfillOrder } from "./src/lib/fulfillment/index";
import { prisma } from "./src/lib/prisma";

async function run() {
  const orders = await prisma.order.findMany({ where: { paymentStatus: 'PAID', orderStatus: 'PENDING' } });
  for (const o of orders) {
    await fulfillOrder(o.id);
    console.log("Fulfilled", o.id);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
