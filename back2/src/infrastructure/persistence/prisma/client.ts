import { PrismaClient } from '@prisma/client';
import { logger } from '../../../shared/utils/logger';
import { config } from '../../../shared/config';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      config.env === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (config.env !== 'production') {
  globalThis.prisma = prisma;
}

// Log queries in development
if (config.env === 'development') {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    logger.debug({ query: e.query, duration: e.duration }, 'Prisma query');
  });
}

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error({ error: e.message }, 'Prisma error');
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
