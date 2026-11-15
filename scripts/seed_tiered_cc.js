require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cardImages = {
  visa: '/images/cards/visa.png',
  mastercard: '/images/cards/mastercard.png',
  'american express': '/images/cards/amex.png',
  amex: '/images/cards/amex.png',
  discover: '/images/cards/discover.svg',
  jcb: '/images/cards/jcb.svg',
  unionpay: '/images/cards/unionpay.svg',
  rupay: '/images/cards/rupay.svg',
};

// 32 Premium Tiered CC Products at $20, $30, $40, $60
const tieredCCProducts = [
  // ─── $20 Tier (Standard Balance ~$800 - $1,800) ───────────────────────────
  { name: "Visa Classic", country: "USA", balance: 1250, price: 20, brand: "visa" },
  { name: "Mastercard Standard", country: "United Kingdom", balance: 1180, price: 20, brand: "mastercard" },
  { name: "American Express Green", country: "USA", balance: 1450, price: 20, brand: "amex" },
  { name: "Visa Classic", country: "Canada", balance: 1120, price: 20, brand: "visa" },
  { name: "Mastercard Standard", country: "Germany", balance: 1340, price: 20, brand: "mastercard" },
  { name: "RuPay Platinum", country: "India", balance: 1500, price: 20, brand: "rupay" },
  { name: "JCB Standard", country: "Japan", balance: 1200, price: 20, brand: "jcb" },
  { name: "Visa Classic", country: "Australia", balance: 1380, price: 20, brand: "visa" },

  // ─── $30 Tier (Gold / Premium Balance ~$2,000 - $3,800) ───────────────────
  { name: "Visa Gold", country: "USA", balance: 2850, price: 30, brand: "visa" },
  { name: "Mastercard Gold", country: "United Kingdom", balance: 2640, price: 30, brand: "mastercard" },
  { name: "American Express Gold", country: "USA", balance: 3200, price: 30, brand: "amex" },
  { name: "Visa Gold", country: "France", balance: 2450, price: 30, brand: "visa" },
  { name: "Mastercard Gold", country: "Australia", balance: 2980, price: 30, brand: "mastercard" },
  { name: "Discover It Chrome", country: "USA", balance: 2500, price: 30, brand: "discover" },
  { name: "UnionPay Gold", country: "China", balance: 3100, price: 30, brand: "unionpay" },
  { name: "Visa Gold", country: "Spain", balance: 2720, price: 30, brand: "visa" },

  // ─── $40 Tier (Platinum / High Balance ~$4,000 - $6,500) ──────────────────
  { name: "Visa Platinum", country: "USA", balance: 5200, price: 40, brand: "visa" },
  { name: "Mastercard Platinum", country: "United Kingdom", balance: 4850, price: 40, brand: "mastercard" },
  { name: "American Express Platinum", country: "USA", balance: 5800, price: 40, brand: "amex" },
  { name: "Visa Platinum", country: "Canada", balance: 4650, price: 40, brand: "visa" },
  { name: "Mastercard Platinum", country: "Germany", balance: 5100, price: 40, brand: "mastercard" },
  { name: "JCB Gold", country: "Japan", balance: 4900, price: 40, brand: "jcb" },
  { name: "Visa Platinum", country: "UAE", balance: 5400, price: 40, brand: "visa" },
  { name: "Mastercard Platinum", country: "Brazil", balance: 4350, price: 40, brand: "mastercard" },

  // ─── $60 Tier (Ultra / Infinite / Business ~$7,000 - $14,000+) ────────────
  { name: "Visa Infinite", country: "USA", balance: 9800, price: 60, brand: "visa" },
  { name: "Mastercard World Elite", country: "United Kingdom", balance: 8950, price: 60, brand: "mastercard" },
  { name: "American Express Centurion", country: "USA", balance: 12500, price: 60, brand: "amex" },
  { name: "Visa Infinite", country: "Australia", balance: 9200, price: 60, brand: "visa" },
  { name: "Mastercard World Elite", country: "Germany", balance: 8600, price: 60, brand: "mastercard" },
  { name: "Visa Business Signature", country: "USA", balance: 11400, price: 60, brand: "visa" },
  { name: "UnionPay Diamond", country: "Hong Kong", balance: 10200, price: 60, brand: "unionpay" },
  { name: "JCB Platinum", country: "Singapore", balance: 8400, price: 60, brand: "jcb" },
];

