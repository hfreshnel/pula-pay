import { KycLevel, Currency } from '@prisma/client';

export interface UserProps {
  id: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  kycLevel: KycLevel;
  kycData: Record<string, unknown> | null;
  displayCurrency: Currency;
  locale: string;
  otpHash: string | null;
  otpExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User entity with KYC and preferences
 */
export class User {
  constructor(private props: UserProps) {}

  // Getters
  get id(): string {
    return this.props.id;
  }
  get phone(): string {
    return this.props.phone;
  }
  get email(): string | null {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get kycLevel(): KycLevel {
    return this.props.kycLevel;
  }
  get kycData(): Record<string, unknown> | null {
    return this.props.kycData;
  }
  get displayCurrency(): Currency {
    return this.props.displayCurrency;
  }
  get locale(): string {
    return this.props.locale;
  }
  get otpHash(): string | null {
    return this.props.otpHash;
  }
  get otpExpiresAt(): Date | null {
    return this.props.otpExpiresAt;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // KYC checks
  hasBasicKyc(): boolean {
    return this.props.kycLevel !== 'NONE';
  }

  hasVerifiedKyc(): boolean {
    return this.props.kycLevel === 'VERIFIED' || this.props.kycLevel === 'ENHANCED';
  }

  hasEnhancedKyc(): boolean {
    return this.props.kycLevel === 'ENHANCED';
  }

  // KYC limits based on level
  getDailyLimit(): number {
    switch (this.props.kycLevel) {
      case 'NONE':
        return 0;
      case 'BASIC':
        return 100; // 100 USDC
      case 'VERIFIED':
        return 1000; // 1000 USDC
      case 'ENHANCED':
        return 10000; // 10000 USDC
      default:
        return 0;
    }
  }

  getMonthlyLimit(): number {
    return this.getDailyLimit() * 30;
  }

  // OTP management
  setOtp(hash: string, expiresAt: Date): void {
    this.props.otpHash = hash;
    this.props.otpExpiresAt = expiresAt;
    this.props.updatedAt = new Date();
  }

  clearOtp(): void {
    this.props.otpHash = null;
    this.props.otpExpiresAt = null;
    this.props.updatedAt = new Date();
  }

  isOtpValid(): boolean {
    if (!this.props.otpHash || !this.props.otpExpiresAt) {
      return false;
    }
    return new Date() < this.props.otpExpiresAt;
  }

  // Preferences
  updateDisplayCurrency(currency: Currency): void {
    this.props.displayCurrency = currency;
    this.props.updatedAt = new Date();
  }

  updateLocale(locale: string): void {
    this.props.locale = locale;
    this.props.updatedAt = new Date();
  }

  updateEmail(email: string): void {
    this.props.email = email;
    this.props.updatedAt = new Date();
  }

  // KYC upgrade
  upgradeKyc(level: KycLevel, data?: Record<string, unknown>): void {
    const levels: KycLevel[] = ['NONE', 'BASIC', 'VERIFIED', 'ENHANCED'];
    const currentIndex = levels.indexOf(this.props.kycLevel);
    const newIndex = levels.indexOf(level);

    if (newIndex <= currentIndex) {
      throw new Error(`Cannot downgrade KYC from ${this.props.kycLevel} to ${level}`);
    }

    this.props.kycLevel = level;
    if (data) {
      this.props.kycData = { ...this.props.kycData, ...data };
    }
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      phone: this.props.phone,
      email: this.props.email,
      kycLevel: this.props.kycLevel,
      displayCurrency: this.props.displayCurrency,
      locale: this.props.locale,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }

  toPersistence(): UserProps {
    return { ...this.props };
  }
}
