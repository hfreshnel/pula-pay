import { PrismaClient, TxStatus, EntryKind } from '@prisma/client';

const prisma = new PrismaClient();

const txService = {
    createDeposit: async function (idempotencyKey: string, currency: string, amount: any, userId: string, msisdn: string) {
        const tx = await prisma.tx.create({
            data: {
                idempotencyKey: idempotencyKey,
                status: TxStatus.PENDING,
                kind: EntryKind.DEPOSIT,
                currency: currency,
                amount: amount as unknown as any,
                meta: { userId, msisdn }
            }
        });
        return tx.id;
    },

    createWithdraw: async function (idempotencyKey: string, currency: string, amount: any, userId: string, msisdn: string) {
        const tx = await prisma.tx.create({
            data: {
                idempotencyKey: idempotencyKey,
                status: TxStatus.PENDING,
                kind: EntryKind.WITHDRAWAL,
                currency: currency,
                amount: amount as unknown as any,
                meta: { userId, msisdn }
            }
        });
        return tx.id;
    },

    updateTx: async function (txId: string, status: TxStatus) {
        await prisma.tx.update({ where: { id: txId }, data: { status: TxStatus.FAILED } });
    },

    getTx: async function (txId: string) {
        const tx = await prisma.tx.findUnique({ where: { id: txId } });
        return tx;
    },

    completeTransaction: async function (txId: string, fromAcc: { id: string }, toAcc: { id: string }, amountStr: string, currency: string) {
        await prisma.$transaction(async (trx) => {
            await trx.tx.update({ where: { id: txId }, data: { status: TxStatus.SUCCESS } });
            await trx.ledgerEntry.createMany({
                data: [
                    { txId, accountId: fromAcc.id, debit: amountStr as any, credit: 0 as any, currency },
                    { txId, accountId: toAcc.id, debit: 0 as any, credit: amountStr as any, currency }
                ]
            });
        });
    }
}

export default txService;