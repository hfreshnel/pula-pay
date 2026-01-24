import { Currency } from '@prisma/client';
import { WalletRepository } from '../../domain/ports/repositories/WalletRepository';
import { UserRepository } from '../../domain/ports/repositories/UserRepository';
import { ExchangeRateProvider } from '../../domain/ports/ExchangeRateProvider';
import { WalletNotFoundError } from '../../domain/errors/WalletNotFoundError';
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError';

export interface GetBalanceQuery {
  userId: string;
  displayCurrency?: Currency;
}

export interface GetBalanceResult {
  walletId: string;
  address: string;
  balanceUsdc: string;
  displayBalance: string;
  displayCurrency: Currency;
  exchangeRate: string;
  status: string;
}

export class GetBalanceHandler {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly walletRepo: WalletRepository,
    private readonly exchangeRateProvider: ExchangeRateProvider
  ) {}

  async execute(query: GetBalanceQuery): Promise<GetBalanceResult> {
    // Get user for preferred currency
    const user = await this.userRepo.findById(query.userId);
    if (!user) {
      throw new UserNotFoundError(query.userId);
    }

    // Get wallet
    const wallet = await this.walletRepo.findByUserId(query.userId);
    if (!wallet) {
      throw new WalletNotFoundError(query.userId, 'userId');
    }

    // Use provided currency or user preference
    const displayCurrency = query.displayCurrency ?? user.displayCurrency;

    // Get exchange rate
    const rate = await this.exchangeRateProvider.getRate(displayCurrency);

    // Calculate display balance
    const displayMoney = wallet.getDisplayBalance(displayCurrency, rate.rate);

    return {
      walletId: wallet.id,
      address: wallet.address,
      balanceUsdc: wallet.balance.toString(),
      displayBalance: displayMoney.displayAmount.toString(),
      displayCurrency,
      exchangeRate: rate.rate.toString(),
      status: wallet.status,
    };
  }
}
