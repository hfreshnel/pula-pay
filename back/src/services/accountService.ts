import { Prisma } from '@prisma/client';
import { prisma } from "./client.js";

import { NotFoundError, InternalError } from "../errors/AppErrors.js";
import { PrismaTx, Db } from '../types/module.wallet.js';

function dbClient(tx?: PrismaTx): Db {
  return tx ?? prisma;
}

const accountService = {
    getOrCreateUserAccount: async function (userId: string, currency: string, tx?: PrismaTx) {
        const db = dbClient(tx);

        const user = await db.appUser.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundError("User not found", "USER_NOT_FOUND");
        }

        const acc = await db.account.upsert({
            where: { userId_currency_kind: { userId, currency, kind: 'USER' } },
            update: {},
            create: { userId, currency, kind: 'USER' }
        });

        return acc;
    },

    getOrCreateEscrowAccount: async function (currency: string, tx?: PrismaTx) {
        const db = dbClient(tx);

        let acc = await db.account.findFirst({ where: { kind: 'ESCROW', currency, userId: null } });
        if (!acc) {
            acc = await db.account.create({ data: { currency, kind: 'ESCROW' } });
        }
        return acc;
    },

    getUserAccount: async function (userId: string, currency: string, tx?: PrismaTx) {
        const db = dbClient(tx);
        
        return await db.account.findUnique({
            where: {
                userId_currency_kind: {
                    userId,
                    currency,
                    kind: "USER"
                }
            }
        });
    },

    getAccountBalance: async function (accountId: string, tx?: PrismaTx) {
        const db = dbClient(tx);

        const agg = await db.ledgerEntry.groupBy({
            by: ['accountId'],
            where: { accountId },
            _sum: { credit: true, debit: true }
        });
        if (agg.length === 0) return new Prisma.Decimal(0);
        const sumCredit = agg[0]._sum.credit ?? new Prisma.Decimal(0);
        const sumDebit = agg[0]._sum.debit ?? new Prisma.Decimal(0);

        return sumCredit.minus(sumDebit);
    },

    getUserAccounts: async function (userId: string, tx?: PrismaTx) {
        const db = dbClient(tx);
        
        return await db.account.findMany({
            where: { userId, kind: "USER" },
            select: { id: true }
        });
    }
}

export default accountService;