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
  amountUsdc: number;
  targetCurrency: Currency;
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

    // 3. Calculate fee (1.5% for withdrawals)
    const amountUsdc = new Decimal(command.amountUsdc);
    const fee = amountUsdc.mul(0.015).toDecimalPlaces(6);
    const totalRequired = amountUsdc.add(fee);

    // 4. Validate balance
    wallet.assertCanWithdraw(totalRequired);

    // 5. Get exchange rate
    const rate = await this.exchangeRateProvider.getRate(command.targetCurrency);
    const displayAmount = amountUsdc.mul(rate.rate).toDecimalPlaces(2);

    // 6. Create PENDING transaction
    const transaction = await this.txRepo.create({
      idempotencyKey,
      type: 'WITHDRAWAL_OFFRAMP',
      status: 'PENDING',
      amountUsdc,
      feeUsdc: fee,
      exchangeRate: rate.rate,
      displayCurrency: command.targetCurrency,
      displayAmount,
      walletId: wallet.id,
    });

    // 7. Initiate MoMo payout
    const payoutResult = await this.onRampProvider.initiatePayout({
      userId: command.userId,
      phoneNumber: command.phoneNumber,
      amount: displayAmount.toNumber(),
      currency: command.targetCurrency,
      idempotencyKey,
    });

    // 8. Create OnRampTransaction (used for off-ramp too)
    await this.txRepo.createOnRampDetails({
      transactionId: transaction.id,
      provider: this.onRampProvider.providerCode,
      providerRef: payoutResult.providerRef,
      fiatCurrency: command.targetCurrency,
      fiatAmount: displayAmount,
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

    return this.toResult(transaction, payoutResult.providerRef);
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
