import { Blockchain } from '@prisma/client';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';

export interface GetWalletAddressQuery {
  userId: string;
}

export interface GetWalletAddressResult {
  walletId: string;
  address: string;
  blockchain: Blockchain;
  status: string;
}

export class GetWalletAddressHandler {
  constructor(private readonly walletRepo: WalletRepository) {}

  async execute(query: GetWalletAddressQuery): Promise<GetWalletAddressResult> {
    const wallet = await this.walletRepo.findByUserId(query.userId);
    if (!wallet) {
      throw new WalletNotFoundError(query.userId, 'userId');
    }

    return {
      walletId: wallet.id,
      address: wallet.address,
      blockchain: wallet.blockchain,
      status: wallet.status,
    };
  }
}
