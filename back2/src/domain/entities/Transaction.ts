import Decimal from 'decimal.js';
import { TxType, TxStatus, Currency } from '@prisma/client';
import { InvalidTransactionStateError } from '../errors/InvalidTransactionStateError';

export interface TransactionProps {
  id: string;
  idempotencyKey: string;
  externalRef: string | null;
  type: TxType;
  status: TxStatus;
  amountUsdc: Decimal;
  feeUsdc: Decimal;
  exchangeRate: Decimal | null;
  displayCurrency: Currency | null;
  displayAmount: Decimal | null;
  walletId: string;
  counterpartyId: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

// Valid state transitions
const VALID_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED', 'EXPIRED', 'FAILED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: [], // Terminal
  FAILED: [], // Terminal
  CANCELLED: [], // Terminal
  EXPIRED: [], // Terminal
};

/**
 * Transaction entity with state machine
 */
export class Transaction {
  constructor(private props: TransactionProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }
  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }
  get externalRef(): string | null {
    return this.props.externalRef;
  }
  get type(): TxType {
    return this.props.type;
  }
  get status(): TxStatus {
    return this.props.status;
  }
  get amountUsdc(): Decimal {
    return this.props.amountUsdc;
  }
  get feeUsdc(): Decimal {
    return this.props.feeUsdc;
  }
  get exchangeRate(): Decimal | null {
    return this.props.exchangeRate;
  }
  get displayCurrency(): Currency | null {
    return this.props.displayCurrency;
  }
  get displayAmount(): Decimal | null {
    return this.props.displayAmount;
  }
  get walletId(): string {
    return this.props.walletId;
  }
  get counterpartyId(): string | null {
    return this.props.counterpartyId;
  }
  get description(): string | null {
    return this.props.description;
  }
  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }
  get failureReason(): string | null {
    return this.props.failureReason;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  // Computed values
  get netAmountUsdc(): Decimal {
    return this.props.amountUsdc.sub(this.props.feeUsdc);
  }

  // Status checks
  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  isProcessing(): boolean {
    return this.props.status === 'PROCESSING';
  }

  isCompleted(): boolean {
    return this.props.status === 'COMPLETED';
  }

  isFailed(): boolean {
    return this.props.status === 'FAILED';
  }

  isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  isExpired(): boolean {
    return this.props.status === 'EXPIRED';
  }

  isTerminal(): boolean {
    return ['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(this.props.status);
  }

  // Type checks
  isDeposit(): boolean {
    return ['DEPOSIT_ONRAMP', 'DEPOSIT_CRYPTO'].includes(this.props.type);
  }

  isWithdrawal(): boolean {
    return ['WITHDRAWAL_OFFRAMP', 'WITHDRAWAL_CRYPTO'].includes(this.props.type);
  }

  isTransfer(): boolean {
    return this.props.type === 'TRANSFER_P2P';
  }

  // State transitions
  private transitionTo(newStatus: TxStatus): void {
    const validNext = VALID_TRANSITIONS[this.props.status];
    if (!validNext.includes(newStatus)) {
      throw new InvalidTransactionStateError(this.props.id, this.props.status, newStatus);
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  markProcessing(externalRef?: string): void {
    this.transitionTo('PROCESSING');
    if (externalRef) {
      this.props.externalRef = externalRef;
    }
  }

  complete(): void {
    this.transitionTo('COMPLETED');
    this.props.completedAt = new Date();
  }

  fail(reason: string): void {
    this.transitionTo('FAILED');
    this.props.failureReason = reason;
  }

  cancel(): void {
    this.transitionTo('CANCELLED');
  }

  expire(): void {
    this.transitionTo('EXPIRED');
  }

  // Metadata
  setMetadata(key: string, value: unknown): void {
    this.props.metadata = {
      ...this.props.metadata,
      [key]: value,
    };
    this.props.updatedAt = new Date();
  }

  setFee(fee: Decimal): void {
    if (this.isTerminal()) {
      throw new Error('Cannot modify fee on terminal transaction');
    }
    this.props.feeUsdc = fee;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      idempotencyKey: this.props.idempotencyKey,
      externalRef: this.props.externalRef,
      type: this.props.type,
      status: this.props.status,
      amountUsdc: this.props.amountUsdc.toString(),
      feeUsdc: this.props.feeUsdc.toString(),
      netAmountUsdc: this.netAmountUsdc.toString(),
      exchangeRate: this.props.exchangeRate?.toString() ?? null,
      displayCurrency: this.props.displayCurrency,
      displayAmount: this.props.displayAmount?.toString() ?? null,
      walletId: this.props.walletId,
      counterpartyId: this.props.counterpartyId,
      description: this.props.description,
      failureReason: this.props.failureReason,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      completedAt: this.props.completedAt?.toISOString() ?? null,
    };
  }

  toPersistence(): TransactionProps {
    return { ...this.props };
  }
}
