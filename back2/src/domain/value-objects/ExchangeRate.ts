import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';

/**
 * Value Object representing an exchange rate with timestamp
 */
export class ExchangeRate {
  private constructor(
    public readonly baseCurrency: 'USDC',
    public readonly quoteCurrency: Currency,
    public readonly rate: Decimal,
    public readonly timestamp: Date,
    public readonly source: string
  ) {
    Object.freeze(this);
  }

  /**
   * Create a new exchange rate
   */
  static create(
    quoteCurrency: Currency,
    rate: Decimal | string | number,
    source: string,
    timestamp?: Date
  ): ExchangeRate {
    const rateDecimal = new Decimal(rate);

    if (rateDecimal.lte(0)) {
      throw new Error('Exchange rate must be positive');
    }

    return new ExchangeRate(
      'USDC',
      quoteCurrency,
      rateDecimal,
      timestamp ?? new Date(),
      source
    );
  }

  /**
   * Convert USDC amount to quote currency
   */
  convertFromUsdc(amountUsdc: Decimal | string | number): Decimal {
    return new Decimal(amountUsdc).mul(this.rate).toDecimalPlaces(2);
  }

  /**
   * Convert quote currency amount to USDC
   */
  convertToUsdc(amountFiat: Decimal | string | number): Decimal {
    return new Decimal(amountFiat).div(this.rate).toDecimalPlaces(6);
  }

  /**
   * Check if rate is still valid (not expired)
   */
  isValid(ttlMinutes: number): boolean {
    const now = new Date();
    const expiresAt = new Date(this.timestamp.getTime() + ttlMinutes * 60 * 1000);
    return now < expiresAt;
  }

  /**
   * Get age in minutes
   */
  ageMinutes(): number {
    const now = new Date();
    return (now.getTime() - this.timestamp.getTime()) / (60 * 1000);
  }

  /**
   * Format rate for display
   */
  toDisplayString(): string {
    return `1 USDC = ${this.rate.toFixed(4)} ${this.quoteCurrency}`;
  }

  toJSON() {
    return {
      baseCurrency: this.baseCurrency,
      quoteCurrency: this.quoteCurrency,
      rate: this.rate.toString(),
      timestamp: this.timestamp.toISOString(),
      source: this.source,
    };
  }
}
