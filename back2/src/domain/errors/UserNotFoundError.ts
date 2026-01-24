import { DomainError } from './DomainError';

export class UserNotFoundError extends DomainError {
  public readonly identifier: string;
  public readonly identifierType: 'id' | 'phone' | 'email';

  constructor(identifier: string, identifierType: 'id' | 'phone' | 'email' = 'id') {
    super(
      `User not found for ${identifierType}: ${identifier}`,
      'USER_NOT_FOUND'
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
