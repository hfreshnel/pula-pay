import Decimal from 'decimal.js';
import { DomainError } from './DomainError';

export class LedgerImbalanceError extends DomainError {
  public readonly transactionId: string;
  public readonly imbalance: Decimal;

  constructor(transactionId: string, imbalance: Decimal) {
    super(
      `Ledger entries for transaction ${transactionId} are not balanced. Imbalance: ${imbalance.toString()} USDC`,
      'LEDGER_IMBALANCE'
    );
    this.transactionId = transactionId;
    this.imbalance = imbalance;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      transactionId: this.transactionId,
      imbalance: this.imbalance.toString(),
    };
  }
}
