import { Blockchain } from '@prisma/client';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { UserRepository } from '../../domain/ports/repositories/UserRepository';
import { WalletProvider } from '../../domain/ports/WalletProvider';
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError';
import { generateIdempotencyKey } from '../../shared/utils/idempotency';
import { logger } from '../../shared/utils/logger';
import { config } from '../../shared/config';

export interface CreateWalletCommand {
  userId: string;
  blockchain?: Blockchain;
  idempotencyKey?: string;
}

export interface CreateWalletResult {
  walletId: string;
  address: string;
  blockchain: Blockchain;
  status: 'pending' | 'active';
}

export class CreateWalletHandler {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly walletRepo: WalletRepository,
    private readonly walletProvider: WalletProvider
  ) {}

  async execute(command: CreateWalletCommand): Promise<CreateWalletResult> {
    const idempotencyKey = command.idempotencyKey ?? generateIdempotencyKey();
    const blockchain = (command.blockchain ?? config.blockchain.default) as Blockchain;

    // Check if user exists
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new UserNotFoundError(command.userId);
    }

    // Check if wallet already exists
    const existingWallet = await this.walletRepo.findByUserId(command.userId);
    if (existingWallet) {
      logger.info({ userId: command.userId, walletId: existingWallet.id }, 'Wallet already exists');
      return {
        walletId: existingWallet.id,
        address: existingWallet.address,
        blockchain: existingWallet.blockchain,
        status: existingWallet.isActive() ? 'active' : 'pending',
      };
    }

    // Create wallet via Circle
    const circleResult = await this.walletProvider.createWallet({
      userId: command.userId,
      idempotencyKey,
      blockchain,
    });

    // Persist wallet
    const wallet = await this.walletRepo.create({
      userId: command.userId,
      circleWalletId: circleResult.circleWalletId,
      walletSetId: circleResult.walletSetId,
      address: circleResult.address,
      blockchain,
    });

    // If Circle returned LIVE status immediately, activate the wallet
    if (circleResult.status === 'active') {
      wallet.activate();
      await this.walletRepo.update(wallet);
      logger.info(
        { userId: command.userId, walletId: wallet.id, address: wallet.address },
        'Wallet created and immediately activated'
      );
    } else {
      logger.info(
        { userId: command.userId, walletId: wallet.id, address: wallet.address },
        'Wallet created in pending state'
      );
    }

    return {
      walletId: wallet.id,
      address: wallet.address,
      blockchain: wallet.blockchain,
      status: circleResult.status,
    };
  }
}
