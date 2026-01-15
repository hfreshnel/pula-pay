import { Prisma, TxStatus, EntryKind } from '@prisma/client';

import accountService from './accountService.js';
import { prisma as defaultPrisma } from "./client.js";
import { ConflictError, InternalError, NotFoundError } from '../errors/AppErrors.js';
import { CreateDeposit, CreateWithdraw, CreateTransfer } from '../types/module.wallet.js';

type PrismaTx = Prisma.TransactionClient;
type Db = typeof defaultPrisma | PrismaTx;

function dbClient(tx?: PrismaTx): Db {
    return tx ?? defaultPrisma;
}

async function getOrCreateIdempotentTx(db: Db, idempotencyKey: string, createData: Prisma.TxCreateInput) {
    try {
        return await db.tx.create({ data: createData });
    } catch (e: any) {
        if (e.code === "P2002") {
            return await db.tx.findUnique({ where: { idempotencyKey } });
        }
        throw e;
    }
}

const txService = {
    createDeposit: async function ({ idempotencyKey, currency, amount, userId, msisdn }: CreateDeposit, tx?: PrismaTx) {
        const db = dbClient(tx);
        const created = await getOrCreateIdempotentTx(db, idempotencyKey, {
            idempotencyKey: idempotencyKey,
            status: TxStatus.PENDING,
            kind: EntryKind.DEPOSIT,
            currency: currency,
            amount: amount,
            meta: { userId, msisdn }
        });
        if (!created) {
            throw new InternalError("Failed to create or retrieve deposit transaction");
        }

        return created.id;
    },

    createWithdraw: async function ({ idempotencyKey, currency, amount, userId, msisdn }: CreateDeposit, tx?: PrismaTx) {
        const db = dbClient(tx);
        const created = await getOrCreateIdempotentTx(db, idempotencyKey, {
            idempotencyKey: idempotencyKey,
            status: TxStatus.PENDING,
            kind: EntryKind.WITHDRAWAL,
            currency: currency,
            amount: amount,
            meta: { userId, msisdn }
        });
        if (!created) {
            throw new InternalError("Failed to create or retrieve withdrawal transaction");
        }
        return created.id;
    },

    createTransfer: async function ({ senderId, receiverId, amount, currency, idempotencyKey, note }: CreateTransfer, tx?: PrismaTx) {
        const db = dbClient(tx);

        const transferTx = await getOrCreateIdempotentTx(db, idempotencyKey, {
            idempotencyKey: idempotencyKey,
            status: TxStatus.PENDING,
            kind: EntryKind.TRANSFER,
            currency: currency,
            amount: amount,
            meta: { senderId, receiverId, note }
        });

        if (!transferTx) {
            throw new InternalError("Failed to create or retrieve transfer transaction");
        }

        if (transferTx.status === TxStatus.SUCCESS || transferTx.status === TxStatus.FAILED) {
            return transferTx.id;
        }

        const existingEntries = await db.ledgerEntry.count({
            where: { txId: transferTx.id },
        });

        if (existingEntries === 0) {
            await db.ledgerEntry.createMany({
                data: [
                    {
                        accountId: senderId,
                        debit: amount,
                        credit: new Prisma.Decimal(0),
                        txId: transferTx.id,
                        currency,
                    },
                    {
                        accountId: receiverId,
                        debit: new Prisma.Decimal(0),
                        credit: amount,
                        txId: transferTx.id,
                        currency,
                    },
                ],
            });
        }

        await db.tx.update({
            where: { id: transferTx.id },
            data: { status: TxStatus.SUCCESS },
        });

        return transferTx.id;
    },

    updateTx: async function (txId: string, status: TxStatus, tx?: PrismaTx) {
        const db = dbClient(tx);
        await db.tx.update({ where: { id: txId }, data: { status } });
    },

    getTx: async function (txId: string, tx?: PrismaTx) {
        const db = dbClient(tx);
        return await db.tx.findUnique({ where: { id: txId } });
    },

    getTxs: async function (txIds: string[], tx?: PrismaTx) {
        const db = dbClient(tx);
        if (txIds.length === 0) return [];
        return db.tx.findMany({
            where: { id: { in: txIds } },
            orderBy: { createdAt: "desc" },
        });
    },

    completeTransaction: async function (txId: string, fromAcc: { id: string }, toAcc: { id: string }, amount: Prisma.Decimal, currency: string, tx?: PrismaTx) {
        const db = dbClient(tx);
        const current = await db.tx.findUnique({ where: { id: txId } });
        if (!current) throw new NotFoundError("Transaction not found", "TX_NOT_FOUND");
        if (current.status === TxStatus.SUCCESS) return;
        if (current.status === TxStatus.FAILED) {
            throw new ConflictError("Transaction already failed", "TX_ALREADY_FAILED");
        }

        await db.tx.update({ where: { id: txId }, data: { status: TxStatus.SUCCESS } });

        const existingEntries = await db.ledgerEntry.count({ where: { txId } });
        if (existingEntries > 0) return;

        await db.ledgerEntry.createMany({
            data: [
                {
                    txId,
                    accountId: fromAcc.id,
                    debit: amount,
                    credit: new Prisma.Decimal(0),
                    currency,
                },
                {
                    txId,
                    accountId: toAcc.id,
                    debit: new Prisma.Decimal(0),
                    credit: amount,
                    currency,
                },
            ],
        });
    }
}

export default txService;