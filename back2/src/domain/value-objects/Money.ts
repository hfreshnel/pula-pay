import Decimal from 'decimal.js';
import { Currency } from '@prisma/client';

/**
 * Value Object representing money in USDC with display currency conversion
 * Immutable and self-validating
 */
export class Money {
  private constructor(
    public readonly amountUsdc: Decimal,
    public readonly displayCurrency: Currency,
    public readonly displayAmount: Decimal,
    public readonly exchangeRate: Decimal
  ) {
    Object.freeze(this);
  }

  /**
   * Create Money from USDC amount
   */
  static fromUsdc(
    amountUsdc: Decimal | string | number,
    displayCurrency: Currency,
    exchangeRate: Decimal | string | number
  ): Money {
    const usdc = new Decimal(amountUsdc);
    const rate = new Decimal(exchangeRate);
    const displayAmount = usdc.mul(rate).toDecimalPlaces(2);

    return new Money(usdc, displayCurrency, displayAmount, rate);
  }

  /**
   * Create Money from fiat amount (EUR/XOF)
   */
  static fromFiat(
    fiatAmount: Decimal | string | number,
    fiatCurrency: Currency,
    exchangeRate: Decimal | string | number
  ): Money {
    const fiat = new Decimal(fiatAmount);
    const rate = new Decimal(exchangeRate);
    const amountUsdc = fiat.div(rate).toDecimalPlaces(6);

    return new Money(amountUsdc, fiatCurrency, fiat, rate);
  }

  /**
   * Create zero Money
   */
  static zero(displayCurrency: Currency, exchangeRate: Decimal | string | number = 1): Money {
    return Money.fromUsdc(0, displayCurrency, exchangeRate);
  }

  /**
   * Add two Money values (must have same display currency)
   */
  add(other: Money): Money {
    if (this.displayCurrency !== other.displayCurrency) {
      throw new Error('Cannot add Money with different display currencies');
    }
    return Money.fromUsdc(
      this.amountUsdc.add(other.amountUsdc),
      this.displayCurrency,
      this.exchangeRate
    );
  }

  /**
   * Subtract Money value
   */
  subtract(other: Money): Money {
    return Money.fromUsdc(
      this.amountUsdc.sub(other.amountUsdc),
      this.displayCurrency,
      this.exchangeRate
    );
  }

  /**
   * Multiply by a factor
   */
  multiply(factor: Decimal | number): Money {
    return Money.fromUsdc(
      this.amountUsdc.mul(factor),
      this.displayCurrency,
      this.exchangeRate
    );
  }

  /**
   * Calculate percentage
   */
  percentage(percent: number): Money {
    return this.multiply(percent / 100);
  }

  isPositive(): boolean {
    return this.amountUsdc.gt(0);
  }

  isZero(): boolean {
    return this.amountUsdc.eq(0);
  }

  isNegative(): boolean {
    return this.amountUsdc.lt(0);
  }

  gte(other: Money): boolean {
    return this.amountUsdc.gte(other.amountUsdc);
  }

  gt(other: Money): boolean {
    return this.amountUsdc.gt(other.amountUsdc);
  }

  lte(other: Money): boolean {
    return this.amountUsdc.lte(other.amountUsdc);
  }

  lt(other: Money): boolean {
    return this.amountUsdc.lt(other.amountUsdc);
  }

  equals(other: Money): boolean {
    return this.amountUsdc.eq(other.amountUsdc);
  }

  /**
   * Format for display
   */
  toDisplayString(): string {
    const symbols: Record<Currency, string> = {
      EUR: '€',
      XOF: 'FCFA',
      USD: '$',
    };
    const symbol = symbols[this.displayCurrency] || this.displayCurrency;
    return `${this.displayAmount.toFixed(2)} ${symbol}`;
  }

  /**
   * Format USDC amount
   */
  toUsdcString(): string {
    return `${this.amountUsdc.toFixed(6)} USDC`;
  }

  toJSON() {
    return {
      amountUsdc: this.amountUsdc.toString(),
      displayCurrency: this.displayCurrency,
      displayAmount: this.displayAmount.toString(),
      exchangeRate: this.exchangeRate.toString(),
    };
  }
}
