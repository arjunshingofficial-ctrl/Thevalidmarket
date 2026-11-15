import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Ensure connection_limit (default 10), timeouts, and optional direct session connection
function getDatasourceUrl(): string | undefined {
  // If DB_USE_DIRECT="true" and DIRECT_URL is available, use direct session mode on Port 5432
  // Default is false to use Supabase PgBouncer pooler (port 6543) which safely multiplexes concurrent traffic
  const useDirect = process.env.DB_USE_DIRECT === 'true' || process.env.DB_USE_DIRECT === '1';
  const url = (useDirect && process.env.DIRECT_URL) ? process.env.DIRECT_URL : process.env.DATABASE_URL;
  if (!url) return undefined;

  const connectionLimit = process.env.DB_CONNECTION_LIMIT || '10';
  const poolTimeout = process.env.DB_POOL_TIMEOUT || '30';
  const connectTimeout = process.env.DB_CONNECT_TIMEOUT || '20';

  try {
    const parsed = new URL(url);

    // If not present or previously capped at 1, elevate to connectionLimit (default 10) for fast parallel queries
    if (!parsed.searchParams.has('connection_limit') || parsed.searchParams.get('connection_limit') === '1') {
      parsed.searchParams.set('connection_limit', connectionLimit);
    }

    // Set connection and pool timeouts (default 30s pool, 20s connect) to prevent query stall under concurrent load
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', connectTimeout);
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', poolTimeout);
    }

    // If using Supabase pooler (port 6543 or pooler hostname), ensure pgbouncer=true
    if (parsed.port === '6543' || url.includes(':6543')) {
      if (!parsed.searchParams.has('pgbouncer')) {
        parsed.searchParams.set('pgbouncer', 'true');
      }
    }

    return parsed.toString();
  } catch {
    return url;
  }
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
