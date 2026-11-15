import { PrismaClient } from '@prisma/client';

const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl
    }
  }
});

const cardImages: Record<string, string> = {
  visa: '/images/cards/visa.png',
  mastercard: '/images/cards/mastercard.png',
  'american express': '/images/cards/amex.png',
  amex: '/images/cards/amex.png',
  discover: '/images/cards/discover.svg',
  jcb: '/images/cards/jcb.svg',
  unionpay: '/images/cards/unionpay.svg',
  rupay: '/images/cards/rupay.svg',
};

const ccItems = [
  { type: "Visa", country: "India", worth: 785, price: 20 },
  { type: "Mastercard", country: "USA", worth: 761, price: 20 },
  { type: "American Express", country: "USA", worth: 779, price: 20 },
  { type: "RuPay", country: "India", worth: 778, price: 20 },
  { type: "JCB", country: "Japan", worth: 793, price: 20 },
  { type: "UnionPay", country: "China", worth: 761, price: 20 },
  { type: "Discover", country: "USA", worth: 755, price: 20 },
  { type: "Visa", country: "United Kingdom", worth: 787, price: 20 },
  { type: "Mastercard", country: "Canada", worth: 787, price: 20 },
  { type: "Visa", country: "Australia", worth: 808, price: 20 },
  { type: "Mastercard", country: "Germany", worth: 784, price: 20 },
  { type: "Amex", country: "United Kingdom", worth: 809, price: 20 },
  { type: "Visa", country: "France", worth: 779, price: 20 },
  { type: "Mastercard", country: "Brazil", worth: 777, price: 20 },
  { type: "RuPay", country: "India", worth: 768, price: 20 },
  { type: "JCB", country: "Singapore", worth: 804, price: 20 },
  { type: "UnionPay", country: "Hong Kong", worth: 813, price: 20 },
  { type: "Visa", country: "UAE", worth: 804, price: 20 },
];

function getImageForBrand(type: string): string {
  const t = type.toLowerCase().trim();
  if (t.includes('visa')) return cardImages.visa;
  if (t.includes('mastercard')) return cardImages.mastercard;
  if (t.includes('american express') || t.includes('amex')) return cardImages.amex;
  if (t.includes('rupay')) return cardImages.rupay;
  if (t.includes('jcb')) return cardImages.jcb;
  if (t.includes('unionpay')) return cardImages.unionpay;
  if (t.includes('discover')) return cardImages.discover;
  return cardImages.visa;
}

async function main() {
  console.log("=========================================");
  console.log("💳 ADDING 18 CC PRODUCTS");
  console.log("=========================================\n");

  // 1. Find CC category
  const ccCategory = await prisma.category.findFirst({
    where: { slug: { in: ['cc', 'CC'] } }
  });

  if (!ccCategory) {
    throw new Error("CC category not found in database!");
  }
  console.log(`CC Category: ${ccCategory.name} (${ccCategory.id})`);

  // 2. Find or create field definitions
  let countryField = await prisma.fieldDefinition.findFirst({ where: { slug: 'country' } });
  if (!countryField) {
    countryField = await prisma.fieldDefinition.create({
      data: { name: 'Country', slug: 'country', type: 'TEXT', isActive: true }
    });
  }

  let balanceField = await prisma.fieldDefinition.findFirst({ where: { slug: 'balance' } });
  if (!balanceField) {
    balanceField = await prisma.fieldDefinition.create({
      data: { name: 'Balance', slug: 'balance', type: 'NUMBER', isActive: true }
    });
  }

  let worthField = await prisma.fieldDefinition.findFirst({ where: { slug: 'worth' } });
  if (!worthField) {
    worthField = await prisma.fieldDefinition.create({
      data: { name: 'Worth', slug: 'worth', type: 'NUMBER', isActive: true }
    });
  }

  // 3. Insert each card
  let count = 0;
  for (let i = 0; i < ccItems.length; i++) {
    const item = ccItems[i];
    const image = getImageForBrand(item.type);
    const cleanType = item.type.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanCountry = item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `cc-${cleanType}-${cleanCountry}-${item.worth}-${i + 1}`;
    const displayName = `${item.type} (${item.country}) - $${Number(item.worth).toLocaleString('en-US')}`;

    const metadataObj = {
      image,
      country: item.country,
      worth: String(item.worth),
      balance: String(item.worth),
      gallery: [],
      specifications: {
        "Card Type": item.type,
        "Country": item.country,
        "Available Balance": `$${Number(item.worth).toLocaleString('en-US')}`,
        "Validity": "Live / Active",
        "Delivery": "Instant Auto-Delivery"
      }
    };

    const existing = await prisma.product.findUnique({ where: { slug } });

    let product;
    if (existing) {
      product = await prisma.product.update({
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
      console.log(`[${i + 1}/${ccItems.length}] Updated: ${displayName} -> ${image}`);
    } else {
      product = await prisma.product.create({
        data: {
          name: displayName,
          slug,
          categoryId: ccCategory.id,
          price: item.price,
          salePrice: null,
          stock: 5,
          status: "PUBLISHED",
          type: "DIGITAL_DOWNLOAD",
          metadata: JSON.stringify(metadataObj),
          fieldValues: {
            create: [
              { fieldId: countryField.id, value: item.country },
              { fieldId: balanceField.id, value: String(item.worth) },
              { fieldId: worthField.id, value: String(item.worth) }
            ]
          }
        }
      });
      console.log(`[${i + 1}/${ccItems.length}] Created: ${displayName} -> ${image}`);
    }

    // Ensure field values exist/updated
    await prisma.productFieldValue.upsert({
      where: { productId_fieldId: { productId: product.id, fieldId: countryField.id } },
      update: { value: item.country },
      create: { productId: product.id, fieldId: countryField.id, value: item.country }
    });
    await prisma.productFieldValue.upsert({
      where: { productId_fieldId: { productId: product.id, fieldId: balanceField.id } },
      update: { value: String(item.worth) },
      create: { productId: product.id, fieldId: balanceField.id, value: String(item.worth) }
    });
    await prisma.productFieldValue.upsert({
      where: { productId_fieldId: { productId: product.id, fieldId: worthField.id } },
      update: { value: String(item.worth) },
      create: { productId: product.id, fieldId: worthField.id, value: String(item.worth) }
    });

    count++;
  }

  console.log(`\n🎉 Successfully published ${count} CC cards in the store!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
