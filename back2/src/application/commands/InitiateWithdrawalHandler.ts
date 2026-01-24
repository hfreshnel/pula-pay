import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { TransactionRepository } from '../../domain/ports/repositories/TransactionRepository';
import { OnRampProvider } from '../../domain/ports/OnRampProvider';
import { ExchangeRateProvider } from '../../domain/ports/ExchangeRateProvider';
import { Transaction } from '../../domain/entities/Transaction';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';
import { generateIdempotencyKey } from '../../shared/utils/idempotency';
import { logger } from '../../shared/utils/logger';

export interface InitiateWithdrawalCommand {
  userId: string;
  phoneNumber: string;
  fiatAmount: number;  // Amount in fiat currency
  fiatCurrency: Currency;  // Target fiat currency (e.g., XOF, EUR)
  idempotencyKey?: string;
}

export interface InitiateWithdrawalResult {
  transactionId: string;
  providerRef: string;
  status: string;
  amountUsdc: string;
  feeUsdc: string;
  displayAmount: string;
  displayCurrency: Currency;
}

export class InitiateWithdrawalHandler {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: TransactionRepository,
    private readonly onRampProvider: OnRampProvider,
    private readonly exchangeRateProvider: ExchangeRateProvider
  ) {}

  async execute(command: InitiateWithdrawalCommand): Promise<InitiateWithdrawalResult> {
    const idempotencyKey = command.idempotencyKey ?? generateIdempotencyKey();

    // 1. Check idempotency
    const existing = await this.txRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.toResult(existing);
    }

    // 2. Get wallet
    const wallet = await this.walletRepo.findByUserId(command.userId);
    if (!wallet) {
      throw new WalletNotFoundError(command.userId, 'userId');
    }

    // 3. Get exchange rate and convert fiat to USDC
    const rate = await this.exchangeRateProvider.getRate(command.fiatCurrency);
    const fiatAmount = new Decimal(command.fiatAmount);
    const amountUsdc = fiatAmount.div(rate.rate).toDecimalPlaces(6);

    // 4. Calculate fee (1.5% for withdrawals)
    const fee = amountUsdc.mul(0.015).toDecimalPlaces(6);
    const totalRequired = amountUsdc.add(fee);

    // 5. Validate balance
    wallet.assertCanWithdraw(totalRequired);

    // 6. Create PENDING transaction
    const transaction = await this.txRepo.create({
      idempotencyKey,
      type: 'WITHDRAWAL_OFFRAMP',
      status: 'PENDING',
      amountUsdc,
      feeUsdc: fee,
      exchangeRate: rate.rate,
      displayCurrency: command.fiatCurrency,
      displayAmount: fiatAmount,
      walletId: wallet.id,
    });

    // 7. Initiate MoMo payout
    const payoutResult = await this.onRampProvider.initiatePayout({
      userId: command.userId,
      phoneNumber: command.phoneNumber,
      amount: fiatAmount.toNumber(),
      currency: command.fiatCurrency,
      idempotencyKey,
    });

    // 8. Create OnRampTransaction (used for off-ramp too)
    await this.txRepo.createOnRampDetails({
      transactionId: transaction.id,
      provider: this.onRampProvider.providerCode,
      providerRef: payoutResult.providerRef,
      fiatCurrency: command.fiatCurrency,
      fiatAmount: fiatAmount,
      providerStatus: payoutResult.status,
    });

    // 9. Update status → PROCESSING
    transaction.markProcessing(payoutResult.providerRef);
    await this.txRepo.update(transaction);

    logger.info(
      {
        transactionId: transaction.id,
        providerRef: payoutResult.providerRef,
        amountUsdc: amountUsdc.toString(),
        fee: fee.toString(),
      },
      'Withdrawal initiated'
    );

    // 10. Start background polling as fallback for callbacks
    if (this.onRampProvider.startPayoutPolling) {
      this.onRampProvider.startPayoutPolling(
        payoutResult.providerRef,
        async (pollResult) => {
          await this.handlePollingResult(transaction.id, pollResult);
        }
      );
    }

    return this.toResult(transaction, payoutResult.providerRef);
  }

  private async handlePollingResult(
    transactionId: string,
    pollResult: { status: 'pending' | 'processing' | 'completed' | 'failed' }
  ): Promise<void> {
    const transaction = await this.txRepo.findById(transactionId);
    if (!transaction) {
      logger.warn({ transactionId }, 'Transaction not found during polling callback');
      return;
    }

    // Skip if already in terminal state
    if (transaction.status === 'COMPLETED' || transaction.status === 'FAILED') {
      logger.debug({ transactionId, status: transaction.status }, 'Transaction already in terminal state');
      return;
    }

    if (pollResult.status === 'completed') {
      transaction.complete();
      await this.txRepo.update(transaction);

      // Debit wallet (amount + fee)
      const wallet = await this.walletRepo.findById(transaction.walletId);
      if (wallet) {
        const totalDebit = transaction.amountUsdc.add(transaction.feeUsdc);
        wallet.debit(totalDebit);
        await this.walletRepo.update(wallet);
      }

      logger.info({ transactionId }, 'Withdrawal completed via polling fallback');
    } else if (pollResult.status === 'failed') {
      transaction.fail('Payout failed or rejected');
      await this.txRepo.update(transaction);
      logger.info({ transactionId }, 'Withdrawal failed via polling fallback');
    }
  }

  private toResult(tx: Transaction, providerRef?: string): InitiateWithdrawalResult {
    return {
      transactionId: tx.id,
      providerRef: providerRef ?? tx.externalRef ?? '',
      status: tx.status,
      amountUsdc: tx.amountUsdc.toString(),
      feeUsdc: tx.feeUsdc.toString(),
      displayAmount: tx.displayAmount?.toString() ?? '0',
      displayCurrency: tx.displayCurrency ?? 'XOF',
    };
  }
}
