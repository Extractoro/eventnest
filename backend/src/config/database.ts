import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Pattern: Singleton
// Ensures only one Prisma client instance exists across the application.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
