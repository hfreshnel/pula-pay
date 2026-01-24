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
    const apiKey = config.exchangeRate.coingeckoApiKey;
    const isValidApiKey = apiKey && !apiKey.includes('api_key_from');

    this.client = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      headers: isValidApiKey
        ? { 'x-cg-demo-api-key': apiKey }
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
    // XOF is not supported by CoinGecko, so we need to fetch EUR and convert
    const needsXof = currencies.includes('XOF');
    const currenciesToFetch = currencies.filter((c) => c !== 'XOF');

    // If XOF is requested, ensure EUR is fetched for conversion
    if (needsXof && !currenciesToFetch.includes('EUR')) {
      currenciesToFetch.push('EUR');
    }

    const results = new Map<Currency, ExchangeRateResult>();
    const timestamp = new Date();

    // Only call CoinGecko if there are currencies to fetch
    if (currenciesToFetch.length > 0) {
      const vsCurrencies = currenciesToFetch.map((c) => CURRENCY_MAP[c]).join(',');

      try {
        const response = await this.client.get<CoingeckoResponse>('/simple/price', {
          params: {
            ids: 'usd-coin',
            vs_currencies: vsCurrencies,
          },
        });

        const usdcPrices = response.data['usd-coin'];

        for (const currency of currenciesToFetch) {
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
      } catch (error) {
        logger.error({ error, currencies: currenciesToFetch }, 'Failed to fetch exchange rates from CoinGecko');
        throw error;
      }
    }

    // XOF is not directly available on CoinGecko, calculate from EUR
    // 1 EUR = 655.957 XOF (fixed rate from CFA Franc peg)
    if (needsXof) {
      const eurRate = results.get('EUR');
      if (eurRate) {
        const xofRate = eurRate.rate.mul(config.exchangeRate.xofEurFixedRate);
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
  }
}
