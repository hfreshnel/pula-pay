import Decimal from 'decimal.js';
import { ExchangeRate } from '../ExchangeRate';

describe('ExchangeRate Value Object', () => {
  describe('create', () => {
    it('should create exchange rate for EUR', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      expect(rate.baseCurrency).toBe('USDC');
      expect(rate.quoteCurrency).toBe('EUR');
      expect(rate.rate.eq(0.92)).toBe(true);
      expect(rate.source).toBe('coingecko');
      expect(rate.timestamp).toBeInstanceOf(Date);
    });

    it('should create exchange rate for XOF', () => {
      const rate = ExchangeRate.create('XOF', 603.45, 'coingecko');

      expect(rate.quoteCurrency).toBe('XOF');
      expect(rate.rate.eq(603.45)).toBe(true);
    });

    it('should accept Decimal as rate', () => {
      const rate = ExchangeRate.create('EUR', new Decimal('0.923456'), 'coingecko');

      expect(rate.rate.eq('0.923456')).toBe(true);
    });

    it('should accept string as rate', () => {
      const rate = ExchangeRate.create('EUR', '0.92', 'coingecko');

      expect(rate.rate.eq(0.92)).toBe(true);
    });

    it('should use custom timestamp when provided', () => {
      const timestamp = new Date('2026-01-01T10:00:00.000Z');
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko', timestamp);

      expect(rate.timestamp).toEqual(timestamp);
    });

    it('should throw error for zero rate', () => {
      expect(() => ExchangeRate.create('EUR', 0, 'coingecko')).toThrow(
        'Exchange rate must be positive'
      );
    });

    it('should throw error for negative rate', () => {
      expect(() => ExchangeRate.create('EUR', -0.92, 'coingecko')).toThrow(
        'Exchange rate must be positive'
      );
    });
  });

  describe('immutability', () => {
    it('should be frozen (immutable)', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      expect(() => {
        (rate as any).rate = new Decimal(1);
      }).toThrow();
    });
  });

  describe('convertFromUsdc', () => {
    it('should convert USDC to EUR', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      const eur = rate.convertFromUsdc(100);

      expect(eur.eq(92)).toBe(true);
    });

    it('should convert USDC to XOF', () => {
      const rate = ExchangeRate.create('XOF', 603.45, 'coingecko');

      const xof = rate.convertFromUsdc(100);

      expect(xof.eq(60345)).toBe(true);
    });

    it('should accept Decimal input', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      const eur = rate.convertFromUsdc(new Decimal('100.5'));

      expect(eur.toDecimalPlaces(2).eq('92.46')).toBe(true);
    });

    it('should accept string input', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      const eur = rate.convertFromUsdc('100');

      expect(eur.eq(92)).toBe(true);
    });

    it('should round to 2 decimal places', () => {
      const rate = ExchangeRate.create('EUR', 0.923456, 'coingecko');

      const eur = rate.convertFromUsdc(100);

      expect(eur.eq('92.35')).toBe(true);
    });
  });

  describe('convertToUsdc', () => {
    it('should convert EUR to USDC', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      const usdc = rate.convertToUsdc(92);

      expect(usdc.eq(100)).toBe(true);
    });

    it('should convert XOF to USDC', () => {
      const rate = ExchangeRate.create('XOF', 603.45, 'coingecko');

      const usdc = rate.convertToUsdc(10000);

      expect(usdc.toDecimalPlaces(2).eq('16.57')).toBe(true);
    });

    it('should accept Decimal input', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      const usdc = rate.convertToUsdc(new Decimal('100'));

      expect(usdc.toDecimalPlaces(2).eq('108.70')).toBe(true);
    });

    it('should round to 6 decimal places (USDC precision)', () => {
      const rate = ExchangeRate.create('EUR', 0.923456, 'coingecko');

      const usdc = rate.convertToUsdc(100);

      const decimalPlaces = usdc.decimalPlaces();
      expect(decimalPlaces).toBeLessThanOrEqual(6);
    });
  });

  describe('isValid', () => {
    it('should return true for fresh rate', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      expect(rate.isValid(5)).toBe(true);
    });

    it('should return true when within TTL', () => {
      const timestamp = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko', timestamp);

      expect(rate.isValid(5)).toBe(true); // 5 minute TTL
    });

    it('should return false when expired', () => {
      const timestamp = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko', timestamp);

      expect(rate.isValid(5)).toBe(false); // 5 minute TTL
    });

    it('should return false when exactly at TTL boundary', () => {
      const timestamp = new Date(Date.now() - 5 * 60 * 1000); // Exactly 5 minutes ago
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko', timestamp);

      // At exact boundary, it should be expired (strict comparison)
      expect(rate.isValid(5)).toBe(false);
    });
  });

  describe('ageMinutes', () => {
    it('should return 0 for fresh rate', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      expect(rate.ageMinutes()).toBeLessThan(1);
    });

    it('should return approximate age in minutes', () => {
      const timestamp = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko', timestamp);

      const age = rate.ageMinutes();
      expect(age).toBeGreaterThanOrEqual(4.9);
      expect(age).toBeLessThanOrEqual(5.1);
    });
  });

  describe('toDisplayString', () => {
    it('should format EUR rate for display', () => {
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko');

      expect(rate.toDisplayString()).toBe('1 USDC = 0.9200 EUR');
    });

    it('should format XOF rate for display', () => {
      const rate = ExchangeRate.create('XOF', 603.45, 'coingecko');

      expect(rate.toDisplayString()).toBe('1 USDC = 603.4500 XOF');
    });

    it('should format with 4 decimal places', () => {
      const rate = ExchangeRate.create('EUR', 0.923456789, 'coingecko');

      expect(rate.toDisplayString()).toBe('1 USDC = 0.9235 EUR');
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const timestamp = new Date('2026-01-01T10:00:00.000Z');
      const rate = ExchangeRate.create('EUR', 0.92, 'coingecko', timestamp);
      const json = rate.toJSON();

      expect(json).toEqual({
        baseCurrency: 'USDC',
        quoteCurrency: 'EUR',
        rate: '0.92',
        timestamp: '2026-01-01T10:00:00.000Z',
        source: 'coingecko',
      });
    });

    it('should convert rate to string in JSON', () => {
      const rate = ExchangeRate.create('XOF', new Decimal('603.45'), 'coingecko');
      const json = rate.toJSON();

      expect(typeof json.rate).toBe('string');
      expect(json.rate).toBe('603.45');
    });
  });
});
