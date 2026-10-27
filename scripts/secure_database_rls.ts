import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function secureDatabase() {
  console.log("==================================================");
  console.log("🔒 SECURING ASIA D MARKET SUPABASE DATABASE");
  console.log("==================================================");

  // 1. Fetch all tables in schema 'public'
  const tables = await prisma.$queryRawUnsafe<{ tablename: string; rowsecurity: boolean }[]>(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  console.log(`\nFound ${tables.length} tables in schema 'public'. Enabling RLS on each...`);

  let enabledCount = 0;
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table.tablename}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✓ RLS enabled on: "${table.tablename}"`);
      enabledCount++;
    } catch (err: any) {
      console.error(`  ✗ Error enabling RLS on "${table.tablename}":`, err.message);
    }
  }

  console.log(`\nSuccessfully enabled RLS on ${enabledCount} tables.`);

  // 2. Revoke permissions from anon and authenticated roles
  console.log("\n🔒 Revoking public API access from 'anon' and 'authenticated' roles...");
  try {
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;`);
    console.log("  ✓ Revoked ALL ON ALL TABLES in public from anon, authenticated");
    
    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;`);
    console.log("  ✓ Revoked ALL ON ALL SEQUENCES in public from anon, authenticated");

    await prisma.$executeRawUnsafe(`REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated;`);
    console.log("  ✓ Revoked ALL ON ALL ROUTINES in public from anon, authenticated");

    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;`);
    console.log("  ✓ Revoked DEFAULT PRIVILEGES on tables for future tables");

    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;`);
    console.log("  ✓ Revoked DEFAULT PRIVILEGES on sequences for future sequences");

    await prisma.$executeRawUnsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated;`);
    console.log("  ✓ Revoked DEFAULT PRIVILEGES on routines for future routines");
  } catch (err: any) {
    console.error("  ✗ Error revoking privileges:", err.message);
  }

  // 3. Verification
  console.log("\n==================================================");
  console.log("🔍 VERIFYING DATABASE STATUS POST-FIX");
  console.log("==================================================");

  const verification = await prisma.$queryRawUnsafe<{ tablename: string; rowsecurity: boolean }[]>(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  let vulnerableCount = 0;
  for (const t of verification) {
    if (!t.rowsecurity) {
      console.log(`  [ALERT] ${t.tablename} still has RLS disabled!`);
      vulnerableCount++;
    }
  }

  if (vulnerableCount === 0) {
    console.log(`\n🎉 SUCCESS! All ${verification.length} tables in schema 'public' have Row-Level Security ENABLED.`);
    console.log("Public API access for PostgREST is completely locked down.");
  } else {
    console.warn(`\n⚠️ Warning: ${vulnerableCount} tables still have RLS disabled.`);
  }

  // 4. Test Prisma access to verify application queries work seamlessly
  console.log("\nTesting Prisma connectivity to ensure website operations are intact...");
  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count();
  console.log(`  ✓ Prisma user query works: ${userCount} users found`);
  console.log(`  ✓ Prisma product query works: ${productCount} products found`);
  console.log(`  ✓ Prisma order query works: ${orderCount} orders found`);
  console.log("==================================================");
}

secureDatabase()
  .catch((e) => {
    console.error("Fatal error during security patching:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
