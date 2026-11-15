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

const standardCCItems = [
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

function pickBrandForCountry(country, index) {
  const c = (country || '').toLowerCase().trim();
  if (c === 'india') {
    const brands = ['RuPay', 'Visa', 'Mastercard'];
    return brands[index % brands.length];
  }
  if (c === 'japan') {
    const brands = ['JCB', 'Visa', 'Mastercard'];
    return brands[index % brands.length];
  }
  if (c === 'china' || c === 'hong kong' || c === 'taiwan') {
    const brands = ['UnionPay', 'Visa', 'Mastercard'];
    return brands[index % brands.length];
  }
  if (c === 'usa' || c === 'us' || c === 'united states') {
    const brands = ['Visa', 'Mastercard', 'American Express', 'Discover'];
    return brands[index % brands.length];
  }
  // Default international
  const brands = ['Visa', 'Mastercard', 'Visa', 'American Express'];
  return brands[index % brands.length];
}

async function main() {
  console.log("=========================================");
  console.log("🚀 CONVERTING ALL BB PRODUCTS TO CC");
  console.log("=========================================\n");

  // 1. Get or create Field Definitions
  let countryField = await prisma.fieldDefinition.findFirst({ where: { slug: 'country' } });
  if (!countryField) {
    countryField = await prisma.fieldDefinition.create({
      data: { name: 'Country', slug: 'country', type: 'TEXT', isActive: true, sortOrder: 0 }
    });
  }
  let balanceField = await prisma.fieldDefinition.findFirst({ where: { slug: 'balance' } });
  if (!balanceField) {
    balanceField = await prisma.fieldDefinition.create({
      data: { name: 'Balance', slug: 'balance', type: 'TEXT', isActive: true, sortOrder: 0 }
    });
  }
  let worthField = await prisma.fieldDefinition.findFirst({ where: { slug: 'worth' } });
  if (!worthField) {
    worthField = await prisma.fieldDefinition.create({
      data: { name: 'Worth', slug: 'worth', type: 'NUMBER', isActive: true, sortOrder: 0 }
    });
  }

  // 2. Update Category to CC
  let ccCategory = await prisma.category.findFirst({
    where: { slug: { in: ['cc', 'CC', 'bb', 'BB'] } }
  });

  if (!ccCategory) {
    ccCategory = await prisma.category.create({
      data: {
        name: 'CC',
        slug: 'cc',
        displayMode: 'SPECIAL_CC',
        seoTitle: 'CC - The Valid Market',
        seoDescription: 'Browse premium CC products with live balance check.',
        sortOrder: 1,
        isActive: true
      }
    });
    console.log(`✅ Created CC Category (id: ${ccCategory.id})`);
  } else {
    ccCategory = await prisma.category.update({
      where: { id: ccCategory.id },
      data: {
        name: 'CC',
        slug: 'cc',
        displayMode: 'SPECIAL_CC',
        seoTitle: 'CC - The Valid Market',
        seoDescription: 'Browse premium CC products with live balance check.',
        isActive: true
      }
    });
    console.log(`✅ Updated Category to CC (id: ${ccCategory.id}, slug: ${ccCategory.slug})`);
  }

  // 3. Update Menu Items
  const menuItems = await prisma.menuItem.findMany({
    where: {
      OR: [
        { url: { contains: 'bb' } },
        { url: { contains: 'BB' } },
        { label: { in: ['BB', 'CC'] } }
      ]
    }
  });

  for (const item of menuItems) {
    let newUrl = item.url.replace(/category=[bB]{2}/g, 'category=cc').replace(/\/category\/[bB]{2}/g, '/category/cc');
    if (item.label === 'BB') {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { label: 'CC', url: newUrl }
      });
      console.log(`✅ Updated Menu item label BB -> CC with url: ${newUrl}`);
    } else {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { url: newUrl }
      });
      console.log(`✅ Updated Menu item ${item.label} url to: ${newUrl}`);
    }
  }

  // 4. Update the standard CC products to have proper local images and worth
  console.log("\n--- Checking / Updating Standard CC Products ---");
  for (const item of standardCCItems) {
    const key = item.name.toLowerCase().trim();
    const image = cardImages[key] || cardImages['visa'];
    const cleanCountry = item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseSlug = `${cleanName}-${cleanCountry}-${item.balance}`;

    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: baseSlug },
          { name: `${item.name} (${item.country})` }
        ]
      },
      include: { fieldValues: true }
    });

    const metadataObj = {
      image,
      country: item.country,
      worth: String(item.balance),
      balance: String(item.balance),
      gallery: [],
      specifications: {}
    };

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: `${item.name} (${item.country})`,
          categoryId: ccCategory.id,
          price: item.price,
          status: 'PUBLISHED',
          type: 'DIGITAL_DOWNLOAD',
          metadata: JSON.stringify(metadataObj)
        }
      });

      // Ensure fieldValues
      for (const [fld, val] of [[countryField, item.country], [balanceField, String(item.balance)], [worthField, String(item.balance)]]) {
        const hasFv = existing.fieldValues.find(fv => fv.fieldId === fld.id);
        if (hasFv) {
          await prisma.productFieldValue.update({
            where: { id: hasFv.id },
            data: { value: val }
          });
        } else {
          await prisma.productFieldValue.create({
            data: { productId: existing.id, fieldId: fld.id, value: val }
          });
        }
      }
      console.log(`Updated CC Card: ${item.name} (${item.country}) - $${item.balance}`);
    } else {
      await prisma.product.create({
        data: {
          name: `${item.name} (${item.country})`,
          slug: baseSlug,
          categoryId: ccCategory.id,
          price: item.price,
          status: 'PUBLISHED',
          type: 'DIGITAL_DOWNLOAD',
          metadata: JSON.stringify(metadataObj),
          fieldValues: {
            create: [
              { fieldId: countryField.id, value: item.country },
              { fieldId: balanceField.id, value: String(item.balance) },
              { fieldId: worthField.id, value: String(item.balance) }
            ]
          }
        }
      });
      console.log(`Created CC Card: ${item.name} (${item.country}) - $${item.balance}`);
    }
  }

  // 5. Convert all "Dark Market BB" products into proper CC products
  console.log("\n--- Converting Dark Market BB Products to CC ---");
  const bbProducts = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: 'BB' } },
        { slug: { contains: 'bb' } }
      ]
    },
    include: {
      fieldValues: {
        include: { field: true }
      }
    }
  });

  console.log(`Found ${bbProducts.length} BB products to convert.`);

  let index = 0;
  for (const prod of bbProducts) {
    index++;
    // Extract Country and Balance
    let country = prod.fieldValues.find(fv => fv.field.slug === 'country')?.value || 'USA';
    let balance = prod.fieldValues.find(fv => fv.field.slug === 'balance' || fv.field.slug === 'worth')?.value || '1000';
    // Clean up
    country = country.trim();
    balance = balance.replace(/[^0-9]/g, '') || '1000';

    const brand = pickBrandForCountry(country, index);
    const brandKey = brand.toLowerCase();
    const image = cardImages[brandKey] || cardImages['visa'];

    const cleanCountry = country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSlug = `cc-${cleanBrand}-${cleanCountry}-${balance}-${prod.id.slice(-5)}`;
    const newName = `${brand} (${country}) - $${Number(balance).toLocaleString('en-US')}`;

    const metadataObj = {
      image,
      country,
      worth: String(balance),
      balance: String(balance),
      gallery: [],
      specifications: {}
    };

    await prisma.product.update({
      where: { id: prod.id },
      data: {
        name: newName,
        slug: newSlug,
        categoryId: ccCategory.id,
        status: 'PUBLISHED',
        type: 'DIGITAL_DOWNLOAD',
        price: prod.price > 0 ? prod.price : 10,
        metadata: JSON.stringify(metadataObj)
      }
    });

    // Update / create field values
    for (const [fld, val] of [[countryField, country], [balanceField, String(balance)], [worthField, String(balance)]]) {
      const existingFv = prod.fieldValues.find(fv => fv.fieldId === fld.id);
      if (existingFv) {
        await prisma.productFieldValue.update({
          where: { id: existingFv.id },
          data: { value: val }
        });
      } else {
        await prisma.productFieldValue.create({
          data: { productId: prod.id, fieldId: fld.id, value: val }
        });
      }
    }

    console.log(`[${index}/${bbProducts.length}] Converted ${prod.name} -> ${newName} (${image})`);
  }

  console.log("\n🎉 ALL BB PRODUCTS SUCCESSFULLY CONVERTED TO CC!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
