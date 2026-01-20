import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';
import { ExchangeRateProvider } from '../../domain/ports/ExchangeRateProvider';
import { Money } from '../../domain/value-objects/Money';

export interface ConversionResult {
  amountUsdc: Decimal;
  displayAmount: Decimal;
  displayCurrency: Currency;
  exchangeRate: Decimal;
}

/**
 * Service for currency conversion operations
 */
export class CurrencyConversionService {
  constructor(private readonly exchangeRateProvider: ExchangeRateProvider) {}

  /**
   * Convert fiat amount to USDC
   */
  async fiatToUsdc(
    fiatAmount: number | Decimal,
    fiatCurrency: Currency
  ): Promise<ConversionResult> {
    const rate = await this.exchangeRateProvider.getRate(fiatCurrency);
    const money = Money.fromFiat(fiatAmount, fiatCurrency, rate.rate);

    return {
      amountUsdc: money.amountUsdc,
      displayAmount: money.displayAmount,
      displayCurrency: fiatCurrency,
      exchangeRate: rate.rate,
    };
  }

  /**
   * Convert USDC to fiat for display
   */
  async usdcToFiat(
    amountUsdc: number | Decimal,
    targetCurrency: Currency
  ): Promise<ConversionResult> {
    const rate = await this.exchangeRateProvider.getRate(targetCurrency);
    const money = Money.fromUsdc(amountUsdc, targetCurrency, rate.rate);

    return {
      amountUsdc: money.amountUsdc,
      displayAmount: money.displayAmount,
      displayCurrency: targetCurrency,
      exchangeRate: rate.rate,
    };
  }

  /**
   * Get conversion preview (both directions)
   */
  async getConversionPreview(
    amount: number | Decimal,
    fromCurrency: Currency | 'USDC',
    toCurrency: Currency | 'USDC'
  ): Promise<{
    inputAmount: string;
    inputCurrency: string;
    outputAmount: string;
    outputCurrency: string;
    exchangeRate: string;
  }> {
    if (fromCurrency === 'USDC' && toCurrency !== 'USDC') {
      const result = await this.usdcToFiat(amount, toCurrency);
      return {
        inputAmount: result.amountUsdc.toString(),
        inputCurrency: 'USDC',
        outputAmount: result.displayAmount.toString(),
        outputCurrency: toCurrency,
        exchangeRate: result.exchangeRate.toString(),
      };
    } else if (fromCurrency !== 'USDC' && toCurrency === 'USDC') {
      const result = await this.fiatToUsdc(amount, fromCurrency);
      return {
        inputAmount: result.displayAmount.toString(),
        inputCurrency: fromCurrency,
        outputAmount: result.amountUsdc.toString(),
        outputCurrency: 'USDC',
        exchangeRate: result.exchangeRate.toString(),
      };
    }

    throw new Error('Invalid conversion: both currencies cannot be the same type');
  }
}
