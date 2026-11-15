import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("=========================================");
  console.log("🗑️ PURGING ALL PRODUCTS");
  console.log("=========================================\n");

  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      _count: {
        select: { orderItems: true }
      }
    }
  });

  const idsToDelete = allProducts.filter(p => p._count.orderItems === 0).map(p => p.id);
  const idsToArchive = allProducts.filter(p => p._count.orderItems > 0).map(p => p.id);

  console.log(`Found ${allProducts.length} total products in database.`);
  console.log(`- ${idsToDelete.length} products have NO orders -> Permanently hard-deleting.`);
  console.log(`- ${idsToArchive.length} products have connected orders -> Archiving (hiding from storefront).\n`);

  if (idsToDelete.length > 0) {
    console.log("Cleaning up product relations before hard delete...");

    const fv = await prisma.productFieldValue.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${fv.count} product field values.`);

    const vr = await prisma.productVariant.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${vr.count} product variants.`);

    const pf = await prisma.productFile.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${pf.count} product files.`);

    const rv = await prisma.review.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${rv.count} product reviews.`);

    const lk = await prisma.licenseKey.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${lk.count} license keys.`);

    const lc = await prisma.license.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${lc.count} licenses.`);

    const sub = await prisma.subscription.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${sub.count} subscriptions.`);

    const ent = await prisma.entitlement.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${ent.count} entitlements.`);

    const cr = await prisma.course.deleteMany({ where: { productId: { in: idsToDelete } } });
    console.log(` - Deleted ${cr.count} course records.`);

    const deleted = await prisma.product.deleteMany({
      where: { id: { in: idsToDelete } }
    });
    console.log(`\n✅ Permanently hard-deleted ${deleted.count} products from the database!`);
  }

  if (idsToArchive.length > 0) {
    const archived = await prisma.product.updateMany({
      where: { id: { in: idsToArchive } },
      data: { status: "ARCHIVED" }
    });
    console.log(`✅ Archived ${archived.count} products with order history so storefront is 100% clean.`);
  }

  // Verification
  const remainingTotal = await prisma.product.count();
  const remainingPublished = await prisma.product.count({ where: { status: "PUBLISHED" } });

  console.log("\n=========================================");
  console.log(`Total Products remaining in DB: ${remainingTotal}`);
  console.log(`Total Published Products visible on storefront: ${remainingPublished}`);
  console.log("=========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
