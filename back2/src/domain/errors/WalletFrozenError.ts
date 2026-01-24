import { WalletStatus } from '@prisma/client';
import { DomainError } from './DomainError';

export class WalletFrozenError extends DomainError {
  public readonly walletId: string;
  public readonly status: WalletStatus;

  constructor(walletId: string, status: WalletStatus) {
    super(
      `Wallet ${walletId} cannot transact. Current status: ${status}`,
      'WALLET_FROZEN'
    );
    this.walletId = walletId;
    this.status = status;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      walletId: this.walletId,
      status: this.status,
    };
  }
}
