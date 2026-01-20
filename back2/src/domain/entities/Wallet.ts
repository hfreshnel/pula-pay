import Decimal from 'decimal.js';
import { WalletStatus, Blockchain, Currency } from '@prisma/client';
import { Money } from '../value-objects/Money';
import { WalletAddress } from '../value-objects/WalletAddress';
import { InsufficientFundsError } from '../errors/InsufficientFundsError';
import { WalletFrozenError } from '../errors/WalletFrozenError';

export interface WalletProps {
  id: string;
  userId: string;
  circleWalletId: string;
  walletSetId: string;
  address: string;
  blockchain: Blockchain;
  status: WalletStatus;
  balanceUsdc: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Wallet entity with Circle integration
 */
export class Wallet {
  private _balance: Decimal;

  constructor(private props: WalletProps) {
    this._balance = new Decimal(props.balanceUsdc);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }
  get userId(): string {
    return this.props.userId;
  }
  get circleWalletId(): string {
    return this.props.circleWalletId;
  }
  get walletSetId(): string {
    return this.props.walletSetId;
  }
  get address(): string {
    return this.props.address;
  }
  get blockchain(): Blockchain {
    return this.props.blockchain;
  }
  get status(): WalletStatus {
    return this.props.status;
  }
  get balance(): Decimal {
    return this._balance;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Wallet address as value object
  getWalletAddress(): WalletAddress {
    return WalletAddress.fromTrusted(this.props.address, this.props.blockchain);
  }

  // Status checks
  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  isFrozen(): boolean {
    return this.props.status === 'FROZEN';
  }

  isClosed(): boolean {
    return this.props.status === 'CLOSED';
  }

  canTransact(): boolean {
    return this.isActive();
  }

  canReceive(): boolean {
    return this.isActive() || this.isPending();
  }

  canWithdraw(amount: Decimal): boolean {
    return this.canTransact() && this._balance.gte(amount);
  }

  // Assertions
  assertCanTransact(): void {
    if (!this.canTransact()) {
      throw new WalletFrozenError(this.props.id, this.props.status);
    }
  }

  assertCanWithdraw(amount: Decimal): void {
    this.assertCanTransact();
    if (!this._balance.gte(amount)) {
      throw new InsufficientFundsError(this.props.id, this._balance, amount);
    }
  }

  // Balance operations
  credit(amount: Decimal): Decimal {
    if (amount.lt(0)) {
      throw new Error('Credit amount must be positive');
    }
    this._balance = this._balance.add(amount);
    this.props.balanceUsdc = this._balance;
    this.props.updatedAt = new Date();
    return this._balance;
  }

  debit(amount: Decimal): Decimal {
    this.assertCanWithdraw(amount);
    this._balance = this._balance.sub(amount);
    this.props.balanceUsdc = this._balance;
    this.props.updatedAt = new Date();
    return this._balance;
  }

  // Set balance directly (for sync with Circle)
  syncBalance(balance: Decimal): void {
    this._balance = balance;
    this.props.balanceUsdc = balance;
    this.props.updatedAt = new Date();
  }

  // Status transitions
  activate(): void {
    if (this.props.status !== 'PENDING') {
      throw new Error(`Cannot activate wallet from status: ${this.props.status}`);
    }
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  freeze(): void {
    if (this.props.status !== 'ACTIVE') {
      throw new Error(`Cannot freeze wallet from status: ${this.props.status}`);
    }
    this.props.status = 'FROZEN';
    this.props.updatedAt = new Date();
  }

  unfreeze(): void {
    if (this.props.status !== 'FROZEN') {
      throw new Error(`Cannot unfreeze wallet from status: ${this.props.status}`);
    }
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  close(): void {
    if (!this._balance.eq(0)) {
      throw new Error('Cannot close wallet with non-zero balance');
    }
    this.props.status = 'CLOSED';
    this.props.updatedAt = new Date();
  }

  // Display helpers
  getDisplayBalance(displayCurrency: Currency, exchangeRate: Decimal): Money {
    return Money.fromUsdc(this._balance, displayCurrency, exchangeRate);
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      address: this.props.address,
      blockchain: this.props.blockchain,
      status: this.props.status,
      balanceUsdc: this._balance.toString(),
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  toPersistence(): WalletProps {
    return {
      ...this.props,
      balanceUsdc: this._balance,
    };
  }
}
