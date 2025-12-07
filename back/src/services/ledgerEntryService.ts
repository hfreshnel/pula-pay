import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ledgerEntryService = {
    getLedgerEntriesForAccount: async function (accountIds: string[]) {
        return await prisma.ledgerEntry.findMany({
            where: { accountId: { in: accountIds } },
            select: { txId: true },
            distinct: ["txId"]
        });
    }
}

export default ledgerEntryService;