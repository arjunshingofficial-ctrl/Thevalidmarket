import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'info',
      },
    ],
  });

if (globalForPrisma.prisma) {
  // avoid adding multiple listeners in dev
} else {
  // @ts-expect-error Prisma event types are strict
  prisma.$on('query', (e: any) => {
    console.log(`[Prisma Query] ${e.duration}ms`);
  });
  // @ts-expect-error Prisma event types are strict
  prisma.$on('info', (e: any) => {
    console.log(`[Prisma Info] ${e.message}`);
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
