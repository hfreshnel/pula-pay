import { Prisma } from "@prisma/client";
import accountService from "../../services/accountService.js";
import ledgerEntryService from "../../services/ledgerEntryService.js";
import txService from "../../services/txService.js";
import { getPaymentProvider, defaultPaymentProviderCode } from "../../infra/payments/paymentProviderRegistry.js";
import { EntryKind, TxStatus } from "@prisma/client";
import { prisma } from "../../services/client.js";
import { ConflictError, InternalError, NotFoundError } from "../../errors/AppErrors.js";

export async function createDeposit({ userId, amount, msisdn, currency, idempotencyKey }:
    { userId: string, amount: string, msisdn: string, currency: string, idempotencyKey: string }) {

    const provider = getPaymentProvider(defaultPaymentProviderCode);
    const amountDecimal = new Prisma.Decimal(amount);

    const referenceId = await prisma.$transaction(async (tx) => {
        await accountService.getOrCreateUserAccount(userId, currency, tx);
        await accountService.getOrCreateEscrowAccount(currency, tx);

        return await txService.createDeposit({ idempotencyKey, currency, amount: amountDecimal, userId, msisdn }, tx);
    });


    await provider.requestDeposit({ referenceId, amount, currency, msisdn, externalId: `deposit-${referenceId}` });

    return referenceId;
}

export async function createWithdrawal({ userId, amount, msisdn, currency, idempotencyKey, }:
    { userId: string, amount: string, msisdn: string, currency: string, idempotencyKey: string }) {

    const provider = getPaymentProvider(defaultPaymentProviderCode);
    const amountDecimal = new Prisma.Decimal(amount);

    const referenceId = await prisma.$transaction(async (tx) => {
        const userAcc = await accountService.getOrCreateUserAccount(userId, currency, tx);
        await accountService.getOrCreateEscrowAccount(currency, tx);

        const balance = await accountService.getAccountBalance(userAcc.id, tx);
        if (balance.lessThan(amountDecimal)) {
            throw new ConflictError("Insufficient funds", "INSUFFICIENT_FUNDS");
        }
        return await txService.createWithdraw({ idempotencyKey, currency, amount:amountDecimal, userId, msisdn }, tx);
    });

    await provider.requestWithdrawal({
        referenceId,
        amount,
        currency,
        msisdn,
        externalId: `withdraw-${referenceId}`,
    });

    return referenceId;
}

export async function pollTransactionStatus(txId: string) {
    return prisma.$transaction(async (tx) => {
        const transaction = await txService.getTx(txId, tx);
        if (!transaction) {
            throw new NotFoundError("Transaction not found");
        }

        if (transaction.status === TxStatus.SUCCESS || transaction.status === TxStatus.FAILED) {
            return transaction.status;
        }

        const provider = getPaymentProvider(defaultPaymentProviderCode);
        const providerStatus = await provider.getStatus({
            referenceId: txId,
            kind: transaction.kind,
        });

        if (providerStatus === "FAILED") {
            await txService.updateTx(txId, TxStatus.FAILED, tx);
            return TxStatus.FAILED;
        }

        if (providerStatus !== "SUCCESS") {
            return TxStatus.PENDING;
        }

        const userId = (transaction.meta as any).userId as string;
        const amount = transaction.amount;

        const escrowAcc = await accountService.getOrCreateEscrowAccount(
            transaction.currency,
            tx
        );
        const userAcc = await accountService.getOrCreateUserAccount(
            userId,
            transaction.currency,
            tx
        );

        switch (transaction.kind) {
            case EntryKind.DEPOSIT:
                await txService.completeTransaction(
                    txId,
                    escrowAcc,
                    userAcc,
                    amount,
                    transaction.currency,
                    tx
                );
                break;

            case EntryKind.WITHDRAWAL:
                await txService.completeTransaction(
                    txId,
                    userAcc,
                    escrowAcc,
                    amount,
                    transaction.currency,
                    tx
                );
                break;

            default:
                throw new InternalError(`Unknown transaction kind: ${transaction.kind}`);
        }

        return TxStatus.SUCCESS;
    });
}

export async function getUserTransactions(userId: string) {
    const userAccounts = await accountService.getUserAccounts(userId);
    const accountIds = userAccounts.map((acc) => acc.id);
    const ledgerEntries = await ledgerEntryService.getLedgerEntriesForAccount(accountIds);
    const txIds = ledgerEntries.map((le) => le.txId);
    const txs = await txService.getTxs(txIds);
    return txs;
}

export async function getAccountBalance(userId: string, currency: string) {
    const acc = await accountService.getUserAccount(userId, currency);
    if (!acc) return new Prisma.Decimal(0);
    return await accountService.getAccountBalance(acc.id);
}

export async function transfer({ senderId, receiverId, amount, currency, idempotencyKey }:
    { senderId: string, receiverId: string, amount: string, currency: string, idempotencyKey: string }) {
    const amountDecimal = new Prisma.Decimal(amount);
    const txId = await prisma.$transaction(async (tx) => {
        const senderAcc = await accountService.getOrCreateUserAccount(senderId, currency, tx);

        const balance = await accountService.getAccountBalance(senderAcc.id, tx);
        if (balance.lessThan(amountDecimal)) {
            throw new ConflictError("Insufficient funds", "INSUFFICIENT_FUNDS");
        }
        return await txService.createTransfer({ senderId: senderAcc.id, receiverId, amount: amountDecimal, currency, idempotencyKey }, tx);
    });
    return txId;
}
