// @ts-nocheck
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

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

const ccItems = [
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
  console.log("🚀 Aligning website state to 12-11-2026...");

  // 1. Update Category BB -> CC
  console.log("--- 1. Updating Category BB -> CC ---");
  let ccCategory = await prisma.category.findFirst({
    where: { slug: { in: ['bb', 'cc', 'CC'] } }
  });

  if (ccCategory) {
    ccCategory = await prisma.category.update({
      where: { id: ccCategory.id },
      data: {
        name: 'CC',
        slug: 'cc',
        displayMode: 'SPECIAL_BB',
        seoTitle: 'CC',
        seoDescription: 'Browse premium CC products'
      }
    });
    console.log(`✅ Category updated to CC (id: ${ccCategory.id}, slug: ${ccCategory.slug})`);
  }

  // 2. Update Menu Items for CC & News
  console.log("--- 2. Updating Menu Items ---");
  const bbMenuItems = await prisma.menuItem.findMany({
    where: { url: { contains: 'category=bb' } }
  });
  for (const item of bbMenuItems) {
    await prisma.menuItem.update({
      where: { id: item.id },
      data: { url: item.url.replace('category=bb', 'category=cc') }
    });
    console.log(`Updated menu item ${item.label} to /store?category=cc`);
  }

  const headerMenu = await prisma.menu.findUnique({
    where: { location: 'HEADER_MAIN' }
  });
  if (headerMenu) {
    const existingNews = await prisma.menuItem.findFirst({
      where: { menuId: headerMenu.id, url: { in: ['/blog', '/news'] } }
    });
    if (!existingNews) {
      await prisma.menuItem.create({
        data: {
          menuId: headerMenu.id,
          label: 'News',
          url: '/blog',
          sortOrder: 5,
          isVisible: true,
          authVisibility: 'EVERYONE',
          type: 'PAGE'
        }
      });
      console.log('✅ Added News to HEADER_MAIN menu');
    }
  }

  // 3. Update Course to Carding Course with slug 'carding-course'
  console.log("--- 3. Updating Carding Course Product ---");
  const courseProduct = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: 'carding-course' },
        { slug: 'digital-marketing-1' },
        { id: 'cmuu9d053000190ug6tjunhdm' }
      ]
    }
  });

  if (courseProduct) {
    await prisma.product.update({
      where: { id: courseProduct.id },
      data: {
        name: 'Carding Course - Complete Masterclass',
        slug: 'carding-course',
        type: 'COURSE',
        shortDesc: 'Learn Carding & Operational Security from Scratch',
        description: 'Complete hands-on carding, OPSEC, tools, proxies, and setup masterclass curriculum.',
        status: 'PUBLISHED',
        price: 15,
        metadata: JSON.stringify({
          image: '/cyber_security_thumbnail.jpg',
          gallery: [],
          specifications: {
            Duration: '10+ Hours',
            SkillLevel: 'Beginner to Advanced',
            Format: 'Full Video & Guides'
          }
        })
      }
    });
    console.log(`✅ Carding Course product updated with slug: carding-course (id: ${courseProduct.id})`);

    // Ensure Course record exists and has curriculum
    const courseRecord = await prisma.course.findFirst({
      where: { productId: courseProduct.id }
    });
    if (courseRecord) {
      const moduleRecord = await prisma.courseModule.findFirst({
        where: { courseId: courseRecord.id }
      });
      if (moduleRecord) {
        await prisma.courseModule.update({
          where: { id: moduleRecord.id },
          data: {
            title: 'Carding Masterclass Curriculum',
            description: 'Step-by-step video modules and resources'
          }
        });
        const lesson = await prisma.courseLesson.findFirst({
          where: { moduleId: moduleRecord.id }
        });
        if (lesson) {
          await prisma.courseLesson.update({
            where: { id: lesson.id },
            data: {
              title: 'Carding Masterclass & Operational Security Guide',
              content: 'Complete step-by-step curriculum with operational security rules and tool configs.'
            }
          });
        }
      }
    }
  }

  // 4. Seed 19 CC products if not present
  console.log("--- 4. Checking / Seeding CC Products ---");
  if (ccCategory) {
    const countryField = await prisma.fieldDefinition.findFirst({ where: { slug: 'country' } });
    const worthField = await prisma.fieldDefinition.findFirst({ where: { slug: 'worth' } });
    const balanceField = await prisma.fieldDefinition.findFirst({ where: { slug: 'balance' } });

    let ccCount = 0;
    for (const item of ccItems) {
      const key = item.name.toLowerCase().trim();
      const image = cardImages[key] || cardImages['visa'];
      const cleanCountry = item.country.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const baseSlug = `${cleanName}-${cleanCountry}-${item.balance}`;

      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: baseSlug },
            { slug: { startsWith: `${cleanName}-${cleanCountry}` } }
          ]
        }
      });

      if (!existing) {
        const metadata = JSON.stringify({
          image,
          country: item.country,
          worth: String(item.balance),
          balance: String(item.balance),
          gallery: [],
          specifications: {}
        });

        const created = await prisma.product.create({
          data: {
            name: `${item.name} (${item.country})`,
            slug: baseSlug,
            categoryId: ccCategory.id,
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
        ccCount++;
      }
    }
    console.log(`✅ ${ccCount} new CC products seeded (existing cards preserved).`);
  }

  console.log("\n🎉 State alignment complete!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
