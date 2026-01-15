import { prisma } from "./client.js";

import { PrismaTx, Db } from "../types/module.wallet.js";

function dbClient(tx?: PrismaTx): Db {
    return tx ?? prisma;
}

const ledgerEntryService = {
    getLedgerEntriesForAccount: async function (accountIds: string[], tx?: PrismaTx) {
        if (accountIds.length === 0) return [];

        const db = dbClient(tx);

        return await db.ledgerEntry.findMany({
            where: { accountId: { in: accountIds } },
            select: { txId: true },
            distinct: ["txId"]
        });
    }
}

export default ledgerEntryService;