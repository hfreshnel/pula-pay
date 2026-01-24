import { TxType, TxStatus, Currency } from '@prisma/client';
import { TransactionRepository } from '../../domain/ports/repositories/TransactionRepository';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { TransactionNotFoundError } from '../../domain/errors/TransactionNotFoundError';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';

export interface GetTransactionByIdQuery {
  userId: string;
  transactionId: string;
}

export interface GetTransactionByIdResult {
  id: string;
  idempotencyKey: string;
  externalRef: string | null;
  type: TxType;
  status: TxStatus;
  amountUsdc: string;
  feeUsdc: string;
  netAmountUsdc: string;
  exchangeRate: string | null;
  displayCurrency: Currency | null;
  displayAmount: string | null;
  walletId: string;
  counterpartyId: string | null;
  description: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export class GetTransactionByIdHandler {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly txRepo: TransactionRepository
  ) {}

  async execute(query: GetTransactionByIdQuery): Promise<GetTransactionByIdResult> {
    // Get user's wallet to verify ownership
    const wallet = await this.walletRepo.findByUserId(query.userId);
    if (!wallet) {
      throw new WalletNotFoundError(query.userId, 'userId');
    }

    // Find the transaction
    const tx = await this.txRepo.findById(query.transactionId);
    if (!tx) {
      throw new TransactionNotFoundError(query.transactionId, 'id');
    }

    // Verify the transaction belongs to this user's wallet
    // (either as sender or counterparty)
    if (tx.walletId !== wallet.id && tx.counterpartyId !== wallet.id) {
      throw new TransactionNotFoundError(query.transactionId, 'id');
    }

    return {
      id: tx.id,
      idempotencyKey: tx.idempotencyKey,
      externalRef: tx.externalRef,
      type: tx.type,
      status: tx.status,
      amountUsdc: tx.amountUsdc.toString(),
      feeUsdc: tx.feeUsdc.toString(),
      netAmountUsdc: tx.netAmountUsdc.toString(),
      exchangeRate: tx.exchangeRate?.toString() ?? null,
      displayCurrency: tx.displayCurrency,
      displayAmount: tx.displayAmount?.toString() ?? null,
      walletId: tx.walletId,
      counterpartyId: tx.counterpartyId,
      description: tx.description,
      failureReason: tx.failureReason,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
      completedAt: tx.completedAt?.toISOString() ?? null,
    };
  }
}
