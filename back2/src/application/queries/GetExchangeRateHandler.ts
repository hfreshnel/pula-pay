import { Currency } from '@prisma/client';
import { ExchangeRateProvider } from '../../domain/ports/ExchangeRateProvider';

export interface GetExchangeRateQuery {
  currencies: Currency[];
}

export interface ExchangeRateItem {
  baseCurrency: string;
  quoteCurrency: Currency;
  rate: string;
  timestamp: string;
  source: string;
}

export interface GetExchangeRateResult {
  rates: ExchangeRateItem[];
}

export class GetExchangeRateHandler {
  constructor(private readonly exchangeRateProvider: ExchangeRateProvider) {}

  async execute(query: GetExchangeRateQuery): Promise<GetExchangeRateResult> {
    const rates = await this.exchangeRateProvider.getRates(query.currencies);

    return {
      rates: Array.from(rates.values()).map((rate) => ({
        baseCurrency: rate.baseCurrency,
        quoteCurrency: rate.quoteCurrency,
        rate: rate.rate.toString(),
        timestamp: rate.timestamp.toISOString(),
        source: rate.source,
      })),
    };
  }
}
