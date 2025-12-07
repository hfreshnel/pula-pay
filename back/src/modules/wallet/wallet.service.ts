import { Prisma } from "@prisma/client";
import accountService from "../../services/accountService.js";
import ledgerEntryService from "../../services/ledgerEntryService.js";
import txService from "../../services/txService.js";
import { getPaymentProvider, defaultPaymentProviderCode } from "../../infra/payments/paymentProviderRegistry.js";
import { EntryKind, TxStatus } from "@prisma/client";

export async function createDeposit({ userId, amount, msisdn, currency, idempotencyKey }:
    { userId: string, amount: string, msisdn: string, currency: string, idempotencyKey: string }) {

    const provider = getPaymentProvider(defaultPaymentProviderCode);

    await accountService.getOrCreateUserAccount(userId, currency, msisdn);
    await accountService.getOrCreateEscrowAccount(currency);

    const referenceId = await txService.createDeposit({ idempotencyKey, currency, amount, userId, msisdn });

    await provider.requestDeposit({ referenceId, amount, currency, msisdn, externalId: `deposit-${referenceId}` });

    return referenceId;
}

export async function createWithdrawal({ userId, amount, msisdn, currency, idempotencyKey, }:
    { userId: string, amount: string, msisdn: string, currency: string, idempotencyKey: string }) {

    const provider = getPaymentProvider(defaultPaymentProviderCode);

    const userAcc = await accountService.getOrCreateUserAccount(userId, currency);
    await accountService.getOrCreateEscrowAccount(currency);

    const balance = await accountService.getAccountBalance(userAcc.id);
    const amountDecimal = new Prisma.Decimal(amount);

    if (balance.lessThan(amountDecimal)) {
        throw new Error("INSUFFICIENT_FUNDS");
    }

    const referenceId = await txService.createWithdraw({ idempotencyKey, currency, amount, userId, msisdn });

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
    const tx = await txService.getTx(txId);
    if (!tx) throw new Error("NOT_FOUND");

    if (tx.status === TxStatus.SUCCESS || tx.status === TxStatus.FAILED) {
        return tx.status;
    }

    const provider = getPaymentProvider(defaultPaymentProviderCode);
    const status = await provider.getStatus({ referenceId: txId, kind: tx.kind });

    if (status === "SUCCESS") {
        const currency = tx.currency;
        const userId = (tx.meta as any).userId as string;
        const amountStr = tx.amount as unknown as string;

        const [escrowAcc, userAcc] = await Promise.all([
            accountService.getOrCreateEscrowAccount(currency),
            accountService.getOrCreateUserAccount(userId, currency),
        ]);

        switch (tx.kind) {
            case EntryKind.DEPOSIT:
                await txService.completeTransaction(txId, escrowAcc, userAcc, amountStr, currency);
                break;
            case EntryKind.WITHDRAWAL:
                await txService.completeTransaction(txId, userAcc, escrowAcc, amountStr, currency);
                break;
            default:
                throw new Error(`Unknown transaction kind: ${tx.kind}`);
        }
        return TxStatus.SUCCESS;
    }

    if (status === "FAILED") {
        await txService.updateTx(txId, TxStatus.FAILED);
        return TxStatus.FAILED;
    }

    return TxStatus.PENDING;
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
    const txId = await txService.createTransfer({ senderId, receiverId, amount, currency, idempotencyKey });
    return txId;
}
