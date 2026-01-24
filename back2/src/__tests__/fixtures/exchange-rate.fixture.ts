import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';
import { ExchangeRate } from '@domain/value-objects/ExchangeRate';

// Standard exchange rates for testing
export const exchangeRates = {
  // USDC/EUR rate (1 USDC ≈ 0.92 EUR)
  usdcToEur: (): ExchangeRate =>
    ExchangeRate.create('EUR' as Currency, new Decimal('0.92'), 'coingecko'),

  // USDC/XOF rate (1 USDC ≈ 603.45 XOF)
  usdcToXof: (): ExchangeRate =>
    ExchangeRate.create('XOF' as Currency, new Decimal('603.45'), 'coingecko'),

  // USDC/USD rate (1 USDC ≈ 1.00 USD - stablecoin)
  usdcToUsd: (): ExchangeRate =>
    ExchangeRate.create('USD' as Currency, new Decimal('1.00'), 'coingecko'),

  // Expired rate (for testing cache expiry)
  expiredEurRate: (): ExchangeRate =>
    ExchangeRate.create(
      'EUR' as Currency,
      new Decimal('0.91'),
      'coingecko',
      new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    ),

  // Fresh rate (just fetched)
  freshXofRate: (): ExchangeRate =>
    ExchangeRate.create('XOF' as Currency, new Decimal('605.00'), 'coingecko', new Date()),

  // Rate from different source
  alternativeSourceRate: (): ExchangeRate =>
    ExchangeRate.create('EUR' as Currency, new Decimal('0.93'), 'binance'),
};

// Rate map for mocking exchange rate provider
export const createRateMap = (): Map<Currency, ExchangeRate> => {
  const map = new Map<Currency, ExchangeRate>();
  map.set('EUR', exchangeRates.usdcToEur());
  map.set('XOF', exchangeRates.usdcToXof());
  map.set('USD', exchangeRates.usdcToUsd());
  return map;
};

// Helper to get rate for a currency
export const getRateForCurrency = (currency: Currency): Decimal => {
  switch (currency) {
    case 'EUR':
      return new Decimal('0.92');
    case 'XOF':
      return new Decimal('603.45');
    case 'USD':
      return new Decimal('1.00');
    default:
      throw new Error(`Unknown currency: ${currency}`);
  }
};
