import Decimal from 'decimal.js';
import { InitiateDepositHandler, InitiateDepositCommand } from '../InitiateDepositHandler';
import { WalletNotFoundError } from '../../../domain/errors/WalletNotFoundError';
import { WalletFrozenError } from '../../../domain/errors/WalletFrozenError';
import {
  createMockWalletRepository,
  createMockTransactionRepository,
} from '../../../__tests__/mocks/repositories.mock';
import {
  createMockOnRampProvider,
  createMockExchangeRateProvider,
} from '../../../__tests__/mocks/adapters.mock';
import { walletFixtures, transactionFixtures } from '../../../__tests__/fixtures';

describe('InitiateDepositHandler', () => {
  let handler: InitiateDepositHandler;
  let mockWalletRepo: ReturnType<typeof createMockWalletRepository>;
  let mockTxRepo: ReturnType<typeof createMockTransactionRepository>;
  let mockOnRampProvider: ReturnType<typeof createMockOnRampProvider>;
  let mockExchangeRateProvider: ReturnType<typeof createMockExchangeRateProvider>;

  beforeEach(() => {
    mockWalletRepo = createMockWalletRepository();
    mockTxRepo = createMockTransactionRepository();
    mockOnRampProvider = createMockOnRampProvider();
    mockExchangeRateProvider = createMockExchangeRateProvider();

    handler = new InitiateDepositHandler(
      mockWalletRepo,
      mockTxRepo,
      mockOnRampProvider,
      mockExchangeRateProvider
    );
  });

  describe('execute', () => {
    const baseCommand: InitiateDepositCommand = {
      userId: 'user-123',
      phoneNumber: '+22501234567',
      fiatAmount: 10000,
      fiatCurrency: 'XOF',
    };

    it('should initiate deposit successfully', async () => {
      // Arrange
      const wallet = walletFixtures.activeWithBalance();

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'XOF',
        rate: new Decimal('603.45'),
        timestamp: new Date(),
        source: 'coingecko',
      });
      mockTxRepo.create.mockResolvedValue(transactionFixtures.pendingDeposit());
      mockOnRampProvider.initiateDeposit.mockResolvedValue({
        providerRef: 'momo-ref-123',
        status: 'pending',
      });
      mockTxRepo.createOnRampDetails.mockResolvedValue(undefined);
      mockTxRepo.update.mockResolvedValue(transactionFixtures.processingDeposit());

      // Act
      const result = await handler.execute(baseCommand);

      // Assert
      expect(result.transactionId).toBeDefined();
      expect(result.providerRef).toBe('momo-ref-123');
      expect(result.status).toBe('PROCESSING');
      expect(result.displayCurrency).toBe('XOF');
    });

    it('should convert fiat amount to USDC using exchange rate', async () => {
      // Arrange
      const wallet = walletFixtures.activeWithBalance();

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'XOF',
        rate: new Decimal('603.45'),
        timestamp: new Date(),
        source: 'coingecko',
      });
      mockTxRepo.create.mockResolvedValue(transactionFixtures.pendingDeposit());
      mockOnRampProvider.initiateDeposit.mockResolvedValue({
        providerRef: 'momo-ref-123',
        status: 'pending',
      });
      mockTxRepo.createOnRampDetails.mockResolvedValue(undefined);
      mockTxRepo.update.mockResolvedValue(transactionFixtures.processingDeposit());

      // Act
      await handler.execute(baseCommand);

      // Assert
      expect(mockTxRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amountUsdc: expect.any(Decimal),
          displayAmount: expect.any(Decimal),
          displayCurrency: 'XOF',
        })
      );

      // 10000 XOF / 603.45 ≈ 16.57 USDC
      const createCall = mockTxRepo.create.mock.calls[0][0];
      expect(createCall.amountUsdc.toDecimalPlaces(2).toNumber()).toBeCloseTo(16.57, 1);
    });

    it('should throw WalletNotFoundError when wallet does not exist', async () => {
      // Arrange
      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(baseCommand)).rejects.toThrow(WalletNotFoundError);
      expect(mockOnRampProvider.initiateDeposit).not.toHaveBeenCalled();
    });

    it('should throw WalletFrozenError when wallet is frozen', async () => {
      // Arrange
      const frozenWallet = walletFixtures.frozen();

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(frozenWallet);

      // Act & Assert
      await expect(handler.execute(baseCommand)).rejects.toThrow(WalletFrozenError);
      expect(mockOnRampProvider.initiateDeposit).not.toHaveBeenCalled();
    });

    it('should return existing transaction if idempotencyKey already used', async () => {
      // Arrange
      const existingTx = transactionFixtures.processingDeposit();

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(existingTx);

      const commandWithKey: InitiateDepositCommand = {
        ...baseCommand,
        idempotencyKey: 'existing-key',
      };

      // Act
      const result = await handler.execute(commandWithKey);

      // Assert
      expect(result.transactionId).toBe(existingTx.id);
      expect(mockWalletRepo.findByUserId).not.toHaveBeenCalled();
      expect(mockOnRampProvider.initiateDeposit).not.toHaveBeenCalled();
    });

    it('should create transaction in PENDING status initially', async () => {
      // Arrange
      const wallet = walletFixtures.activeWithBalance();

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'XOF',
        rate: new Decimal('603.45'),
        timestamp: new Date(),
        source: 'coingecko',
      });
      mockTxRepo.create.mockResolvedValue(transactionFixtures.pendingDeposit());
      mockOnRampProvider.initiateDeposit.mockResolvedValue({
        providerRef: 'momo-ref-123',
        status: 'pending',
      });
      mockTxRepo.createOnRampDetails.mockResolvedValue(undefined);
      mockTxRepo.update.mockResolvedValue(transactionFixtures.processingDeposit());

      // Act
      await handler.execute(baseCommand);

      // Assert
      expect(mockTxRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DEPOSIT_ONRAMP',
          status: 'PENDING',
          walletId: wallet.id,
        })
      );
    });

    it('should create OnRamp details after initiating deposit', async () => {
      // Arrange
      const wallet = walletFixtures.activeWithBalance();
      const pendingTx = transactionFixtures.pendingDeposit();

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'XOF',
        rate: new Decimal('603.45'),
        timestamp: new Date(),
        source: 'coingecko',
      });
      mockTxRepo.create.mockResolvedValue(pendingTx);
      mockOnRampProvider.initiateDeposit.mockResolvedValue({
        providerRef: 'momo-ref-xyz',
        status: 'pending',
      });
      mockTxRepo.createOnRampDetails.mockResolvedValue(undefined);
      mockTxRepo.update.mockResolvedValue(transactionFixtures.processingDeposit());

      // Act
      await handler.execute(baseCommand);

      // Assert
      expect(mockTxRepo.createOnRampDetails).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: pendingTx.id,
          providerRef: 'momo-ref-xyz',
          fiatCurrency: 'XOF',
        })
      );
    });

    it('should update transaction to PROCESSING after MoMo call', async () => {
      // Arrange
      const wallet = walletFixtures.activeWithBalance();
      const pendingTx = transactionFixtures.pendingDeposit();

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'XOF',
        rate: new Decimal('603.45'),
        timestamp: new Date(),
        source: 'coingecko',
      });
      mockTxRepo.create.mockResolvedValue(pendingTx);
      mockOnRampProvider.initiateDeposit.mockResolvedValue({
        providerRef: 'momo-ref-123',
        status: 'pending',
      });
      mockTxRepo.createOnRampDetails.mockResolvedValue(undefined);
      mockTxRepo.update.mockResolvedValue(transactionFixtures.processingDeposit());

      // Act
      await handler.execute(baseCommand);

      // Assert
      expect(mockTxRepo.update).toHaveBeenCalled();
      // The transaction should have been marked processing
    });

    it('should handle EUR currency', async () => {
      // Arrange
      const wallet = walletFixtures.activeWithBalance();
      const eurCommand: InitiateDepositCommand = {
        userId: 'user-123',
        phoneNumber: '+22501234567',
        fiatAmount: 100,
        fiatCurrency: 'EUR',
      };

      mockTxRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockWalletRepo.findByUserId.mockResolvedValue(wallet);
      mockExchangeRateProvider.getRate.mockResolvedValue({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: new Decimal('0.92'),
        timestamp: new Date(),
        source: 'coingecko',
      });
      mockTxRepo.create.mockResolvedValue(transactionFixtures.eurTransaction());
      mockOnRampProvider.initiateDeposit.mockResolvedValue({
        providerRef: 'momo-ref-123',
        status: 'pending',
      });
      mockTxRepo.createOnRampDetails.mockResolvedValue(undefined);
      mockTxRepo.update.mockResolvedValue(transactionFixtures.eurTransaction());

      // Act
      const result = await handler.execute(eurCommand);

      // Assert
      expect(result.displayCurrency).toBe('EUR');

      // 100 EUR / 0.92 ≈ 108.70 USDC
      const createCall = mockTxRepo.create.mock.calls[0][0];
      expect(createCall.amountUsdc.toDecimalPlaces(2).toNumber()).toBeCloseTo(108.7, 1);
    });
  });
});
