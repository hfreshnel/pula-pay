import { Currency } from '@prisma/client';
import { QuoteProvider, OfframpQuoteResult } from '../../domain/ports/QuoteProvider';

export interface GetOfframpQuoteQuery {
  sellAmount: number;
  cashoutCurrency: Currency;
  country: string;
  paymentMethod?: string;
}

export class GetOfframpQuoteHandler {
  constructor(private readonly quoteProvider: QuoteProvider) {}

  async execute(query: GetOfframpQuoteQuery): Promise<OfframpQuoteResult> {
    return this.quoteProvider.getOfframpQuote({
      sellCurrency: 'USDC',
      sellAmount: query.sellAmount,
      cashoutCurrency: query.cashoutCurrency,
      paymentMethod: query.paymentMethod ?? 'ACH_BANK_ACCOUNT',
      country: query.country,
    });
  }
}