async function main() {
  console.log("=========================================");
  console.log("🚀 UPDATING CC PRODUCTS: $20, $30, $40, $60 TIERS");
  console.log("=========================================\n");

  // 1. Locate CC Category
  const ccCategory = await prisma.category.findFirst({
    where: { slug: { in: ['cc', 'CC'] } }
  });

  if (!ccCategory) {
    throw new Error("CC Category not found!");
  }
  console.log(`Found CC category: ${ccCategory.name} (${ccCategory.id})`);

  // 2. Field definitions
  let countryField = await prisma.fieldDefinition.findFirst({ where: { slug: 'country' } });
  let balanceField = await prisma.fieldDefinition.findFirst({ where: { slug: 'balance' } });
  let worthField = await prisma.fieldDefinition.findFirst({ where: { slug: 'worth' } });

  // 3. Archive old CC products so only the new $20, $30, $40, $60 cards show on storefront
  console.log("--- Archiving old CC products from storefront ---");
  const oldCCProducts = await prisma.product.findMany({
    where: {
      categoryId: ccCategory.id,
      status: "PUBLISHED"
    },
    select: { id: true, name: true, price: true }
  });

  console.log(`Found ${oldCCProducts.length} published products currently in CC category.`);
  
  const archivedCount = await prisma.product.updateMany({
    where: {
      categoryId: ccCategory.id,
      status: "PUBLISHED"
    },
    data: {
      status: "ARCHIVED"
    }
  });
  console.log(`✅ Archived ${archivedCount.count} old CC products from storefront.\n`);

  // 4. Create / publish the 32 tiered CC products ($20, $30, $40, $60)
  console.log("--- Adding new $20, $30, $40, $60 CC products ---");
  let createdCount = 0;
  for (const item of tieredCCProducts) {
    const image = cardImages[item.brand] || cardImages.visa;
    const cleanCountry = item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseSlug = `cc-${cleanName}-${cleanCountry}-${item.balance}-${item.price}`;
    const displayName = `${item.name} (${item.country}) - $${item.balance.toLocaleString('en-US')}`;

    const metadataObj = {
      image,
      country: item.country,
      worth: String(item.balance),
      balance: String(item.balance),
      gallery: [],
      specifications: {
        "Card Type": item.name,
        "Country": item.country,
        "Available Balance": `$${item.balance.toLocaleString('en-US')}`,
        "Validity": "Live / Active",
        "Delivery": "Instant Auto-Delivery"
      }
    };

    // Check if slug already exists
    let existing = await prisma.product.findUnique({
      where: { slug: baseSlug }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: displayName,
          categoryId: ccCategory.id,
          price: item.price,
          salePrice: null,
          stock: 5,
          status: "PUBLISHED",
          type: "DIGITAL_DOWNLOAD",
          metadata: JSON.stringify(metadataObj)
        }
      });

      if (countryField) {
        await prisma.productFieldValue.upsert({
          where: { productId_fieldId: { productId: existing.id, fieldId: countryField.id } },
          update: { value: item.country },
          create: { productId: existing.id, fieldId: countryField.id, value: item.country }
        });
      }
      if (balanceField) {
        await prisma.productFieldValue.upsert({
          where: { productId_fieldId: { productId: existing.id, fieldId: balanceField.id } },
          update: { value: String(item.balance) },
          create: { productId: existing.id, fieldId: balanceField.id, value: String(item.balance) }
        });
      }
      if (worthField) {
        await prisma.productFieldValue.upsert({
          where: { productId_fieldId: { productId: existing.id, fieldId: worthField.id } },
          update: { value: String(item.balance) },
          create: { productId: existing.id, fieldId: worthField.id, value: String(item.balance) }
        });
      }

      console.log(`[Tier $${item.price}] Updated: ${displayName}`);
    } else {
      existing = await prisma.product.create({
        data: {
          name: displayName,
          slug: baseSlug,
          categoryId: ccCategory.id,
          price: item.price,
          salePrice: null,
          stock: 5,
          status: "PUBLISHED",
          type: "DIGITAL_DOWNLOAD",
          metadata: JSON.stringify(metadataObj),
          fieldValues: {
            create: [
              ...(countryField ? [{ fieldId: countryField.id, value: item.country }] : []),
              ...(balanceField ? [{ fieldId: balanceField.id, value: String(item.balance) }] : []),
              ...(worthField ? [{ fieldId: worthField.id, value: String(item.balance) }] : [])
            ]
          }
        }
      });
      console.log(`[Tier $${item.price}] Created: ${displayName}`);
    }
    createdCount++;
  }

  console.log(`\n🎉 Successfully published ${createdCount} CC products across $20, $30, $40, and $60 tiers!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
