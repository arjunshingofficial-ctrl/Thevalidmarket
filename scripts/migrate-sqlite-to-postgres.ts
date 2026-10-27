// @ts-nocheck
import { PrismaClient as SqliteClient } from '@prisma/client';
// Require the generated postgres client (Make sure to generate it first)
// Example generator in postgres.prisma:
// generator client {
//   provider = "prisma-client-js"
//   output   = "../node_modules/@prisma/postgres-client"
// }
import { PrismaClient as PostgresClient } from '@prisma/postgres-client';

const sqlite = new SqliteClient();
const pg = new PostgresClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  const isVerify = process.argv.includes('--verify');

  if (isVerify) {
    console.log('Starting VERIFICATION MODE. No data will be transferred.');
  } else {
    console.log('Starting data migration from SQLite to PostgreSQL...');
  }

  // Topological Order to respect Foreign Key Constraints
  const modelsToMigrate = [
    // Independent/Core
    'role', 'siteSettings', 'customizationRevision', 'redirect', 'vpnLocation', 'paymentMethodConfig', 'media', 'fieldDefinition', 'blogCategory', 'page', 'menu',
    
    // Users & Auth
    'user', 'account', 'session', 'verificationToken',
    
    // Catalog
    'category', 'product', 'productVariant', 'productFile', 'productFieldValue', 'course', 'courseModule', 'courseLesson',
    
    // Commerce
    'order', 'orderItem', 'payment', 'coupon', 'entitlement', 'license', 'licenseKey', 'download', 'subscription',
    
    // Support & Content
    'review', 'supportTicket', 'ticketReply', 'blogPost', 'menuItem',
    
    // Affiliate & Referrals
    'referral', 'referralCode', 'referralCommission', 'withdrawalRequest',
    
    // Wallet
    'wallet', 'walletTransaction', 'walletDeposit',
    
    // Activity & Chat
    'chatMessage', 'chatReport', 'notification', 'auditLog', 'analyticsEvent', 'courseProgress'
  ];

  for (const model of modelsToMigrate) {
    console.log(`Migrating ${model}...`);
    
    try {
      if (isVerify) {
        // @ts-ignore
        const sqliteCount = await sqlite[model].count();
        // @ts-ignore
        const pgCount = await pg[model].count();
        console.log(`  - SQLite: ${sqliteCount} records | PostgreSQL: ${pgCount} records`);
        continue;
      }

      // @ts-ignore
      const records = await sqlite[model].findMany();
      
      if (records.length === 0) {
        console.log(`  - 0 records found for ${model}, skipping.`);
        continue;
      }

      console.log(`  - Found ${records.length} records. Inserting...`);
      
      // Special handling for Category and MenuItem due to self-relations
      if (model === 'category' || model === 'menuItem') {
        let pending = [...records];
        let maxLoops = 10; // Prevent infinite loops if circular dependency exists
        
        while (pending.length > 0 && maxLoops > 0) {
          const nextPending = [];
          let insertedCount = 0;
          
          for (const record of pending) {
            try {
              // @ts-ignore
              await pg[model].create({ data: record });
              insertedCount++;
            } catch (e: any) {
              if (e.code === 'P2002') {
                // Already exists, treat as success
                insertedCount++;
              } else {
                // Likely a foreign key violation
                nextPending.push(record);
              }
            }
          }
          
          if (insertedCount === 0 && nextPending.length > 0) {
            throw new Error(`Circular dependency detected in ${model}. Cannot insert remaining ${nextPending.length} records.`);
          }
          
          pending = nextPending;
          maxLoops--;
        }
      } else {
        // @ts-ignore
        await pg[model].createMany({
          data: records,
          skipDuplicates: true,
        });
      }

      console.log(`  - Successfully migrated ${model}.`);
    } catch (error) {
      console.error(`  ! Error migrating ${model}:`, error);
      // Stop the script on first failure to prevent partial broken state
      process.exit(1);
    }
  }

  console.log('\nMigration completed successfully! 🎉');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await pg.$disconnect();
  });
