import { PrismaClient, Prisma } from '@prisma/client';
import { TransactionRepository } from '../../domain/ports/repositories/TransactionRepository';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { LedgerService } from '../../domain/services/LedgerService';
import { TransactionNotFoundError } from '../../domain/errors/TransactionNotFoundError';
import { logger } from '../../shared/utils/logger';

export interface ConfirmDepositCommand {
  providerRef: string;
  providerStatus: 'success' | 'failed';
  metadata?: Record<string, unknown>;
}

export class ConfirmDepositHandler {
  private ledgerService = new LedgerService();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly txRepo: TransactionRepository,
    private readonly walletRepo: WalletRepository,
  ) {}

  async execute(command: ConfirmDepositCommand): Promise<void> {
    // 1. Find transaction
    const transaction = await this.txRepo.findByExternalRef(command.providerRef);
    if (!transaction) {
      throw new TransactionNotFoundError(command.providerRef, 'externalRef');
    }

    // 2. Check state
    if (!transaction.isProcessing()) {
      logger.info(
        { transactionId: transaction.id, status: transaction.status },
        'Transaction already processed'
      );
      return;
    }

    // 3. Handle failure
    if (command.providerStatus === 'failed') {
      transaction.fail('Provider payment failed');
      await this.txRepo.update(transaction);
      await this.txRepo.updateOnRampStatus(transaction.id, 'failed', command.metadata);
      logger.info({ transactionId: transaction.id }, 'Deposit failed');
      return;
    }

    // 4. Success: Get wallet and balance
    const wallet = await this.walletRepo.findById(transaction.walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // 5. Calculate fees (1%)
    const fee = transaction.amountUsdc.mul(0.01).toDecimalPlaces(6);
    const netAmount = transaction.amountUsdc.sub(fee);

    // 6. Create ledger entries
    const entries = this.ledgerService.createDepositEntries(
      transaction.id,
      wallet.id,
      transaction.amountUsdc,
      fee,
      wallet.balance
    );

    // 7. Atomic: update wallet + ledger + transaction
    await this.prisma.$transaction(async (tx) => {
      // Update wallet balance
      wallet.credit(netAmount);
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceUsdc: wallet.balance.toNumber() },
      });

      // Persist ledger entries
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

      // Update transaction fee and complete
      transaction.setFee(fee);
      transaction.complete();
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: transaction.status,
          feeUsdc: transaction.feeUsdc.toNumber(),
          completedAt: transaction.completedAt,
        },
      });

      // Update on-ramp status
      await tx.onRampTransaction.update({
        where: { transactionId: transaction.id },
        data: {
          providerStatus: 'completed',
          providerData: (command.metadata as Prisma.InputJsonValue) ?? undefined,
        },
      });
    });

    logger.info(
      {
        transactionId: transaction.id,
        amountUsdc: netAmount.toString(),
        fee: fee.toString(),
      },
      'Deposit confirmed'
    );
  }
}
