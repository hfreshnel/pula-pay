import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { WalletProvider } from '../../domain/ports/WalletProvider';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';
import { logger } from '../../shared/utils/logger';

export interface ActivateWalletCommand {
  circleWalletId: string;
}

export interface ActivateWalletResult {
  walletId: string;
  status: 'ACTIVE';
  wasAlreadyActive: boolean;
}

export class ActivateWalletHandler {
  constructor(
    private readonly walletRepo: WalletRepository,
    private readonly walletProvider: WalletProvider
  ) {}

  async execute(command: ActivateWalletCommand): Promise<ActivateWalletResult> {
    // Find wallet by Circle wallet ID
    const wallet = await this.walletRepo.findByCircleWalletId(command.circleWalletId);
    if (!wallet) {
      throw new WalletNotFoundError(`Wallet not found: ${command.circleWalletId}`);
    }

    // Check if already active
    if (wallet.isActive()) {
      logger.info(
        { walletId: wallet.id, circleWalletId: command.circleWalletId },
        'Wallet is already active'
      );
      return {
        walletId: wallet.id,
        status: 'ACTIVE',
        wasAlreadyActive: true,
      };
    }

    // Verify with Circle that wallet is actually LIVE
    try {
      // We could fetch wallet details from Circle to verify state
      // For now, we trust the webhook/caller

      // Activate the wallet
      wallet.activate();

      // Persist the change
      await this.walletRepo.update(wallet);

      logger.info(
        { walletId: wallet.id, circleWalletId: command.circleWalletId },
        'Wallet activated successfully'
      );

      return {
        walletId: wallet.id,
        status: 'ACTIVE',
        wasAlreadyActive: false,
      };
    } catch (error) {
      logger.error(
        { error, walletId: wallet.id, circleWalletId: command.circleWalletId },
        'Failed to activate wallet'
      );
      throw error;
    }
  }
}
