import { Currency, OnRampProvider as Provider } from '@prisma/client';

export interface InitiateDepositParams {
  userId: string;
  amount: number; // In fiat currency
  currency: Currency;
  idempotencyKey: string;
  callbackUrl: string;
  // Phone-based providers (MoMo):
  phoneNumber?: string;
  // Redirect-based providers (Coinbase):
  walletAddress?: string;
  blockchain?: string;
  country?: string;
  paymentMethod?: string;
}

export interface DepositResult {
  providerRef: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentUrl?: string; // For redirect-based providers (Coinbase widget URL)
  quoteId?: string;
  fees?: {
    coinbaseFee?: string;
    networkFee?: string;
    paymentTotal?: string;
  };
}

export interface InitiatePayoutParams {
  userId: string;
  amount: number;
  currency: Currency;
  idempotencyKey: string;
  // Phone-based providers (MoMo):
  phoneNumber?: string;
  // Redirect-based providers (Coinbase):
  walletAddress?: string;
  blockchain?: string;
  country?: string;
  paymentMethod?: string;
  cashoutCurrency?: Currency;
  redirectUrl?: string;
}

export interface PayoutResult {
  providerRef: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentUrl?: string; // For redirect-based providers (Coinbase offramp URL)
  quoteId?: string;
  fees?: {
    coinbaseFee?: string;
    cashoutTotal?: string;
  };
}

/**
 * Port for fiat on/off-ramp providers
 * Implemented by CoinbaseCdpOnRampAdapter, etc.
 */
export interface OnRampProvider {
  readonly providerCode: Provider;

  /**
   * Initiate a collection (user → platform)
   */
  initiateDeposit(params: InitiateDepositParams): Promise<DepositResult>;

  /**
   * Check deposit status
   */
  getDepositStatus(providerRef: string): Promise<DepositResult>;

  /**
   * Initiate a payout (platform → user)
   */
  initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult>;

  /**
   * Check payout status
   */
  getPayoutStatus(providerRef: string): Promise<PayoutResult>;

  /**
   * Validate incoming webhook
   */
  validateWebhook(headers: Record<string, string>, body: unknown): boolean;

  /**
   * Poll deposit status until terminal state (fallback for callbacks)
   */
  pollDepositUntilComplete?(
    providerRef: string,
    onStatusChange?: (result: DepositResult) => Promise<void>
  ): Promise<DepositResult>;

  /**
   * Poll payout status until terminal state (fallback for callbacks)
   */
  pollPayoutUntilComplete?(
    providerRef: string,
    onStatusChange?: (result: PayoutResult) => Promise<void>
  ): Promise<PayoutResult>;

  /**
   * Start background polling for deposit (fire-and-forget)
   */
  startDepositPolling?(
    providerRef: string,
    onStatusChange: (result: DepositResult) => Promise<void>
  ): void;

  /**
   * Start background polling for payout (fire-and-forget)
   */
  startPayoutPolling?(
    providerRef: string,
    onStatusChange: (result: PayoutResult) => Promise<void>
  ): void;
}
