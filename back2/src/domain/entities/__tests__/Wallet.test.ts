import Decimal from 'decimal.js';
import { Wallet } from '../Wallet';
import { InsufficientFundsError } from '../../errors/InsufficientFundsError';
import { WalletFrozenError } from '../../errors/WalletFrozenError';
import { createWallet, createWalletProps, walletFixtures } from '../../../__tests__/fixtures';

describe('Wallet Entity', () => {
  describe('constructor and getters', () => {
    it('should create wallet with all properties', () => {
      const props = createWalletProps();
      const wallet = new Wallet(props);

      expect(wallet.id).toBe(props.id);
      expect(wallet.userId).toBe(props.userId);
      expect(wallet.circleWalletId).toBe(props.circleWalletId);
      expect(wallet.walletSetId).toBe(props.walletSetId);
      expect(wallet.address).toBe(props.address);
      expect(wallet.blockchain).toBe(props.blockchain);
      expect(wallet.status).toBe(props.status);
      expect(wallet.balance.eq(props.balanceUsdc)).toBe(true);
      expect(wallet.createdAt).toEqual(props.createdAt);
      expect(wallet.updatedAt).toEqual(props.updatedAt);
    });

    it('should initialize balance as Decimal', () => {
      const wallet = createWallet({ balanceUsdc: new Decimal('100.123456') });
      expect(wallet.balance instanceof Decimal).toBe(true);
      expect(wallet.balance.toString()).toBe('100.123456');
    });
  });

  describe('status checks', () => {
    it('should return true for isActive when status is ACTIVE', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(wallet.isActive()).toBe(true);
      expect(wallet.isPending()).toBe(false);
      expect(wallet.isFrozen()).toBe(false);
      expect(wallet.isClosed()).toBe(false);
    });

    it('should return true for isPending when status is PENDING', () => {
      const wallet = walletFixtures.pending();
      expect(wallet.isPending()).toBe(true);
      expect(wallet.isActive()).toBe(false);
    });

    it('should return true for isFrozen when status is FROZEN', () => {
      const wallet = walletFixtures.frozen();
      expect(wallet.isFrozen()).toBe(true);
      expect(wallet.isActive()).toBe(false);
    });

    it('should return true for isClosed when status is CLOSED', () => {
      const wallet = walletFixtures.closed();
      expect(wallet.isClosed()).toBe(true);
      expect(wallet.isActive()).toBe(false);
    });
  });

  describe('canTransact', () => {
    it('should return true for ACTIVE wallet', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(wallet.canTransact()).toBe(true);
    });

    it('should return false for PENDING wallet', () => {
      const wallet = walletFixtures.pending();
      expect(wallet.canTransact()).toBe(false);
    });

    it('should return false for FROZEN wallet', () => {
      const wallet = walletFixtures.frozen();
      expect(wallet.canTransact()).toBe(false);
    });

    it('should return false for CLOSED wallet', () => {
      const wallet = walletFixtures.closed();
      expect(wallet.canTransact()).toBe(false);
    });
  });

  describe('canReceive', () => {
    it('should return true for ACTIVE wallet', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(wallet.canReceive()).toBe(true);
    });

    it('should return true for PENDING wallet', () => {
      const wallet = walletFixtures.pending();
      expect(wallet.canReceive()).toBe(true);
    });

    it('should return false for FROZEN wallet', () => {
      const wallet = walletFixtures.frozen();
      expect(wallet.canReceive()).toBe(false);
    });

    it('should return false for CLOSED wallet', () => {
      const wallet = walletFixtures.closed();
      expect(wallet.canReceive()).toBe(false);
    });
  });

  describe('canWithdraw', () => {
    it('should return true when active and has sufficient balance', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(wallet.canWithdraw(new Decimal('100'))).toBe(true);
    });

    it('should return true when withdrawing exact balance', () => {
      const wallet = createWallet({ balanceUsdc: new Decimal('50'), status: 'ACTIVE' });
      expect(wallet.canWithdraw(new Decimal('50'))).toBe(true);
    });

    it('should return false when insufficient balance', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(wallet.canWithdraw(new Decimal('1000'))).toBe(false);
    });

    it('should return false when wallet is frozen', () => {
      const wallet = walletFixtures.frozen();
      expect(wallet.canWithdraw(new Decimal('10'))).toBe(false);
    });
  });

  describe('assertCanTransact', () => {
    it('should not throw for ACTIVE wallet', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(() => wallet.assertCanTransact()).not.toThrow();
    });

    it('should throw WalletFrozenError for FROZEN wallet', () => {
      const wallet = walletFixtures.frozen();
      expect(() => wallet.assertCanTransact()).toThrow(WalletFrozenError);
    });

    it('should throw WalletFrozenError for PENDING wallet', () => {
      const wallet = walletFixtures.pending();
      expect(() => wallet.assertCanTransact()).toThrow(WalletFrozenError);
    });

    it('should throw WalletFrozenError for CLOSED wallet', () => {
      const wallet = walletFixtures.closed();
      expect(() => wallet.assertCanTransact()).toThrow(WalletFrozenError);
    });
  });

  describe('assertCanWithdraw', () => {
    it('should not throw when active and has sufficient balance', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(() => wallet.assertCanWithdraw(new Decimal('50'))).not.toThrow();
    });

    it('should throw InsufficientFundsError when insufficient balance', () => {
      const wallet = walletFixtures.activeWithBalance();
      expect(() => wallet.assertCanWithdraw(new Decimal('1000'))).toThrow(InsufficientFundsError);
    });

    it('should throw WalletFrozenError before checking balance', () => {
      const wallet = walletFixtures.frozen();
      expect(() => wallet.assertCanWithdraw(new Decimal('1'))).toThrow(WalletFrozenError);
    });
  });

  describe('balance operations', () => {
    describe('credit', () => {
      it('should increase balance', () => {
        const wallet = createWallet({ balanceUsdc: new Decimal('100'), status: 'ACTIVE' });

        const newBalance = wallet.credit(new Decimal('50'));

        expect(newBalance.eq(new Decimal('150'))).toBe(true);
        expect(wallet.balance.eq(new Decimal('150'))).toBe(true);
      });

      it('should handle small amounts with precision', () => {
        const wallet = createWallet({ balanceUsdc: new Decimal('0'), status: 'ACTIVE' });

        wallet.credit(new Decimal('0.000001'));

        expect(wallet.balance.eq(new Decimal('0.000001'))).toBe(true);
      });

      it('should throw error for negative credit amount', () => {
        const wallet = walletFixtures.activeWithBalance();

        expect(() => wallet.credit(new Decimal('-10'))).toThrow('Credit amount must be positive');
      });

      it('should update updatedAt timestamp', () => {
        const wallet = walletFixtures.activeWithBalance();
        const oldUpdatedAt = wallet.updatedAt;

        wallet.credit(new Decimal('10'));

        expect(wallet.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });
    });

    describe('debit', () => {
      it('should decrease balance', () => {
        const wallet = createWallet({ balanceUsdc: new Decimal('100'), status: 'ACTIVE' });

        const newBalance = wallet.debit(new Decimal('30'));

        expect(newBalance.eq(new Decimal('70'))).toBe(true);
        expect(wallet.balance.eq(new Decimal('70'))).toBe(true);
      });

      it('should allow debiting entire balance', () => {
        const wallet = createWallet({ balanceUsdc: new Decimal('100'), status: 'ACTIVE' });

        const newBalance = wallet.debit(new Decimal('100'));

        expect(newBalance.eq(new Decimal('0'))).toBe(true);
      });

      it('should throw InsufficientFundsError when debiting more than balance', () => {
        const wallet = createWallet({ balanceUsdc: new Decimal('100'), status: 'ACTIVE' });

        expect(() => wallet.debit(new Decimal('150'))).toThrow(InsufficientFundsError);
      });

      it('should throw WalletFrozenError when wallet is frozen', () => {
        const wallet = walletFixtures.frozen();

        expect(() => wallet.debit(new Decimal('10'))).toThrow(WalletFrozenError);
      });
    });

    describe('syncBalance', () => {
      it('should set balance directly', () => {
        const wallet = createWallet({ balanceUsdc: new Decimal('100') });

        wallet.syncBalance(new Decimal('500'));

        expect(wallet.balance.eq(new Decimal('500'))).toBe(true);
      });

      it('should allow setting zero balance', () => {
        const wallet = createWallet({ balanceUsdc: new Decimal('100') });

        wallet.syncBalance(new Decimal('0'));

        expect(wallet.balance.eq(new Decimal('0'))).toBe(true);
      });

      it('should update updatedAt timestamp', () => {
        const wallet = createWallet();
        const oldUpdatedAt = wallet.updatedAt;

        wallet.syncBalance(new Decimal('100'));

        expect(wallet.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });
    });
  });

  describe('status transitions', () => {
    describe('activate', () => {
      it('should transition from PENDING to ACTIVE', () => {
        const wallet = walletFixtures.pending();

        wallet.activate();

        expect(wallet.status).toBe('ACTIVE');
      });

      it('should throw error when activating from ACTIVE', () => {
        const wallet = walletFixtures.activeWithBalance();

        expect(() => wallet.activate()).toThrow('Cannot activate wallet from status: ACTIVE');
      });

      it('should throw error when activating from FROZEN', () => {
        const wallet = walletFixtures.frozen();

        expect(() => wallet.activate()).toThrow('Cannot activate wallet from status: FROZEN');
      });
    });

    describe('freeze', () => {
      it('should transition from ACTIVE to FROZEN', () => {
        const wallet = walletFixtures.activeWithBalance();

        wallet.freeze();

        expect(wallet.status).toBe('FROZEN');
      });

      it('should throw error when freezing from PENDING', () => {
        const wallet = walletFixtures.pending();

        expect(() => wallet.freeze()).toThrow('Cannot freeze wallet from status: PENDING');
      });

      it('should throw error when freezing from FROZEN', () => {
        const wallet = walletFixtures.frozen();

        expect(() => wallet.freeze()).toThrow('Cannot freeze wallet from status: FROZEN');
      });
    });

    describe('unfreeze', () => {
      it('should transition from FROZEN to ACTIVE', () => {
        const wallet = walletFixtures.frozen();

        wallet.unfreeze();

        expect(wallet.status).toBe('ACTIVE');
      });

      it('should throw error when unfreezing from ACTIVE', () => {
        const wallet = walletFixtures.activeWithBalance();

        expect(() => wallet.unfreeze()).toThrow('Cannot unfreeze wallet from status: ACTIVE');
      });
    });

    describe('close', () => {
      it('should transition to CLOSED when balance is zero', () => {
        const wallet = walletFixtures.activeZeroBalance();

        wallet.close();

        expect(wallet.status).toBe('CLOSED');
      });

      it('should throw error when closing with non-zero balance', () => {
        const wallet = walletFixtures.activeWithBalance();

        expect(() => wallet.close()).toThrow('Cannot close wallet with non-zero balance');
      });
    });
  });

  describe('getWalletAddress', () => {
    it('should return WalletAddress value object', () => {
      const wallet = walletFixtures.activeWithBalance();

      const walletAddress = wallet.getWalletAddress();

      expect(walletAddress.address).toBe(wallet.address.toLowerCase());
      expect(walletAddress.blockchain).toBe(wallet.blockchain);
    });
  });

  describe('getDisplayBalance', () => {
    it('should return Money value object with converted amount', () => {
      const wallet = createWallet({ balanceUsdc: new Decimal('100') });
      const exchangeRate = new Decimal('0.92');

      const money = wallet.getDisplayBalance('EUR', exchangeRate);

      expect(money.amountUsdc.eq(new Decimal('100'))).toBe(true);
      expect(money.displayCurrency).toBe('EUR');
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const wallet = createWallet();
      const json = wallet.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('userId');
      expect(json).toHaveProperty('address');
      expect(json).toHaveProperty('blockchain');
      expect(json).toHaveProperty('status');
      expect(json).toHaveProperty('balanceUsdc');
      expect(typeof json.balanceUsdc).toBe('string');
      expect(typeof json.createdAt).toBe('string');
    });

    it('should not expose circleWalletId in JSON', () => {
      const wallet = createWallet();
      const json = wallet.toJSON();

      expect(json).not.toHaveProperty('circleWalletId');
      expect(json).not.toHaveProperty('walletSetId');
    });

    it('should return persistence format with all properties', () => {
      const wallet = createWallet();
      const persistence = wallet.toPersistence();

      expect(persistence).toHaveProperty('circleWalletId');
      expect(persistence).toHaveProperty('walletSetId');
      expect(persistence.balanceUsdc instanceof Decimal).toBe(true);
    });
  });
});
