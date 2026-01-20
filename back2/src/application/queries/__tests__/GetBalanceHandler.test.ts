import Decimal from 'decimal.js';
import { GetBalanceHandler, GetBalanceQuery } from '../GetBalanceHandler';
import { UserNotFoundError } from '../../../domain/errors/UserNotFoundError';
import { WalletNotFoundError } from '../../../domain/errors/WalletNotFoundError';
import {
  createMockUserRepository,
  createMockWalletRepository,
} from '../../../__tests__/mocks/repositories.mock';
import { createMockExchangeRateProvider } from '../../../__tests__/mocks/adapters.mock';
import { userFixtures, walletFixtures, createWallet, createWalletProps } from '../../../__tests__/fixtures';

describe('GetBalanceHandler', () => {
  let handler: GetBalanceHandler;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockWalletRepo: ReturnType<typeof createMockWalletRepository>;
  let mockExchangeRateProvider: ReturnType<typeof createMockExchangeRateProvider>;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    mockWalletRepo = createMockWalletRepository();
    mockExchangeRateProvider = createMockExchangeRateProvider();

    handler = new GetBalanceHandler(mockUserRepo, mockWalletRepo, mockExchangeRateProvider);
  });

  describe('execute', () => {
    it('should return balance with user preferred currency', async () => {
      // Arrange
      const user = userFixtures.basicKyc(); // EUR preference
      const wallet = createWallet(
        createWalletProps({
          userId: user.id,
          balanceUsdc: new Decimal('100'),
          status: 'ACTIVE',
        })
      );

      const query: GetBalanceQuery = {
        userId: user.id,
      };

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: new Decimal('0.92'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.walletId).toBe(wallet.id);
      expect(result.address).toBe(wallet.address);
      expect(result.balanceUsdc).toBe('100');
      expect(result.displayCurrency).toBe('EUR');
      expect(result.exchangeRate).toBe('0.92');
      expect(result.status).toBe('ACTIVE');
    });

    it('should convert balance to display currency', async () => {
      // Arrange
      const user = userFixtures.basicKyc();
      const wallet = createWallet(
        createWalletProps({
          userId: user.id,
          balanceUsdc: new Decimal('100'),
          status: 'ACTIVE',
        })
      );

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: new Decimal('0.92'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute({ userId: user.id });

      // Assert
      // 100 USDC * 0.92 = 92 EUR
      expect(parseFloat(result.displayBalance)).toBe(92);
    });

    it('should use provided displayCurrency over user preference', async () => {
      // Arrange
      const user = userFixtures.basicKyc(); // EUR preference
      const wallet = createWallet(
        createWalletProps({
          userId: user.id,
          balanceUsdc: new Decimal('100'),
        })
      );

      const query: GetBalanceQuery = {
        userId: user.id,
        displayCurrency: 'XOF', // Override to XOF
      };

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'XOF',
        rate: new Decimal('603.45'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.displayCurrency).toBe('XOF');
      expect(mockExchangeRateProvider.getRate).toHaveBeenCalledWith('XOF');
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      // Arrange
      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute({ userId: 'non-existent' })).rejects.toThrow(
        UserNotFoundError
      );
      expect(mockWalletRepo.findByUserId).not.toHaveBeenCalled();
    });

    it('should throw WalletNotFoundError when wallet does not exist', async () => {
      // Arrange
      const user = userFixtures.basicKyc();

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute({ userId: user.id })).rejects.toThrow(
        WalletNotFoundError
      );
      expect(mockExchangeRateProvider.getRate).not.toHaveBeenCalled();
    });

    it('should return zero balance correctly', async () => {
      // Arrange
      const user = userFixtures.basicKyc();
      const wallet = walletFixtures.activeZeroBalance();

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: new Decimal('0.92'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute({ userId: user.id });

      // Assert
      expect(result.balanceUsdc).toBe('0');
      expect(parseFloat(result.displayBalance)).toBe(0);
    });

    it('should handle XOF currency with user preference', async () => {
      // Arrange
      const user = userFixtures.xofCurrency(); // XOF preference
      const wallet = createWallet(
        createWalletProps({
          userId: user.id,
          balanceUsdc: new Decimal('100'),
        })
      );

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'XOF',
        rate: new Decimal('603.45'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute({ userId: user.id });

      // Assert
      expect(result.displayCurrency).toBe('XOF');
      // 100 USDC * 603.45 = 60345 XOF
      expect(parseFloat(result.displayBalance)).toBe(60345);
    });

    it('should return wallet status', async () => {
      // Arrange
      const user = userFixtures.basicKyc();
      const frozenWallet = walletFixtures.frozen();

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(frozenWallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: new Decimal('0.92'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute({ userId: user.id });

      // Assert
      expect(result.status).toBe('FROZEN');
    });

    it('should handle large balance precision', async () => {
      // Arrange
      const user = userFixtures.basicKyc();
      const wallet = walletFixtures.largeBalance(); // 10000 USDC

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: new Decimal('0.92'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute({ userId: user.id });

      // Assert
      expect(result.balanceUsdc).toBe('10000');
      // 10000 USDC * 0.92 = 9200 EUR
      expect(parseFloat(result.displayBalance)).toBe(9200);
    });

    it('should handle small balance precision', async () => {
      // Arrange
      const user = userFixtures.basicKyc();
      const wallet = walletFixtures.smallBalance(); // 0.000001 USDC

      mockUserRepo.findById.mockResolvedValue(user);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: new Decimal('0.92'),
        timestamp: new Date(),
        source: 'coingecko',
      });

      // Act
      const result = await handler.execute({ userId: user.id });

      // Assert
      expect(result.balanceUsdc).toBe('0.000001');
    });
  });
});
