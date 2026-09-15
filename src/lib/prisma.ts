import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

try {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
  }
} catch (error) {
  console.warn('Prisma client initialization failed:', error);
  // Export a mock object for build purposes
  prisma = {} as PrismaClient;
}

export { prisma };

