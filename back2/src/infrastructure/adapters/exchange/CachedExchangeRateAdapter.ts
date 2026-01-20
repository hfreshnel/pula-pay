import Decimal from 'decimal.js';
import { Currency, PrismaClient } from '@prisma/client';
import { ExchangeRateProvider, ExchangeRateResult } from '../../../domain/ports/ExchangeRateProvider';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/utils/logger';

/**
 * Caching decorator for exchange rate providers
 */
export class CachedExchangeRateAdapter implements ExchangeRateProvider {
  private readonly cacheTtlMs: number;

  constructor(
    private readonly upstream: ExchangeRateProvider,
    private readonly prisma: PrismaClient
  ) {
    this.cacheTtlMs = config.exchangeRate.cacheTtlMinutes * 60 * 1000;
  }

  async getRate(currency: Currency): Promise<ExchangeRateResult> {
    // Check cache
    const cached = await this.getCachedRate(currency);
    if (cached) {
      logger.debug({ currency, source: 'cache' }, 'Exchange rate from cache');
      return cached;
    }

    // Fetch from upstream
    const rate = await this.upstream.getRate(currency);

    // Store in cache
    await this.cacheRate(rate);

    return rate;
  }

  async getRates(currencies: Currency[]): Promise<Map<Currency, ExchangeRateResult>> {
    const results = new Map<Currency, ExchangeRateResult>();
    const missing: Currency[] = [];

    // Check cache for each
    for (const currency of currencies) {
      const cached = await this.getCachedRate(currency);
      if (cached) {
        results.set(currency, cached);
      } else {
        missing.push(currency);
      }
    }

    // Fetch missing from upstream
    if (missing.length > 0) {
      const upstream = await this.upstream.getRates(missing);
      for (const [currency, rate] of upstream) {
        await this.cacheRate(rate);
        results.set(currency, rate);
      }
    }

    return results;
  }

  private async getCachedRate(currency: Currency): Promise<ExchangeRateResult | null> {
    const now = new Date();

    const cached = await this.prisma.exchangeRate.findFirst({
      where: {
        baseCurrency: 'USDC',
        quoteCurrency: currency,
        validUntil: { gt: now },
      },
      orderBy: { validFrom: 'desc' },
    });

    if (!cached) return null;

    return {
      baseCurrency: 'USDC',
      quoteCurrency: currency,
      rate: new Decimal(cached.rate.toString()),
      timestamp: cached.validFrom,
      source: cached.source,
    };
  }

  private async cacheRate(rate: ExchangeRateResult): Promise<void> {
    const validUntil = new Date(Date.now() + this.cacheTtlMs);

    try {
      await this.prisma.exchangeRate.create({
        data: {
          baseCurrency: 'USDC',
          quoteCurrency: rate.quoteCurrency,
          rate: rate.rate.toNumber(),
          source: rate.source,
          validFrom: rate.timestamp,
          validUntil,
        },
      });
    } catch (error) {
      // Ignore duplicate key errors (race condition)
      logger.debug({ error, currency: rate.quoteCurrency }, 'Failed to cache rate');
    }
  }
}
