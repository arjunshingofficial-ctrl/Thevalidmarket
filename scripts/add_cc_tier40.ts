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

const ccTier40Items = [
  { type: "Mastercard", country: "Spain", worth: 1620, price: 40 },
  { type: "Visa", country: "Italy", worth: 1564, price: 40 },
  { type: "Mastercard", country: "Mexico", worth: 1583, price: 40 },
  { type: "Visa", country: "South Korea", worth: 1614, price: 40 },
  { type: "RuPay", country: "India", worth: 1617, price: 40 },
  { type: "Mastercard", country: "Netherlands", worth: 1596, price: 40 },
  { type: "Visa", country: "Saudi Arabia", worth: 1560, price: 40 },
  { type: "Visa", country: "India", worth: 1610, price: 40 },
  { type: "Mastercard", country: "USA", worth: 1619, price: 40 },
  { type: "American Express", country: "USA", worth: 1616, price: 40 },
  { type: "RuPay", country: "India", worth: 1593, price: 40 },
  { type: "JCB", country: "Japan", worth: 1559, price: 40 },
  { type: "UnionPay", country: "China", worth: 1559, price: 40 },
  { type: "Discover", country: "USA", worth: 1619, price: 40 },
  { type: "Visa", country: "United Kingdom", worth: 1574, price: 40 },
  { type: "Mastercard", country: "Canada", worth: 1602, price: 40 },
  { type: "Visa", country: "Australia", worth: 1593, price: 40 },
  { type: "Mastercard", country: "Germany", worth: 1607, price: 40 },
  { type: "Amex", country: "United Kingdom", worth: 1581, price: 40 },
  { type: "Visa", country: "France", worth: 1619, price: 40 },
  { type: "Mastercard", country: "Brazil", worth: 1612, price: 40 },
  { type: "RuPay", country: "India", worth: 1598, price: 40 },
  { type: "JCB", country: "Singapore", worth: 1604, price: 40 },
  { type: "UnionPay", country: "Hong Kong", worth: 1557, price: 40 },
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
  console.log("💳 ADDING 24 $40 TIER CC PRODUCTS");
  console.log("=========================================\n");

  // 1. Locate CC category
  const ccCategory = await prisma.category.findFirst({
    where: { slug: { in: ['cc', 'CC'] } }
  });

  if (!ccCategory) {
    throw new Error("CC category not found in database!");
  }
  console.log(`CC Category: ${ccCategory.name} (${ccCategory.id})`);

  // 2. Field definitions
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

  // 3. Add each card
  let count = 0;
  for (let i = 0; i < ccTier40Items.length; i++) {
    const item = ccTier40Items[i];
    const image = getImageForBrand(item.type);
    const cleanType = item.type.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanCountry = item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = `cc-40-${cleanType}-${cleanCountry}-${item.worth}-${i + 1}`;
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
      console.log(`[${i + 1}/${ccTier40Items.length}] Updated: ${displayName} -> ${image}`);
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
      console.log(`[${i + 1}/${ccTier40Items.length}] Created: ${displayName} -> ${image}`);
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

  console.log(`\n🎉 Successfully published ${count} cards at $40 tier!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
