import { TxStatus } from '@prisma/client';
import { DomainError } from './DomainError';

export class InvalidTransactionStateError extends DomainError {
  public readonly transactionId: string;
  public readonly currentStatus: TxStatus;
  public readonly attemptedStatus: TxStatus;

  constructor(transactionId: string, currentStatus: TxStatus, attemptedStatus: TxStatus) {
    super(
      `Cannot transition transaction ${transactionId} from ${currentStatus} to ${attemptedStatus}`,
      'INVALID_TRANSACTION_STATE'
    );
    this.transactionId = transactionId;
    this.currentStatus = currentStatus;
    this.attemptedStatus = attemptedStatus;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      transactionId: this.transactionId,
      currentStatus: this.currentStatus,
      attemptedStatus: this.attemptedStatus,
    };
  }
}
