import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export function getPrismaClient(tx?: PrismaClient): PrismaClient {
    return tx ?? prisma;
}