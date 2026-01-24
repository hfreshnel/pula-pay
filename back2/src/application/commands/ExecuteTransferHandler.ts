import Decimal from 'decimal.js';
import { Currency, PrismaClient, Blockchain } from '@prisma/client';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { TransactionRepository } from '../../domain/ports/repositories/TransactionRepository';
import { WalletProvider } from '../../domain/ports/WalletProvider';
import { ExchangeRateProvider } from '../../domain/ports/ExchangeRateProvider';
import { LedgerService } from '../../domain/services/LedgerService';
import { Money } from '../../domain/value-objects/Money';
import { Transaction } from '../../domain/entities/Transaction';
import { Wallet } from '../../domain/entities/Wallet';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';
import { generateIdempotencyKey } from '../../shared/utils/idempotency';
import { config } from '../../shared/config';
import { logger } from '../../shared/utils/logger';

export interface TransferCommand {
  senderUserId: string;
  recipientPhone?: string;
  recipientWalletAddress?: string;
  amount: number;
  currency: Currency;
  description?: string;
  idempotencyKey?: string;
}

export interface TransferResult {
  transactionId: string;
  amountUsdc: string;
  displayAmount: string;
  displayCurrency: Currency;
  recipientAddress: string;
  status: string;
}

export class ExecuteTransferHandler {
  private ledgerService = new LedgerService();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: TransactionRepository,
    private readonly walletProvider: WalletProvider,
    private readonly exchangeRateProvider: ExchangeRateProvider
  ) {}

  async execute(command: TransferCommand): Promise<TransferResult> {
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
      : await this.walletRepo.findByAddress(command.recipientWalletAddress!);

    if (!recipientWallet) {
      throw new WalletNotFoundError(
        command.recipientPhone ?? command.recipientWalletAddress ?? '',
        command.recipientPhone ? 'phone' : 'address'
      );
    }

    // 3. Convert amount to USDC
    const rate = await this.exchangeRateProvider.getRate(command.currency);
    const money = Money.fromFiat(command.amount, command.currency, rate.rate);

    // 4. Validate sender can withdraw
    senderWallet.assertCanWithdraw(money.amountUsdc);
    recipientWallet.assertCanTransact();

    // 5. Create transaction
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

    // 6. Execute on-chain transfer via Circle
    const circleTransfer = await this.walletProvider.transfer({
      fromWalletId: senderWallet.circleWalletId,
      toAddress: recipientWallet.address,
      amount: money.amountUsdc.toString(),
      tokenId: this.getUsdcTokenId(senderWallet.blockchain),
      idempotencyKey,
    });

    transaction.markProcessing(circleTransfer.id);

    // 7. If Circle confirms instantly (testnet case)
    if (circleTransfer.status === 'complete') {
      await this.completeTransfer(transaction, senderWallet, recipientWallet, money.amountUsdc);
    } else {
      // Will be completed via webhook
      await this.txRepo.update(transaction);
    }

    logger.info(
      {
        transactionId: transaction.id,
        amountUsdc: money.amountUsdc.toString(),
        from: senderWallet.address,
        to: recipientWallet.address,
      },
      'Transfer initiated'
    );

    return this.toResult(transaction, recipientWallet.address, command.currency);
  }

  private async completeTransfer(
    transaction: Transaction,
    sender: Wallet,
    recipient: Wallet,
    amount: Decimal
  ): Promise<void> {
    // Ledger entries
    const entries = this.ledgerService.createTransferEntries(
      transaction.id,
      sender.id,
      recipient.id,
      amount,
      sender.balance,
      recipient.balance
    );

    // Atomic update
    await this.prisma.$transaction(async (tx) => {
      sender.debit(amount);
      recipient.credit(amount);

      await tx.wallet.update({
        where: { id: sender.id },
        data: { balanceUsdc: sender.balance.toNumber() },
      });

      await tx.wallet.update({
        where: { id: recipient.id },
        data: { balanceUsdc: recipient.balance.toNumber() },
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
  }

  private getUsdcTokenId(blockchain: Blockchain): string {
    return config.usdc.tokenIds[blockchain] ?? config.usdc.tokenIds['POLYGON_AMOY'];
  }

  private toResult(
    tx: Transaction,
    recipientAddress: string,
    currency: Currency
  ): TransferResult {
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
