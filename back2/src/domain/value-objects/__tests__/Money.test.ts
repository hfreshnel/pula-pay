import Decimal from 'decimal.js';
import { Money } from '../Money';

describe('Money Value Object', () => {
  describe('fromUsdc', () => {
    it('should create Money from USDC amount with EUR', () => {
      const money = Money.fromUsdc(100, 'EUR', 0.92);

      expect(money.amountUsdc.eq(100)).toBe(true);
      expect(money.displayCurrency).toBe('EUR');
      expect(money.displayAmount.eq(92)).toBe(true);
      expect(money.exchangeRate.eq(0.92)).toBe(true);
    });

    it('should create Money from USDC amount with XOF', () => {
      const money = Money.fromUsdc(100, 'XOF', 603.45);

      expect(money.amountUsdc.eq(100)).toBe(true);
      expect(money.displayCurrency).toBe('XOF');
      expect(money.displayAmount.eq(60345)).toBe(true);
      expect(money.exchangeRate.eq(603.45)).toBe(true);
    });

    it('should accept Decimal input', () => {
      const money = Money.fromUsdc(new Decimal('100.123456'), 'EUR', new Decimal('0.92'));

      expect(money.amountUsdc.eq('100.123456')).toBe(true);
    });

    it('should accept string input', () => {
      const money = Money.fromUsdc('50.5', 'USD', '1.0');

      expect(money.amountUsdc.eq('50.5')).toBe(true);
    });

    it('should round display amount to 2 decimal places', () => {
      const money = Money.fromUsdc(100, 'EUR', 0.923456);

      expect(money.displayAmount.eq('92.35')).toBe(true);
    });
  });

  describe('fromFiat', () => {
    it('should create Money from EUR amount', () => {
      const money = Money.fromFiat(100, 'EUR', 0.92);

      expect(money.displayAmount.eq(100)).toBe(true);
      expect(money.displayCurrency).toBe('EUR');
      expect(money.amountUsdc.toDecimalPlaces(2).eq('108.70')).toBe(true);
    });

    it('should create Money from XOF amount', () => {
      const money = Money.fromFiat(10000, 'XOF', 603.45);

      expect(money.displayAmount.eq(10000)).toBe(true);
      expect(money.displayCurrency).toBe('XOF');
      expect(money.amountUsdc.toDecimalPlaces(2).eq('16.57')).toBe(true);
    });

    it('should round USDC amount to 6 decimal places', () => {
      const money = Money.fromFiat(100, 'EUR', 0.92);

      // The USDC amount should have at most 6 decimal places
      const decimalPlaces = money.amountUsdc.decimalPlaces();
      expect(decimalPlaces).toBeLessThanOrEqual(6);
    });
  });

  describe('zero', () => {
    it('should create zero Money', () => {
      const money = Money.zero('EUR');

      expect(money.amountUsdc.eq(0)).toBe(true);
      expect(money.displayAmount.eq(0)).toBe(true);
      expect(money.isZero()).toBe(true);
    });

    it('should create zero Money with custom exchange rate', () => {
      const money = Money.zero('XOF', 603.45);

      expect(money.exchangeRate.eq(603.45)).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const money = Money.fromUsdc(100, 'EUR', 0.92);

      expect(() => {
        (money as any).amountUsdc = new Decimal(200);
      }).toThrow();
    });
  });

  describe('arithmetic operations', () => {
    describe('add', () => {
      it('should add two Money values with same currency', () => {
        const m1 = Money.fromUsdc(100, 'EUR', 0.92);
        const m2 = Money.fromUsdc(50, 'EUR', 0.92);

        const result = m1.add(m2);

        expect(result.amountUsdc.eq(150)).toBe(true);
      });

      it('should throw error when adding different currencies', () => {
        const m1 = Money.fromUsdc(100, 'EUR', 0.92);
        const m2 = Money.fromUsdc(50, 'XOF', 603.45);

        expect(() => m1.add(m2)).toThrow('Cannot add Money with different display currencies');
      });

      it('should return new instance (immutability)', () => {
        const m1 = Money.fromUsdc(100, 'EUR', 0.92);
        const m2 = Money.fromUsdc(50, 'EUR', 0.92);

        const result = m1.add(m2);

        expect(result).not.toBe(m1);
        expect(m1.amountUsdc.eq(100)).toBe(true); // Original unchanged
      });
    });

    describe('subtract', () => {
      it('should subtract Money values', () => {
        const m1 = Money.fromUsdc(100, 'EUR', 0.92);
        const m2 = Money.fromUsdc(30, 'EUR', 0.92);

        const result = m1.subtract(m2);

        expect(result.amountUsdc.eq(70)).toBe(true);
      });

      it('should allow negative result', () => {
        const m1 = Money.fromUsdc(30, 'EUR', 0.92);
        const m2 = Money.fromUsdc(100, 'EUR', 0.92);

        const result = m1.subtract(m2);

        expect(result.amountUsdc.eq(-70)).toBe(true);
        expect(result.isNegative()).toBe(true);
      });
    });

    describe('multiply', () => {
      it('should multiply by factor', () => {
        const money = Money.fromUsdc(100, 'EUR', 0.92);

        const result = money.multiply(2);

        expect(result.amountUsdc.eq(200)).toBe(true);
      });

      it('should multiply by Decimal', () => {
        const money = Money.fromUsdc(100, 'EUR', 0.92);

        const result = money.multiply(new Decimal('1.5'));

        expect(result.amountUsdc.eq(150)).toBe(true);
      });

      it('should multiply by fraction', () => {
        const money = Money.fromUsdc(100, 'EUR', 0.92);

        const result = money.multiply(0.1);

        expect(result.amountUsdc.eq(10)).toBe(true);
      });
    });

    describe('percentage', () => {
      it('should calculate percentage', () => {
        const money = Money.fromUsdc(100, 'EUR', 0.92);

        const result = money.percentage(10);

        expect(result.amountUsdc.eq(10)).toBe(true);
      });

      it('should calculate 1% correctly', () => {
        const money = Money.fromUsdc(100, 'EUR', 0.92);

        const result = money.percentage(1);

        expect(result.amountUsdc.eq(1)).toBe(true);
      });
    });
  });

  describe('comparison methods', () => {
    describe('isPositive/isZero/isNegative', () => {
      it('should return true for isPositive when amount > 0', () => {
        const money = Money.fromUsdc(100, 'EUR', 0.92);
        expect(money.isPositive()).toBe(true);
        expect(money.isZero()).toBe(false);
        expect(money.isNegative()).toBe(false);
      });

      it('should return true for isZero when amount = 0', () => {
        const money = Money.zero('EUR');
        expect(money.isZero()).toBe(true);
        expect(money.isPositive()).toBe(false);
        expect(money.isNegative()).toBe(false);
      });

      it('should return true for isNegative when amount < 0', () => {
        const money = Money.fromUsdc(-50, 'EUR', 0.92);
        expect(money.isNegative()).toBe(true);
        expect(money.isPositive()).toBe(false);
        expect(money.isZero()).toBe(false);
      });
    });

    describe('gte/gt/lte/lt/equals', () => {
      const m100 = Money.fromUsdc(100, 'EUR', 0.92);
      const m50 = Money.fromUsdc(50, 'EUR', 0.92);
      const m100b = Money.fromUsdc(100, 'EUR', 0.92);

      it('should compare gte correctly', () => {
        expect(m100.gte(m50)).toBe(true);
        expect(m100.gte(m100b)).toBe(true);
        expect(m50.gte(m100)).toBe(false);
      });

      it('should compare gt correctly', () => {
        expect(m100.gt(m50)).toBe(true);
        expect(m100.gt(m100b)).toBe(false);
        expect(m50.gt(m100)).toBe(false);
      });

      it('should compare lte correctly', () => {
        expect(m50.lte(m100)).toBe(true);
        expect(m100.lte(m100b)).toBe(true);
        expect(m100.lte(m50)).toBe(false);
      });

      it('should compare lt correctly', () => {
        expect(m50.lt(m100)).toBe(true);
        expect(m100.lt(m100b)).toBe(false);
        expect(m100.lt(m50)).toBe(false);
      });

      it('should check equals correctly', () => {
        expect(m100.equals(m100b)).toBe(true);
        expect(m100.equals(m50)).toBe(false);
      });
    });
  });

  describe('display formatting', () => {
    it('should format EUR display string', () => {
      const money = Money.fromUsdc(100, 'EUR', 0.92);

      expect(money.toDisplayString()).toBe('92.00 €');
    });

    it('should format XOF display string', () => {
      const money = Money.fromUsdc(100, 'XOF', 603.45);

      expect(money.toDisplayString()).toBe('60345.00 FCFA');
    });

    it('should format USD display string', () => {
      const money = Money.fromUsdc(100, 'USD', 1.0);

      expect(money.toDisplayString()).toBe('100.00 $');
    });

    it('should format USDC string', () => {
      const money = Money.fromUsdc(100.123456, 'EUR', 0.92);

      expect(money.toUsdcString()).toBe('100.123456 USDC');
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const money = Money.fromUsdc(100, 'EUR', 0.92);
      const json = money.toJSON();

      expect(json).toEqual({
        amountUsdc: '100',
        displayCurrency: 'EUR',
        displayAmount: '92',
        exchangeRate: '0.92',
      });
    });

    it('should handle precise decimal values in JSON', () => {
      const money = Money.fromUsdc('100.123456', 'EUR', '0.923456');
      const json = money.toJSON();

      expect(typeof json.amountUsdc).toBe('string');
      expect(typeof json.exchangeRate).toBe('string');
    });
  });
});
