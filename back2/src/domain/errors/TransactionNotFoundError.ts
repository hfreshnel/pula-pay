import { DomainError } from './DomainError';

export class TransactionNotFoundError extends DomainError {
  public readonly identifier: string;
  public readonly identifierType: 'id' | 'idempotencyKey' | 'externalRef';

  constructor(identifier: string, identifierType: 'id' | 'idempotencyKey' | 'externalRef' = 'id') {
    super(
      `Transaction not found for ${identifierType}: ${identifier}`,
      'TRANSACTION_NOT_FOUND'
    );
    this.identifier = identifier;
    this.identifierType = identifierType;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      identifier: this.identifier,
      identifierType: this.identifierType,
    };
  }
}
