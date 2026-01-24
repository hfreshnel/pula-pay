import Decimal from 'decimal.js';
import { Currency, PrismaClient } from '@prisma/client';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { TransactionRepository } from '../../domain/ports/repositories/TransactionRepository';
import { ExchangeRateProvider } from '../../domain/ports/ExchangeRateProvider';
import { LedgerService } from '../../domain/services/LedgerService';
import { Money } from '../../domain/value-objects/Money';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';
import { generateIdempotencyKey } from '../../shared/utils/idempotency';
import { logger } from '../../shared/utils/logger';

export interface SimpleTransferCommand {
  senderUserId: string;
  recipientPhone?: string;
  recipientAddress?: string;
  amount: number;
  currency: Currency;
  description?: string;
  idempotencyKey?: string;
}

export interface SimpleTransferResult {
  transactionId: string;
  amountUsdc: string;
  displayAmount: string;
  displayCurrency: Currency;
  recipientAddress: string;
  status: string;
}

/**
 * Executes a P2P transfer without involving Circle.
 * This handler only operates on the database, updating wallet balances directly.
 * Similar to how deposit and withdraw handlers work.
 */
export class ExecuteSimpleTransferHandler {
  private ledgerService = new LedgerService();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: TransactionRepository,
    private readonly exchangeRateProvider: ExchangeRateProvider
  ) {}

  async execute(command: SimpleTransferCommand): Promise<SimpleTransferResult> {
    const idempotencyKey = command.idempotencyKey ?? generateIdempotencyKey();

    // 1. Idempotency check
    const existing = await this.txRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      const recipient = await this.walletRepo.findById(existing.counterpartyId ?? '');
      return this.toResult(existing, recipient?.address ?? '', command.currency);
    }

    // 2. Resolve wallets
    const senderWallet = await this.walletRepo.findByUserId(command.senderUserId);
    if (!senderWallet) {
      throw new WalletNotFoundError(command.senderUserId, 'userId');
    }

    const recipientWallet = command.recipientPhone
      ? await this.walletRepo.findByUserPhone(command.recipientPhone)
      : await this.walletRepo.findByAddress(command.recipientAddress!);

    if (!recipientWallet) {
      throw new WalletNotFoundError(
        command.recipientPhone ?? command.recipientAddress ?? '',
        command.recipientPhone ? 'phone' : 'address'
      );
    }

    // 3. Convert amount to USDC
    const rate = await this.exchangeRateProvider.getRate(command.currency);
    const money = Money.fromFiat(command.amount, command.currency, rate.rate);

    // 4. Validate sender can withdraw
    senderWallet.assertCanWithdraw(money.amountUsdc);
    recipientWallet.assertCanTransact();

    // 5. Create transaction as PROCESSING
    const transaction = await this.txRepo.create({
      idempotencyKey,
      type: 'TRANSFER_P2P',
      status: 'PROCESSING',
      amountUsdc: money.amountUsdc,
      feeUsdc: new Decimal(0), // P2P free for now
      exchangeRate: rate.rate,
      displayCurrency: command.currency,
      displayAmount: money.displayAmount,
      walletId: senderWallet.id,
      counterpartyId: recipientWallet.id,
      description: command.description,
    });

    // 6. Complete transfer immediately (DB-only, no Circle)
    // Ledger entries
    const entries = this.ledgerService.createTransferEntries(
      transaction.id,
      senderWallet.id,
      recipientWallet.id,
      money.amountUsdc,
      senderWallet.balance,
      recipientWallet.balance
    );

    // Atomic update
    await this.prisma.$transaction(async (tx) => {
      senderWallet.debit(money.amountUsdc);
      recipientWallet.credit(money.amountUsdc);

      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balanceUsdc: senderWallet.balance.toNumber() },
      });

      await tx.wallet.update({
        where: { id: recipientWallet.id },
        data: { balanceUsdc: recipientWallet.balance.toNumber() },
      });

      for (const entry of entries) {
        await tx.ledgerEntry.create({
          data: {
            transactionId: entry.transactionId,
            walletId: entry.walletId,
            accountType: entry.accountType,
            amountUsdc: entry.amountUsdc.toNumber(),
            entryType: entry.entryType,
            balanceAfter: entry.balanceAfter.toNumber(),
          },
        });
      }

      transaction.complete();
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: transaction.status,
          completedAt: transaction.completedAt,
        },
      });
    });

    logger.info(
      {
        transactionId: transaction.id,
        amountUsdc: money.amountUsdc.toString(),
        from: senderWallet.address,
        to: recipientWallet.address,
      },
      'Simple transfer completed (DB-only)'
    );

    return this.toResult(transaction, recipientWallet.address, command.currency);
  }

  private toResult(
    tx: { id: string; amountUsdc: Decimal; displayAmount?: Decimal | null; displayCurrency?: Currency | null; status: string },
    recipientAddress: string,
    currency: Currency
  ): SimpleTransferResult {
    return {
      transactionId: tx.id,
      amountUsdc: tx.amountUsdc.toString(),
      displayAmount: tx.displayAmount?.toString() ?? '0',
      displayCurrency: tx.displayCurrency ?? currency,
      recipientAddress,
      status: tx.status,
    };
  }
}
