import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Ensure connection_limit=1 and pgbouncer=true for serverless pooler safety
function getDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // If using Supabase pooler (port 6543 or pooler hostname), ensure connection_limit=1 and pgbouncer=true
  if (url.includes('pooler.supabase.com') || url.includes(':6543')) {
    try {
      const parsed = new URL(url);
      if (!parsed.searchParams.has('connection_limit')) {
        parsed.searchParams.set('connection_limit', '1');
      }
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true');
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }
  return url;
}

const dbUrl = getDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
          ]
        : ['error', 'warn'],
  });

if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
  // @ts-expect-error Prisma event types are strict
  prisma.$on('query', (e: any) => {
    console.log(`[Prisma Query] ${e.duration}ms`);
  });
  // @ts-expect-error Prisma event types are strict
  prisma.$on('info', (e: any) => {
    console.log(`[Prisma Info] ${e.message}`);
  });
}

// Always maintain singleton across reloads in any runtime
globalForPrisma.prisma = prisma;
