import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { TransactionRepository } from '../../domain/ports/repositories/TransactionRepository';
import { OnRampProvider } from '../../domain/ports/OnRampProvider';
import { ExchangeRateProvider } from '../../domain/ports/ExchangeRateProvider';
import { Transaction } from '../../domain/entities/Transaction';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';
import { generateIdempotencyKey } from '../../shared/utils/idempotency';
import { config } from '../../shared/config';
import { logger } from '../../shared/utils/logger';

export interface InitiateDepositCommand {
  userId: string;
  phoneNumber: string;
  fiatAmount: number;
  fiatCurrency: Currency;
  idempotencyKey?: string;
}

export interface InitiateDepositResult {
  transactionId: string;
  providerRef: string;
  status: string;
  amountUsdc: string;
  displayAmount: string;
  displayCurrency: Currency;
}

export class InitiateDepositHandler {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: TransactionRepository,
    private readonly onRampProvider: OnRampProvider,
    private readonly exchangeRateProvider: ExchangeRateProvider
  ) {}

  async execute(command: InitiateDepositCommand): Promise<InitiateDepositResult> {
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
    wallet.assertCanTransact();

    // 3. Get exchange rate
    const rate = await this.exchangeRateProvider.getRate(command.fiatCurrency);
    const amountUsdc = new Decimal(command.fiatAmount).div(rate.rate).toDecimalPlaces(6);

    // 4. Create PENDING transaction
    const transaction = await this.txRepo.create({
      idempotencyKey,
      type: 'DEPOSIT_ONRAMP',
      status: 'PENDING',
      amountUsdc,
      feeUsdc: new Decimal(0), // Fee calculated on confirmation
      exchangeRate: rate.rate,
      displayCurrency: command.fiatCurrency,
      displayAmount: new Decimal(command.fiatAmount),
      walletId: wallet.id,
    });

    // 5. Initiate MoMo collection
    const depositResult = await this.onRampProvider.initiateDeposit({
      userId: command.userId,
      phoneNumber: command.phoneNumber,
      amount: command.fiatAmount,
      currency: command.fiatCurrency,
      idempotencyKey,
      callbackUrl: `${config.apiUrl}/webhooks/momo`,
    });

    // 6. Create OnRampTransaction
    await this.txRepo.createOnRampDetails({
      transactionId: transaction.id,
      provider: this.onRampProvider.providerCode,
      providerRef: depositResult.providerRef,
      fiatCurrency: command.fiatCurrency,
      fiatAmount: new Decimal(command.fiatAmount),
      providerStatus: depositResult.status,
    });

    // 7. Update status → PROCESSING
    transaction.markProcessing(depositResult.providerRef);
    await this.txRepo.update(transaction);

    logger.info(
      {
        transactionId: transaction.id,
        providerRef: depositResult.providerRef,
        amountUsdc: amountUsdc.toString(),
      },
      'Deposit initiated'
    );

    return this.toResult(transaction, depositResult.providerRef);
  }

  private toResult(tx: Transaction, providerRef?: string): InitiateDepositResult {
    return {
      transactionId: tx.id,
      providerRef: providerRef ?? tx.externalRef ?? '',
      status: tx.status,
      amountUsdc: tx.amountUsdc.toString(),
      displayAmount: tx.displayAmount?.toString() ?? '0',
      displayCurrency: tx.displayCurrency ?? 'XOF',
    };
  }
}
