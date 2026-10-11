const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cardImages = {
  visa: 'https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/object/public/asia-d-market/public/uploads/Visa-CC-bcc856a9.png',
  mastercard: 'https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/object/public/asia-d-market/public/uploads/mastercard-PNG23-be12c0bc.png',
  'american express': 'https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/object/public/asia-d-market/public/uploads/American-Express-Logo-Badge-3858ad91.png',
  amex: 'https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/object/public/asia-d-market/public/uploads/American-Express-Logo-Badge-3858ad91.png',
  discover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Discover_Card_logo.svg/512px-Discover_Card_logo.svg.png',
  jcb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/JCB_logo.svg/512px-JCB_logo.svg.png',
  unionpay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/UnionPay_logo.svg/512px-UnionPay_logo.svg.png',
  rupay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/RuPay.svg/512px-RuPay.svg.png',
};

const items = [
  { name: "Visa", country: "India", balance: 164, price: 5 },
  { name: "Mastercard", country: "USA", balance: 163, price: 5 },
  { name: "American Express", country: "USA", balance: 161, price: 5 },
  { name: "RuPay", country: "India", balance: 219, price: 5 },
  { name: "JCB", country: "Japan", balance: 170, price: 5 },
  { name: "UnionPay", country: "China", balance: 193, price: 5 },
  { name: "Discover", country: "USA", balance: 194, price: 5 },
  { name: "Visa", country: "United Kingdom", balance: 160, price: 5 },
  { name: "Mastercard", country: "Canada", balance: 155, price: 5 },
  { name: "Visa", country: "Australia", balance: 198, price: 5 },
  { name: "Mastercard", country: "Germany", balance: 195, price: 5 },
  { name: "Amex", country: "United Kingdom", balance: 181, price: 5 },
  { name: "Visa", country: "France", balance: 191, price: 5 },
  { name: "Mastercard", country: "Brazil", balance: 184, price: 5 },
  { name: "RuPay", country: "India", balance: 200, price: 5 },
  { name: "JCB", country: "Singapore", balance: 218, price: 5 },
  { name: "UnionPay", country: "Hong Kong", balance: 167, price: 5 },
  { name: "Visa", country: "UAE", balance: 169, price: 5 },
  { name: "Mastercard", country: "Spain", balance: 209, price: 5 },
];

async function main() {
  const category = await prisma.category.findFirst({
    where: { slug: { in: ['cc', 'CC'] } }
  });

  if (!category) {
    console.error("CC Category not found!");
    return;
  }

  const countryField = await prisma.fieldDefinition.findFirst({ where: { slug: 'country' } });
  const worthField = await prisma.fieldDefinition.findFirst({ where: { slug: 'worth' } });
  const balanceField = await prisma.fieldDefinition.findFirst({ where: { slug: 'balance' } });

  console.log(`Using Category: ${category.name} (${category.id})`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = item.name.toLowerCase().trim();
    const image = cardImages[key] || cardImages['visa'];
    
    // Generate clean slug
    const cleanCountry = item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseSlug = `${cleanName}-${cleanCountry}-${item.balance}`;
    
    // Check if product exists by slug or create
    let slug = baseSlug;
    let existing = await prisma.product.findUnique({ where: { slug } });
    let counter = 1;
    while (existing) {
      slug = `${baseSlug}-${counter}`;
      existing = await prisma.product.findUnique({ where: { slug } });
      counter++;
    }

    const metadata = JSON.stringify({
      image,
      country: item.country,
      worth: String(item.balance),
      balance: String(item.balance),
      gallery: [],
      specifications: {}
    });

    const product = await prisma.product.create({
      data: {
        name: item.name,
        slug,
        categoryId: category.id,
        price: item.price,
        salePrice: null,
        stock: 5,
        status: "PUBLISHED",
        type: "DIGITAL_DOWNLOAD",
        metadata,
        fieldValues: {
          create: [
            ...(countryField ? [{ fieldId: countryField.id, value: item.country }] : []),
            ...(worthField ? [{ fieldId: worthField.id, value: String(item.balance) }] : []),
            ...(balanceField ? [{ fieldId: balanceField.id, value: String(item.balance) }] : [])
          ]
        }
      }
    });

    console.log(`[${i + 1}/${items.length}] Created: ${item.name} | ${item.country} | $${item.balance} | $${item.price} (id: ${product.id}, slug: ${product.slug})`);
  }

  console.log("All 19 CC products created successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
