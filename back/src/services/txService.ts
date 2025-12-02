import { Prisma, PrismaClient, TxStatus, EntryKind } from '@prisma/client';
import accountService from './accountService.js';

const prisma = new PrismaClient();

const txService = {
    createDeposit: async function ({ idempotencyKey, currency, amount, userId, msisdn }:
        {idempotencyKey: string, currency: string, amount: any, userId: string, msisdn: string}) {
        const tx = await prisma.tx.create({
            data: {
                idempotencyKey: idempotencyKey,
                status: TxStatus.PENDING,
                kind: EntryKind.DEPOSIT,
                currency: currency,
                amount: amount as unknown as any, //code smell
                meta: { userId, msisdn }
            }
        });
        return tx.id;
    },

    createWithdraw: async function ({ idempotencyKey, currency, amount, userId, msisdn }:
        {idempotencyKey: string, currency: string, amount: any, userId: string, msisdn: string}) {
        const tx = await prisma.tx.create({
            data: {
                idempotencyKey: idempotencyKey,
                status: TxStatus.PENDING,
                kind: EntryKind.WITHDRAWAL,
                currency: currency,
                amount: amount as unknown as any, //code smell
                meta: { userId, msisdn }
            }
        });
        return tx.id;
    },

    createTransfer: async function ({ senderId, receiverId, amount, currency, idempotencyKey } : 
        { senderId: string, receiverId: string, amount: string, currency: string, idempotencyKey: string }) {
        const existing = await prisma.tx.findUnique({ where: { idempotencyKey } }).catch(() => null);
        if (existing) throw new Error("Existing idempotencyKey");

        const [senderAcc, receiverAcc] = await Promise.all([
            prisma.account.findFirst({ where: { userId: senderId, currency } }),
            prisma.account.findFirst({ where: { userId: receiverId, currency } })
        ]);

        if (!senderAcc) throw new Error("Sender account not found");
        if (!receiverAcc) throw new Error("Receiver account not found");

        const balance = await accountService.getAccountBalance(senderAcc.id);
        const amt = new Prisma.Decimal(amount)

        if (balance.lessThan(amt)) throw new Error("Insufficient balance");

        return await prisma.$transaction(async (tx) => {
            const transferTx = await tx.tx.create({
                data: {
                    idempotencyKey: idempotencyKey,
                    status: TxStatus.PENDING,
                    kind: EntryKind.TRANSFER,
                    currency: currency,
                    amount: amount,
                    meta: { senderId, receiverId}
                }
            });

            await tx.ledgerEntry.createMany({
                data: [
                    {
                        accountId: senderAcc.id,
                        debit: amt,
                        credit: '0',
                        txId: transferTx.id,
                        currency: currency
                    },
                    {
                        accountId: receiverAcc.id,
                        debit: '0',
                        credit: amt,
                        txId: transferTx.id,
                        currency: currency
                    }
                ]
            });

            const updateTx = await tx.tx.update({
                where: { id: transferTx.id },
                data: { status: TxStatus.SUCCESS }
            });

            return updateTx.id;
        })
    },

    updateTx: async function (txId: string, status: TxStatus) {
        await prisma.tx.update({ where: { id: txId }, data: { status: TxStatus.FAILED } });
    },

    getTx: async function (txId: string) {
        const tx = await prisma.tx.findUnique({ where: { id: txId } });
        return tx;
    },

    getTxs: async function (txIds: string[]) {
        const txs = await prisma.tx.findMany({ 
            where: { id: { in: txIds } },
            orderBy: { createdAt: 'desc' }
        });
        return txs;
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