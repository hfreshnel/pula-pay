import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';

export interface ExchangeRateResult {
  baseCurrency: 'USDC';
  quoteCurrency: Currency;
  rate: Decimal; // 1 USDC = X EUR/XOF
  timestamp: Date;
  source: string;
}

/**
 * Port for exchange rate providers
 * Implemented by CoingeckoAdapter, CachedExchangeRateAdapter
 */
export interface ExchangeRateProvider {
  /**
   * Get current rate USDC → Currency
   */
  getRate(currency: Currency): Promise<ExchangeRateResult>;

  /**
   * Get multiple rates at once
   */
  getRates(currencies: Currency[]): Promise<Map<Currency, ExchangeRateResult>>;
}
