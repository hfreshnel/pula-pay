import { Prisma, PrismaClient } from "@prisma/client";

export type PrismaTx = Prisma.TransactionClient;

export type Db = PrismaClient | PrismaTx;

export type CreateDeposit = {
    idempotencyKey: string, 
    currency: string, 
    amount: Prisma.Decimal, 
    userId: string, 
    msisdn: string
}

export type CreateWithdraw = CreateDeposit;

export type CreateTransfer = {
    senderId: string, 
    receiverId: string, 
    amount: Prisma.Decimal, 
    currency: string, 
    idempotencyKey: string,
    note?: string
};