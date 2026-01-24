import Decimal from 'decimal.js';
import { DomainError } from './DomainError';

export class InsufficientFundsError extends DomainError {
  public readonly walletId: string;
  public readonly available: Decimal;
  public readonly requested: Decimal;

  constructor(walletId: string, available: Decimal, requested: Decimal) {
    super(
      `Insufficient funds in wallet ${walletId}. Available: ${available.toString()} USDC, Requested: ${requested.toString()} USDC`,
      'INSUFFICIENT_FUNDS'
    );
    this.walletId = walletId;
    this.available = available;
    this.requested = requested;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      walletId: this.walletId,
      available: this.available.toString(),
      requested: this.requested.toString(),
    };
  }
}
