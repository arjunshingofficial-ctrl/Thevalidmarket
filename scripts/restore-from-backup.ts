// @ts-nocheck
import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./prisma/dev.db.bak');

function toDate(val: any): Date | null {
  if (!val) return null;
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') {
    const num = Number(val);
    if (!isNaN(num) && num > 1000000000) return new Date(num);
    return new Date(val);
  }
  return null;
}

function toBool(val: any): boolean {
  return val === 1 || val === true || val === '1';
}

async function restore() {
  console.log('🚀 Starting restoration of The Valid Market database...');

  // 1. Restore SiteSettings
  console.log('--- Step 1: Restoring SiteSettings ---');
  const sqliteSettings: any = db.prepare('SELECT * FROM SiteSettings LIMIT 1').get();
  if (sqliteSettings) {
    const footerConfigObj = {
      telegramUrl: 'https://t.me/+xpN22t7nSkk4ZWJl',
      telegramActive: true,
      whatsappUrl: '+916389458286',
      whatsappActive: true,
      supportEmail: 'support@thevalidmarket.com',
      copyrightText: '© 2026 The Valid Market. All rights reserved.'
    };

    await prisma.siteSettings.upsert({
      where: { id: 'GLOBAL' },
      update: {
        siteName: 'The Valid Market',
        siteDescription: 'The Valid Market: Hacking Course + Proxies + CC + Money making Software, All About Carding',
        tagline: 'Hacking Course + Tools + CC',
        homepageConfig: sqliteSettings.homepageConfig,
        draftConfig: sqliteSettings.draftConfig,
        chatConfig: sqliteSettings.chatConfig || '{"moderationMode":true}',
        footerConfig: JSON.stringify(footerConfigObj),
        maintenanceMode: false
      },
      create: {
        id: 'GLOBAL',
        siteName: 'The Valid Market',
        siteDescription: 'The Valid Market: Hacking Course + Proxies + CC + Money making Software, All About Carding',
        tagline: 'Hacking Course + Tools + CC',
        homepageConfig: sqliteSettings.homepageConfig,
        draftConfig: sqliteSettings.draftConfig,
        chatConfig: sqliteSettings.chatConfig || '{"moderationMode":true}',
        footerConfig: JSON.stringify(footerConfigObj),
        maintenanceMode: false
      }
    });
    console.log('✅ SiteSettings restored to The Valid Market.');
  }

  // 2. Restore Users (Missing users needed for reviews and orders)
  console.log('--- Step 2: Restoring Users ---');
  const sqliteUsers: any[] = db.prepare('SELECT * FROM User').all() as any[];
  console.log(`Found ${sqliteUsers.length} users in backup.`);
  let userCount = 0;
  for (const u of sqliteUsers) {
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { id: u.id },
            { email: u.email }
          ]
        }
      });

      if (!existing) {
        await prisma.user.create({
          data: {
            id: u.id,
            accountId: u.accountId || null,
            name: u.name || null,
            username: u.username || null,
            email: u.email,
            emailVerified: toDate(u.emailVerified),
            phone: u.phone || null,
            password: u.password || null,
            image: u.image || null,
            roleId: u.roleId || null,
            createdAt: toDate(u.createdAt) || new Date(),
            updatedAt: toDate(u.updatedAt) || new Date(),
          }
        });
        userCount++;
      }
    } catch (e: any) {
      console.warn(`User skip/error ${u.email}:`, e.message);
    }
  }
  console.log(`✅ ${userCount} missing users inserted.`);

  // 3. Clear generic Digilancer categories and restore the 8 original categories
  console.log('--- Step 3: Restoring Categories ---');
  const sqliteCategories: any[] = db.prepare('SELECT * FROM Category').all() as any[];
  const validCategoryIds = new Set(sqliteCategories.map(c => c.id));

  const currentCategories = await prisma.category.findMany({ select: { id: true } });
  for (const c of currentCategories) {
    if (!validCategoryIds.has(c.id)) {
      try {
        await prisma.category.delete({ where: { id: c.id } });
      } catch (e: any) {
        console.warn(`Could not delete orphan category ${c.id}:`, e.message);
      }
    }
  }

  for (const cat of sqliteCategories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        parentId: cat.parentId || null,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        image: cat.image || null,
        icon: cat.icon || null,
        seoTitle: cat.seoTitle || null,
        seoDescription: cat.seoDescription || null,
        sortOrder: cat.sortOrder ?? 0,
        isActive: toBool(cat.isActive),
        displayMode: cat.displayMode || 'GRID',
        productsPerPage: cat.productsPerPage ?? 20,
        tableColumns: cat.tableColumns || null
      },
      create: {
        id: cat.id,
        parentId: cat.parentId || null,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || null,
        image: cat.image || null,
        icon: cat.icon || null,
        seoTitle: cat.seoTitle || null,
        seoDescription: cat.seoDescription || null,
        sortOrder: cat.sortOrder ?? 0,
        isActive: toBool(cat.isActive),
        displayMode: cat.displayMode || 'GRID',
        productsPerPage: cat.productsPerPage ?? 20,
        tableColumns: cat.tableColumns || null
      }
    });
  }
  console.log(`✅ ${sqliteCategories.length} categories restored.`);

  // 4. Restore FieldDefinition
  console.log('--- Step 4: Restoring FieldDefinitions ---');
  const sqliteFields: any[] = db.prepare('SELECT * FROM FieldDefinition').all() as any[];
  for (const f of sqliteFields) {
    await prisma.fieldDefinition.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        slug: f.slug,
        type: f.type,
        required: toBool(f.required),
        defaultValue: f.defaultValue || null,
        options: f.options || null,
        isActive: toBool(f.isActive),
        sortOrder: f.sortOrder ?? 0,
        applyToTypes: f.applyToTypes || null
      },
      create: {
        id: f.id,
        name: f.name,
        slug: f.slug,
        type: f.type,
        required: toBool(f.required),
        defaultValue: f.defaultValue || null,
        options: f.options || null,
        isActive: toBool(f.isActive),
        sortOrder: f.sortOrder ?? 0,
        applyToTypes: f.applyToTypes || null
      }
    });
  }
  console.log(`✅ ${sqliteFields.length} field definitions restored.`);

  // 5. Restore Products
  console.log('--- Step 5: Restoring Products ---');
  const sqliteProducts: any[] = db.prepare('SELECT * FROM Product').all() as any[];
  for (const p of sqliteProducts) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        sku: p.sku || null,
        type: p.type,
        shortDesc: p.shortDesc || null,
        description: p.description || null,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock ?? -1,
        status: p.status,
        sortOrder: p.sortOrder ?? 0,
        metadata: p.metadata || null,
        createdAt: toDate(p.createdAt) || new Date(),
        updatedAt: toDate(p.updatedAt) || new Date(),
      },
      create: {
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        sku: p.sku || null,
        type: p.type,
        shortDesc: p.shortDesc || null,
        description: p.description || null,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock ?? -1,
        status: p.status,
        sortOrder: p.sortOrder ?? 0,
        metadata: p.metadata || null,
        createdAt: toDate(p.createdAt) || new Date(),
        updatedAt: toDate(p.updatedAt) || new Date(),
      }
    });
  }
  console.log(`✅ ${sqliteProducts.length} products restored.`);

  // 6. Restore ProductFieldValue
  console.log('--- Step 6: Restoring ProductFieldValues ---');
  const sqlitePFV: any[] = db.prepare('SELECT * FROM ProductFieldValue').all() as any[];
  for (const pfv of sqlitePFV) {
    await prisma.productFieldValue.upsert({
      where: { id: pfv.id },
      update: {
        productId: pfv.productId,
        fieldId: pfv.fieldId,
        value: pfv.value
      },
      create: {
        id: pfv.id,
        productId: pfv.productId,
        fieldId: pfv.fieldId,
        value: pfv.value
      }
    });
  }
  console.log(`✅ ${sqlitePFV.length} product field values restored.`);

  // 7. Restore ProductFile
  console.log('--- Step 7: Restoring ProductFiles ---');
  const sqliteFiles: any[] = db.prepare('SELECT * FROM ProductFile').all() as any[];
  for (const pf of sqliteFiles) {
    await prisma.productFile.upsert({
      where: { id: pf.id },
      update: {
        productId: pf.productId,
        filename: pf.filename,
        originalName: pf.originalName,
        fileSize: pf.fileSize,
        mimeType: pf.mimeType,
        storageKey: pf.storageKey,
        version: pf.version,
        hash: pf.hash,
        isLatest: toBool(pf.isLatest),
        isActive: toBool(pf.isActive),
        createdAt: toDate(pf.createdAt) || new Date(),
        updatedAt: toDate(pf.updatedAt) || new Date(),
      },
      create: {
        id: pf.id,
        productId: pf.productId,
        filename: pf.filename,
        originalName: pf.originalName,
        fileSize: pf.fileSize,
        mimeType: pf.mimeType,
        storageKey: pf.storageKey,
        version: pf.version,
        hash: pf.hash,
        isLatest: toBool(pf.isLatest),
        isActive: toBool(pf.isActive),
        createdAt: toDate(pf.createdAt) || new Date(),
        updatedAt: toDate(pf.updatedAt) || new Date(),
      }
    });
  }
  console.log(`✅ ${sqliteFiles.length} product files restored.`);

  // 8. Restore Courses, Modules, Lessons, Progress
  console.log('--- Step 8: Restoring Courses & Curriculum ---');
  const sqliteCourses: any[] = db.prepare('SELECT * FROM Course').all() as any[];
  for (const c of sqliteCourses) {
    await prisma.course.upsert({
      where: { id: c.id },
      update: {
        productId: c.productId,
        instructor: c.instructor || null,
        status: c.status,
        thumbnailUrl: c.thumbnailUrl || null,
        createdAt: toDate(c.createdAt) || new Date(),
        updatedAt: toDate(c.updatedAt) || new Date(),
      },
      create: {
        id: c.id,
        productId: c.productId,
        instructor: c.instructor || null,
        status: c.status,
        thumbnailUrl: c.thumbnailUrl || null,
        createdAt: toDate(c.createdAt) || new Date(),
        updatedAt: toDate(c.updatedAt) || new Date(),
      }
    });
  }

  const sqliteModules: any[] = db.prepare('SELECT * FROM CourseModule').all() as any[];
  for (const m of sqliteModules) {
    await prisma.courseModule.upsert({
      where: { id: m.id },
      update: {
        courseId: m.courseId,
        title: m.title,
        description: m.description || null,
        sortOrder: m.sortOrder ?? 0,
      },
      create: {
        id: m.id,
        courseId: m.courseId,
        title: m.title,
        description: m.description || null,
        sortOrder: m.sortOrder ?? 0,
      }
    });
  }

  const sqliteLessons: any[] = db.prepare('SELECT * FROM CourseLesson').all() as any[];
  for (const l of sqliteLessons) {
    await prisma.courseLesson.upsert({
      where: { id: l.id },
      update: {
        moduleId: l.moduleId,
        title: l.title,
        content: l.content || null,
        videoUrl: l.videoUrl || null,
        attachments: l.attachments || null,
        duration: l.duration ?? null,
        sortOrder: l.sortOrder ?? 0,
        isFree: toBool(l.isFree),
      },
      create: {
        id: l.id,
        moduleId: l.moduleId,
        title: l.title,
        content: l.content || null,
        videoUrl: l.videoUrl || null,
        attachments: l.attachments || null,
        duration: l.duration ?? null,
        sortOrder: l.sortOrder ?? 0,
        isFree: toBool(l.isFree),
      }
    });
  }

  const sqliteProgress: any[] = db.prepare('SELECT * FROM CourseProgress').all() as any[];
  for (const p of sqliteProgress) {
    await prisma.courseProgress.upsert({
      where: { id: p.id },
      update: {
        userId: p.userId,
        lessonId: p.lessonId,
        completed: toBool(p.completed),
        lastAccessed: toDate(p.lastAccessed) || new Date(),
      },
      create: {
        id: p.id,
        userId: p.userId,
        lessonId: p.lessonId,
        completed: toBool(p.completed),
        lastAccessed: toDate(p.lastAccessed) || new Date(),
      }
    });
  }
  console.log(`✅ Courses, modules, lessons and progress restored.`);

  // 9. Restore Orders, OrderItems, Payments FIRST (so LicenseKey & Review foreign keys resolve)
  console.log('--- Step 9: Restoring Orders, Items & Payments ---');
  const sqliteOrders: any[] = db.prepare('SELECT * FROM "Order"').all() as any[];
  for (const o of sqliteOrders) {
    await prisma.order.upsert({
      where: { id: o.id },
      update: {
        userId: o.userId,
        subtotal: o.subtotal,
        discount: o.discount ?? 0,
        tax: o.tax ?? 0,
        total: o.total,
        baseCurrency: o.baseCurrency || 'USD',
        paymentCurrency: o.paymentCurrency || null,
        paymentAmount: o.paymentAmount ?? null,
        fxRate: o.fxRate ?? null,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        createdAt: toDate(o.createdAt) || new Date(),
        updatedAt: toDate(o.updatedAt) || new Date(),
      },
      create: {
        id: o.id,
        userId: o.userId,
        subtotal: o.subtotal,
        discount: o.discount ?? 0,
        tax: o.tax ?? 0,
        total: o.total,
        baseCurrency: o.baseCurrency || 'USD',
        paymentCurrency: o.paymentCurrency || null,
        paymentAmount: o.paymentAmount ?? null,
        fxRate: o.fxRate ?? null,
        paymentStatus: o.paymentStatus,
        orderStatus: o.orderStatus,
        createdAt: toDate(o.createdAt) || new Date(),
        updatedAt: toDate(o.updatedAt) || new Date(),
      }
    });
  }

  const sqliteOrderItems: any[] = db.prepare('SELECT * FROM OrderItem').all() as any[];
  for (const oi of sqliteOrderItems) {
    await prisma.orderItem.upsert({
      where: { id: oi.id },
      update: {
        orderId: oi.orderId,
        productId: oi.productId,
        price: oi.price,
        quantity: oi.quantity ?? 1,
      },
      create: {
        id: oi.id,
        orderId: oi.orderId,
        productId: oi.productId,
        price: oi.price,
        quantity: oi.quantity ?? 1,
      }
    });
  }

  const sqlitePayments: any[] = db.prepare('SELECT * FROM Payment').all() as any[];
  for (const pay of sqlitePayments) {
    await prisma.payment.upsert({
      where: { id: pay.id },
      update: {
        orderId: pay.orderId,
        method: pay.method,
        mode: pay.mode,
        transactionId: pay.transactionId || null,
        status: pay.status,
        amount: pay.amount,
        currency: pay.currency,
        baseAmount: pay.baseAmount ?? null,
        baseCurrency: pay.baseCurrency || null,
        fxRate: pay.fxRate ?? null,
        metadata: pay.metadata || null,
        proofUrl: pay.proofUrl || null,
        submittedAt: toDate(pay.submittedAt),
        expiresAt: toDate(pay.expiresAt),
        verifiedAt: toDate(pay.verifiedAt),
        verifiedById: pay.verifiedById || null,
        rejectionReason: pay.rejectionReason || null,
        createdAt: toDate(pay.createdAt) || new Date(),
        updatedAt: toDate(pay.updatedAt) || new Date(),
      },
      create: {
        id: pay.id,
        orderId: pay.orderId,
        method: pay.method,
        mode: pay.mode,
        transactionId: pay.transactionId || null,
        status: pay.status,
        amount: pay.amount,
        currency: pay.currency,
        baseAmount: pay.baseAmount ?? null,
        baseCurrency: pay.baseCurrency || null,
        fxRate: pay.fxRate ?? null,
        metadata: pay.metadata || null,
        proofUrl: pay.proofUrl || null,
        submittedAt: toDate(pay.submittedAt),
        expiresAt: toDate(pay.expiresAt),
        verifiedAt: toDate(pay.verifiedAt),
        verifiedById: pay.verifiedById || null,
        rejectionReason: pay.rejectionReason || null,
        createdAt: toDate(pay.createdAt) || new Date(),
        updatedAt: toDate(pay.updatedAt) || new Date(),
      }
    });
  }
  console.log(`✅ ${sqliteOrders.length} orders, ${sqliteOrderItems.length} items, and ${sqlitePayments.length} payments restored.`);

  // 10. Restore Entitlements
  console.log('--- Step 10: Restoring Entitlements ---');
  const sqliteEntitlements: any[] = db.prepare('SELECT * FROM Entitlement').all() as any[];
  for (const ent of sqliteEntitlements) {
    await prisma.entitlement.upsert({
      where: { id: ent.id },
      update: {
        userId: ent.userId,
        productId: ent.productId,
        orderId: ent.orderId,
        orderItemId: ent.orderItemId,
        type: ent.type || 'COURSE',
        status: ent.status,
        metadata: ent.metadata || null,
        startsAt: toDate(ent.startsAt),
        expiresAt: toDate(ent.expiresAt),
        createdAt: toDate(ent.createdAt) || new Date(),
        updatedAt: toDate(ent.updatedAt) || new Date(),
      },
      create: {
        id: ent.id,
        userId: ent.userId,
        productId: ent.productId,
        orderId: ent.orderId,
        orderItemId: ent.orderItemId,
        type: ent.type || 'COURSE',
        status: ent.status,
        metadata: ent.metadata || null,
        startsAt: toDate(ent.startsAt),
        expiresAt: toDate(ent.expiresAt),
        createdAt: toDate(ent.createdAt) || new Date(),
        updatedAt: toDate(ent.updatedAt) || new Date(),
      }
    });
  }
  console.log(`✅ ${sqliteEntitlements.length} entitlements restored.`);

  // 11. Restore LicenseKeys (with verified orderId & assignedToId)
  console.log('--- Step 11: Restoring LicenseKeys ---');
  const validOrderIds = new Set((await prisma.order.findMany({ select: { id: true } })).map(o => o.id));
  const validUserIds = new Set((await prisma.user.findMany({ select: { id: true } })).map(u => u.id));

  const sqliteKeys: any[] = db.prepare('SELECT * FROM LicenseKey').all() as any[];
  for (const k of sqliteKeys) {
    const assignedToId = (k.assignedToId && validUserIds.has(k.assignedToId)) ? k.assignedToId : null;
    const orderId = (k.orderId && validOrderIds.has(k.orderId)) ? k.orderId : null;

    await prisma.licenseKey.upsert({
      where: { id: k.id },
      update: {
        productId: k.productId,
        licenseKey: k.licenseKey,
        status: k.status,
        assignedToId,
        orderId,
        deviceLimit: k.deviceLimit ?? 1,
        activations: k.activations ?? 0,
        activatedAt: toDate(k.activatedAt),
        expiresAt: toDate(k.expiresAt),
        createdAt: toDate(k.createdAt) || new Date(),
        updatedAt: toDate(k.updatedAt) || new Date(),
      },
      create: {
        id: k.id,
        productId: k.productId,
        licenseKey: k.licenseKey,
        status: k.status,
        assignedToId,
        orderId,
        deviceLimit: k.deviceLimit ?? 1,
        activations: k.activations ?? 0,
        activatedAt: toDate(k.activatedAt),
        expiresAt: toDate(k.expiresAt),
        createdAt: toDate(k.createdAt) || new Date(),
        updatedAt: toDate(k.updatedAt) || new Date(),
      }
    });
  }
  console.log(`✅ ${sqliteKeys.length} license keys restored.`);

  // 12. Restore Reviews (1865 records in batches)
  console.log('--- Step 12: Restoring Reviews ---');
  const fallbackUserId = (await prisma.user.findFirst({ select: { id: true } }))?.id || 'cmur9djgo000390lscujlmw2j';
  const sqliteReviews: any[] = db.prepare('SELECT * FROM Review').all() as any[];
  console.log(`Found ${sqliteReviews.length} reviews in backup.`);
  const batchSize = 100;
  for (let i = 0; i < sqliteReviews.length; i += batchSize) {
    const batch = sqliteReviews.slice(i, i + batchSize);
    const data = batch.map(r => ({
      id: r.id,
      userId: (r.userId && validUserIds.has(r.userId)) ? r.userId : fallbackUserId,
      productId: r.productId,
      orderId: (r.orderId && validOrderIds.has(r.orderId)) ? r.orderId : null,
      rating: r.rating,
      title: r.title || null,
      comment: r.comment,
      images: r.images || null,
      type: r.type,
      status: r.status,
      verifiedPurchase: toBool(r.verifiedPurchase),
      avatarSeed: r.avatarSeed || null,
      createdAt: toDate(r.createdAt) || new Date(),
      updatedAt: toDate(r.updatedAt) || new Date(),
    }));

    await prisma.review.createMany({
      data,
      skipDuplicates: true
    });
    console.log(`  - Migrated ${Math.min(i + batchSize, sqliteReviews.length)}/${sqliteReviews.length} reviews`);
  }
  console.log(`✅ All ${sqliteReviews.length} reviews restored.`);

  // 13. Restore Menu and MenuItems
  console.log('--- Step 13: Restoring Menus & MenuItems ---');
  await prisma.menuItem.deleteMany({});

  const sqliteMenuItems: any[] = [
    {
      id: 'cmuty96x4000f90aksxwzbive',
      menuId: 'cmutxgbvn000090aksffu156r',
      parentId: null,
      label: 'Home',
      url: '/',
      openInNew: false,
      sortOrder: 0,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'cmuty9oz9000n90ake9dfiloi',
      menuId: 'cmutxgbvn000090aksffu156r',
      parentId: null,
      label: 'Software',
      url: '/store?category=software',
      openInNew: false,
      sortOrder: 1,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'cmutya6qp000t90akrr7374bp',
      menuId: 'cmutxgbvn000090aksffu156r',
      parentId: null,
      label: 'Proxies',
      url: '/store?category=proxies',
      openInNew: false,
      sortOrder: 2,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'cmutyax9h000z90akm77xlojo',
      menuId: 'cmutxgbvn000090aksffu156r',
      parentId: null,
      label: 'CC',
      url: '/store?category=bb',
      openInNew: false,
      sortOrder: 3,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'cmuu1fzeg000l90ac0p98lqd6',
      menuId: 'cmutxgbvn000090aksffu156r',
      parentId: null,
      label: 'Store',
      url: '/store',
      openInNew: false,
      sortOrder: 4,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'footer-store-1',
      menuId: 'cmutxgbxv000190akcuuir32i',
      parentId: null,
      label: 'Store',
      url: '/store',
      openInNew: false,
      sortOrder: 0,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'footer-software-2',
      menuId: 'cmutxgbxv000190akcuuir32i',
      parentId: null,
      label: 'Software',
      url: '/store?category=software',
      openInNew: false,
      sortOrder: 1,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'footer-proxies-3',
      menuId: 'cmutxgbxv000190akcuuir32i',
      parentId: null,
      label: 'Proxies',
      url: '/store?category=proxies',
      openInNew: false,
      sortOrder: 2,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'footer-cc-4',
      menuId: 'cmutxgbxv000190akcuuir32i',
      parentId: null,
      label: 'CC',
      url: '/store?category=bb',
      openInNew: false,
      sortOrder: 3,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    },
    {
      id: 'footer-contact-5',
      menuId: 'cmutxgbxv000190akcuuir32i',
      parentId: null,
      label: 'Contact Support',
      url: '/contact',
      openInNew: false,
      sortOrder: 4,
      type: 'CUSTOM_URL',
      isVisible: true,
      authVisibility: 'EVERYONE'
    }
  ];

  for (const item of sqliteMenuItems) {
    await prisma.menuItem.create({ data: item });
  }
  console.log(`✅ Menu items restored.`);

  console.log('\n🎉 ALL DATA RESTORATION COMPLETED SUCCESSFULLY!');
}

restore()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
