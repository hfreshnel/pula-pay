import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { WalletProvider } from '../../domain/ports/WalletProvider';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';
import { logger } from '../../shared/utils/logger';

export interface SyncWalletStatusCommand {
  walletId: string;
}

export interface SyncWalletStatusResult {
  walletId: string;
  previousStatus: string;
  currentStatus: string;
  wasUpdated: boolean;
}

/**
 * Syncs wallet status with Circle
 * Useful for manually fixing wallets stuck in PENDING state
 */
export class SyncWalletStatusHandler {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly walletProvider: WalletProvider
  ) {}

  async execute(command: SyncWalletStatusCommand): Promise<SyncWalletStatusResult> {
    // Find wallet
    const wallet = await this.walletRepo.findById(command.walletId);
    if (!wallet) {
      throw new WalletNotFoundError(command.walletId);
    }

    const previousStatus = wallet.status;

    try {
      // Get wallet details from Circle
      const circleWallet = await this.walletProvider.getWallet(wallet.circleWalletId);

      logger.info(
        { walletId: wallet.id, circleWalletId: wallet.circleWalletId, circleState: circleWallet.state },
        'Retrieved wallet status from Circle'
      );

      // Update wallet status based on Circle state
      if (circleWallet.state === 'LIVE' && wallet.isPending()) {
        wallet.activate();
        await this.walletRepo.update(wallet);

        logger.info(
          { walletId: wallet.id, circleWalletId: wallet.circleWalletId },
          'Wallet status synced: PENDING -> ACTIVE'
        );

        return {
          walletId: wallet.id,
          previousStatus,
          currentStatus: wallet.status,
          wasUpdated: true,
        };
      }

      logger.info(
        { walletId: wallet.id, status: wallet.status, circleState: circleWallet.state },
        'Wallet status already in sync'
      );

      return {
        walletId: wallet.id,
        previousStatus,
        currentStatus: wallet.status,
        wasUpdated: false,
      };
    } catch (error) {
      logger.error(
        { error, walletId: wallet.id, circleWalletId: wallet.circleWalletId },
        'Failed to sync wallet status with Circle'
      );
      throw error;
    }
  }
}
