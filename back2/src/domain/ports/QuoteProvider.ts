import { Currency } from '@prisma/client';

export interface OnrampQuoteParams {
  purchaseCurrency: string; // e.g., 'USDC'
  paymentAmount: number;
  paymentCurrency: Currency; // USD, EUR
  paymentMethod: string; // 'CARD', 'ACH_BANK_ACCOUNT', etc.
  country: string; // ISO 3166-1 two-letter code
}

export interface OnrampQuoteResult {
  quoteId: string;
  purchaseAmount: string; // Crypto amount user will receive
  paymentSubtotal: string;
  coinbaseFee: string;
  networkFee: string;
  paymentTotal: string; // Total fiat user pays
}

export interface OfframpQuoteParams {
  sellCurrency: string; // e.g., 'USDC'
  sellAmount: number;
  cashoutCurrency: Currency; // USD, EUR
  paymentMethod: string;
  country: string;
}

export interface OfframpQuoteResult {
  quoteId: string;
  sellAmount: string;
  cashoutSubtotal: string;
  cashoutTotal: string; // Net fiat user receives
  coinbaseFee: string;
}

/**
 * Port for getting fee preview quotes before committing to a transaction
 */
export interface QuoteProvider {
  getOnrampQuote(params: OnrampQuoteParams): Promise<OnrampQuoteResult>;
  getOfframpQuote(params: OfframpQuoteParams): Promise<OfframpQuoteResult>;
}
