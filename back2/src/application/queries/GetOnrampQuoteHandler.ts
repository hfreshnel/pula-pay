import { Currency } from '@prisma/client';
import { QuoteProvider, OnrampQuoteResult } from '../../domain/ports/QuoteProvider';

export interface GetOnrampQuoteQuery {
  paymentAmount: number;
  paymentCurrency: Currency;
  country: string;
  paymentMethod?: string;
}

export class GetOnrampQuoteHandler {
  constructor(private readonly quoteProvider: QuoteProvider) {}

  async execute(query: GetOnrampQuoteQuery): Promise<OnrampQuoteResult> {
    return this.quoteProvider.getOnrampQuote({
      purchaseCurrency: 'USDC',
      paymentAmount: query.paymentAmount,
      paymentCurrency: query.paymentCurrency,
      paymentMethod: query.paymentMethod ?? 'CARD',
      country: query.country,
    });
  }
}
