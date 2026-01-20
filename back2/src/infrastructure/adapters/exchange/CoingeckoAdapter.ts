import axios, { AxiosInstance } from 'axios';
import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';
import { ExchangeRateProvider, ExchangeRateResult } from '../../../domain/ports/ExchangeRateProvider';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/utils/logger';

// CoinGecko currency IDs
const CURRENCY_MAP: Record<Currency, string> = {
  EUR: 'eur',
  USD: 'usd',
  XOF: 'xof',
};

interface CoingeckoResponse {
  'usd-coin': {
    [key: string]: number;
  };
}

/**
 * CoinGecko adapter for exchange rates
 */
export class CoingeckoAdapter implements ExchangeRateProvider {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      headers: config.exchangeRate.coingeckoApiKey
        ? { 'x-cg-demo-api-key': config.exchangeRate.coingeckoApiKey }
        : {},
    });
  }

  async getRate(currency: Currency): Promise<ExchangeRateResult> {
    const rates = await this.getRates([currency]);
    const rate = rates.get(currency);

    if (!rate) {
      throw new Error(`Failed to get exchange rate for ${currency}`);
    }

    return rate;
  }

  async getRates(currencies: Currency[]): Promise<Map<Currency, ExchangeRateResult>> {
    const vsCurrencies = currencies.map((c) => CURRENCY_MAP[c]).join(',');

    try {
      const response = await this.client.get<CoingeckoResponse>('/simple/price', {
        params: {
          ids: 'usd-coin',
          vs_currencies: vsCurrencies,
        },
      });

      const results = new Map<Currency, ExchangeRateResult>();
      const usdcPrices = response.data['usd-coin'];
      const timestamp = new Date();

      for (const currency of currencies) {
        const geckoKey = CURRENCY_MAP[currency];
        const price = usdcPrices[geckoKey];

        if (price) {
          results.set(currency, {
            baseCurrency: 'USDC',
            quoteCurrency: currency,
            rate: new Decimal(price),
            timestamp,
            source: 'coingecko',
          });
        }
      }

      // XOF is not directly available on CoinGecko, calculate from EUR
      // 1 EUR = 655.957 XOF (fixed rate)
      if (currencies.includes('XOF') && !results.has('XOF')) {
        const eurRate = results.get('EUR');
        if (eurRate) {
          const xofRate = eurRate.rate.mul(655.957);
          results.set('XOF', {
            baseCurrency: 'USDC',
            quoteCurrency: 'XOF',
            rate: xofRate,
            timestamp,
            source: 'coingecko-derived',
          });
        }
      }

      logger.debug({ currencies, rates: Object.fromEntries(results) }, 'Exchange rates fetched');

      return results;
    } catch (error) {
      logger.error({ error, currencies }, 'Failed to fetch exchange rates');
      throw error;
    }
  }
}
