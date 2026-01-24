import { DomainError } from './DomainError';

export class WalletNotFoundError extends DomainError {
  public readonly identifier: string;
  public readonly identifierType: 'id' | 'userId' | 'address' | 'phone';

  constructor(identifier: string, identifierType: 'id' | 'userId' | 'address' | 'phone' = 'id') {
    super(
      `Wallet not found for ${identifierType}: ${identifier}`,
      'WALLET_NOT_FOUND'
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
