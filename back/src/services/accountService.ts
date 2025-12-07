import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const accountService = {
    getOrCreateUserAccount: async function (userId: string, currency: string, phone: string = "56570801") {
        await prisma.appUser.upsert({
            where: { id: userId },
            update: {},
            create: { id: userId, phone: phone },
        });

        let acc = await prisma.account.findUnique({
            where: { userId_currency_kind: { userId, currency, kind: 'USER' } }
        });
        if (!acc) {
            acc = await prisma.account.create({ data: { userId, currency, kind: 'USER' } });
        }
        return acc;
    },

    getOrCreateEscrowAccount: async function (currency: string) {
        let acc = await prisma.account.findFirst({ where: { kind: 'ESCROW', currency, userId: null } });
        if (!acc) {
            acc = await prisma.account.create({ data: { currency, kind: 'ESCROW' } });
        }
        return acc;
    },

    getUserAccount: async function (userId: string, currency: string) {
        return await prisma.account.findUnique({
            where: {
                userId_currency_kind: {
                    userId,
                    currency,
                    kind: "USER"
                }
            }
        });
    },

    getAccountBalance: async function (accountId: string) {
        const agg = await prisma.ledgerEntry.groupBy({
            by: ['accountId'],
            where: { accountId },
            _sum: { credit: true, debit: true }
        });
        if (agg.length === 0) return new Prisma.Decimal(0);
        const sumCredit = agg[0]._sum.credit ?? new Prisma.Decimal(0);
        const sumDebit = agg[0]._sum.debit ?? new Prisma.Decimal(0);

        return sumCredit.minus(sumDebit);
    },

    getUserAccounts: async function (userId: string) {
        return await prisma.account.findMany({
            where: { userId, kind: "USER" },
            select: { id: true }
        });
    }
}

export default accountService;