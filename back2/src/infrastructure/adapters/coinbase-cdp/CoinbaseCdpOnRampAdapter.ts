import { OnRampProvider as Provider } from '@prisma/client';
import {
  OnRampProvider,
  InitiateDepositParams,
  DepositResult,
  InitiatePayoutParams,
  PayoutResult,
} from '../../../domain/ports/OnRampProvider';
import {
  QuoteProvider,
  OnrampQuoteParams,
  OnrampQuoteResult,
  OfframpQuoteParams,
  OfframpQuoteResult,
} from '../../../domain/ports/QuoteProvider';
import { CoinbaseCdpAuth } from './CoinbaseCdpAuth';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/utils/logger';
import {
  CoinbaseSessionTokenResponse,
  CoinbaseBuyQuoteResponse,
  CoinbaseSellQuoteResponse,
  CoinbaseTransactionsResponse,
  CoinbaseTransactionStatus,
  CoinbaseCdpWebhookPayload,
} from './types';

/**
 * Coinbase CDP Onramp/Offramp adapter.
 *
 * Uses a redirect-based flow: the backend generates a session token and
 * buy/sell quote, returns a Coinbase widget URL, and the mobile app opens
 * it in a WebView. Transaction completion is detected via background polling.
 */
export class CoinbaseCdpOnRampAdapter implements OnRampProvider, QuoteProvider {
  readonly providerCode: Provider = 'COINBASE_CDP';

  private readonly auth: CoinbaseCdpAuth;
  private readonly baseUrl: string;

  constructor() {
    this.auth = new CoinbaseCdpAuth();
    this.baseUrl = config.coinbase.baseUrl;
  }

  // ============================================
  // HTTP helper
  // ============================================

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const jwt = this.auth.generateJwt(method, path);
    const url = `${this.baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        { url, status: response.status, error: errorText },
        'Coinbase CDP API error'
      );
      throw new Error(`Coinbase CDP API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  // ============================================
  // Session Token
  // ============================================

  private async createSessionToken(
    walletAddress: string,
    blockchain: string
  ): Promise<CoinbaseSessionTokenResponse> {
    const blockchainName = this.mapBlockchainName(blockchain);
    return this.request<CoinbaseSessionTokenResponse>('POST', '/onramp/v1/token', {
      addresses: [{ address: walletAddress, blockchains: [blockchainName] }],
      assets: ['USDC'],
    });
  }

  // ============================================
  // QuoteProvider implementation
  // ============================================

  async getOnrampQuote(params: OnrampQuoteParams): Promise<OnrampQuoteResult> {
    const response = await this.request<CoinbaseBuyQuoteResponse>(
      'POST',
      '/onramp/v1/buy/quote',
      {
        purchaseCurrency: params.purchaseCurrency,
        paymentAmount: String(params.paymentAmount),
        paymentCurrency: params.paymentCurrency,
        paymentMethod: params.paymentMethod,
        country: params.country,
      }
    );

    return {
      quoteId: response.quote_id,
      purchaseAmount: response.purchase_amount.value,
      paymentSubtotal: response.payment_subtotal.value,
      coinbaseFee: response.coinbase_fee.value,
      networkFee: response.network_fee.value,
      paymentTotal: response.payment_total.value,
    };
  }

  async getOfframpQuote(params: OfframpQuoteParams): Promise<OfframpQuoteResult> {
    const response = await this.request<CoinbaseSellQuoteResponse>(
      'POST',
      '/onramp/v1/sell/quote',
      {
        sellCurrency: params.sellCurrency,
        sellAmount: String(params.sellAmount),
        cashoutCurrency: params.cashoutCurrency,
        paymentMethod: params.paymentMethod,
        country: params.country,
      }
    );

    return {
      quoteId: response.quote_id,
      sellAmount: response.sell_amount.value,
      cashoutSubtotal: response.cashout_subtotal.value,
      cashoutTotal: response.cashout_total.value,
      coinbaseFee: response.coinbase_fee.value,
    };
  }

  // ============================================
  // OnRampProvider implementation
  // ============================================

  async initiateDeposit(params: InitiateDepositParams): Promise<DepositResult> {
    const walletAddress = params.walletAddress;
    const blockchain = params.blockchain ?? 'POLYGON_AMOY';
    const country = params.country ?? config.coinbase.defaultCountry;

    if (!walletAddress) {
      throw new Error('walletAddress is required for Coinbase CDP deposit');
    }

    // 1. Create session token
    const session = await this.createSessionToken(walletAddress, blockchain);

    // 2. Get buy quote (with destination address to get onramp URL)
    const quoteResponse = await this.request<CoinbaseBuyQuoteResponse>(
      'POST',
      '/onramp/v1/buy/quote',
      {
        purchaseCurrency: 'USDC',
        paymentAmount: String(params.amount),
        paymentCurrency: params.currency,
        paymentMethod: params.paymentMethod ?? 'CARD',
        country,
        destinationAddress: walletAddress,
      }
    );

    // 3. Build the widget URL
    const paymentUrl =
      quoteResponse.onramp_url ??
      `https://pay.coinbase.com/buy/select-asset?sessionToken=${session.token}`;

    logger.info(
      {
        quoteId: quoteResponse.quote_id,
        userId: params.userId,
        amount: params.amount,
        currency: params.currency,
        paymentTotal: quoteResponse.payment_total?.value,
      },
      'Coinbase CDP deposit initiated'
    );

    return {
      providerRef: quoteResponse.quote_id,
      status: 'pending',
      paymentUrl,
      quoteId: quoteResponse.quote_id,
      fees: {
        coinbaseFee: quoteResponse.coinbase_fee?.value,
        networkFee: quoteResponse.network_fee?.value,
        paymentTotal: quoteResponse.payment_total?.value,
      },
    };
  }

  async getDepositStatus(providerRef: string): Promise<DepositResult> {
    // providerRef format: "userId:quoteId"
    const [userId, quoteId] = this.parseProviderRef(providerRef);
    const partnerUserRef = `pulapay_${userId}`;

    try {
      const response = await this.request<CoinbaseTransactionsResponse>(
        'GET',
        `/onramp/v1/buy/user/${partnerUserRef}/transactions`
      );

      const tx = response.transactions?.find(
        (t) => t.transaction_id === quoteId
      );

      if (tx) {
        return {
          providerRef,
          status: this.mapCoinbaseStatus(tx.status),
        };
      }
    } catch (error) {
      logger.warn({ error, providerRef }, 'Failed to get Coinbase deposit status');
    }

    return { providerRef, status: 'pending' };
  }

  async initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult> {
    const walletAddress = params.walletAddress;
    const blockchain = params.blockchain ?? 'POLYGON_AMOY';
    const country = params.country ?? config.coinbase.defaultCountry;
    const cashoutCurrency = params.cashoutCurrency ?? params.currency;

    if (!walletAddress) {
      throw new Error('walletAddress is required for Coinbase CDP payout');
    }

    // 1. Create session token
    const session = await this.createSessionToken(walletAddress, blockchain);

    // 2. Get sell quote (with source address to get offramp URL)
    const partnerUserId = `pulapay_${params.userId}`;
    const quoteResponse = await this.request<CoinbaseSellQuoteResponse>(
      'POST',
      '/onramp/v1/sell/quote',
      {
        sellCurrency: 'USDC',
        sellAmount: String(params.amount),
        cashoutCurrency: cashoutCurrency,
        paymentMethod: params.paymentMethod ?? 'ACH_BANK_ACCOUNT',
        country,
        sourceAddress: walletAddress,
        redirectUrl: params.redirectUrl,
        partnerUserId,
      }
    );

    // 3. Build the widget URL
    const paymentUrl =
      quoteResponse.offramp_url ??
      `https://pay.coinbase.com/v3/sell/input?sessionToken=${session.token}`;

    logger.info(
      {
        quoteId: quoteResponse.quote_id,
        userId: params.userId,
        amount: params.amount,
        cashoutCurrency,
        cashoutTotal: quoteResponse.cashout_total?.value,
      },
      'Coinbase CDP payout initiated'
    );

    return {
      providerRef: quoteResponse.quote_id,
      status: 'pending',
      paymentUrl,
      quoteId: quoteResponse.quote_id,
      fees: {
        coinbaseFee: quoteResponse.coinbase_fee?.value,
        cashoutTotal: quoteResponse.cashout_total?.value,
      },
    };
  }

  async getPayoutStatus(providerRef: string): Promise<PayoutResult> {
    const [userId, quoteId] = this.parseProviderRef(providerRef);
    const partnerUserRef = `pulapay_${userId}`;

    try {
      const response = await this.request<CoinbaseTransactionsResponse>(
        'GET',
        `/onramp/v1/sell/user/${partnerUserRef}/transactions`
      );

      const tx = response.transactions?.find(
        (t) => t.transaction_id === quoteId
      );

      if (tx) {
        return {
          providerRef,
          status: this.mapCoinbaseStatus(tx.status),
        };
      }
    } catch (error) {
      logger.warn({ error, providerRef }, 'Failed to get Coinbase payout status');
    }

    return { providerRef, status: 'pending' };
  }

  validateWebhook(_headers: Record<string, string>, body: unknown): boolean {
    // Coinbase CDP webhooks are still "under development"
    // For now, validate the expected payload shape
    const payload = body as CoinbaseCdpWebhookPayload;
    return !!(payload?.event_type && payload?.transaction_id);
  }

  // ============================================
  // Polling
  // ============================================

  startDepositPolling(
    providerRef: string,
    onStatusChange: (result: DepositResult) => Promise<void>
  ): void {
    this.pollUntilComplete(providerRef, 'deposit', onStatusChange).catch((error) => {
      logger.error({ error, providerRef }, 'Background Coinbase deposit polling failed');
    });
  }

  startPayoutPolling(
    providerRef: string,
    onStatusChange: (result: PayoutResult) => Promise<void>
  ): void {
    this.pollUntilComplete(providerRef, 'payout', onStatusChange).catch((error) => {
      logger.error({ error, providerRef }, 'Background Coinbase payout polling failed');
    });
  }

  async pollDepositUntilComplete(
    providerRef: string,
    onStatusChange?: (result: DepositResult) => Promise<void>
  ): Promise<DepositResult> {
    return this.pollUntilComplete(providerRef, 'deposit', onStatusChange);
  }

  async pollPayoutUntilComplete(
    providerRef: string,
    onStatusChange?: (result: PayoutResult) => Promise<void>
  ): Promise<PayoutResult> {
    return this.pollUntilComplete(providerRef, 'payout', onStatusChange);
  }

  // ============================================
  // Private helpers
  // ============================================

  private async pollUntilComplete(
    providerRef: string,
    type: 'deposit' | 'payout',
    onStatusChange?: (result: DepositResult | PayoutResult) => Promise<void>
  ): Promise<DepositResult | PayoutResult> {
    const intervalMs = config.coinbase.pollingIntervalMs;
    const maxAttempts = config.coinbase.pollingMaxAttempts;
    const [userId, quoteId] = this.parseProviderRef(providerRef);
    const partnerUserRef = `pulapay_${userId}`;
    const endpoint =
      type === 'deposit'
        ? `/onramp/v1/buy/user/${partnerUserRef}/transactions`
        : `/onramp/v1/sell/user/${partnerUserRef}/transactions`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.request<CoinbaseTransactionsResponse>(
          'GET',
          endpoint
        );

        const tx = response.transactions?.find(
          (t) => t.transaction_id === quoteId
        );

        if (tx) {
          const status = this.mapCoinbaseStatus(tx.status);

          logger.debug(
            { providerRef, attempt, maxAttempts, coinbaseStatus: tx.status, status },
            `Polling Coinbase ${type} status`
          );

          if (status === 'completed' || status === 'failed') {
            const result: DepositResult = { providerRef: quoteId, status };
            if (onStatusChange) await onStatusChange(result);
            return result;
          }
        }
      } catch (error) {
        logger.warn(
          { error, providerRef, attempt },
          `Coinbase ${type} polling error`
        );
      }

      if (attempt < maxAttempts) {
        await this.delay(intervalMs);
      }
    }

    logger.warn(
      { providerRef, maxAttempts },
      `Coinbase ${type} polling reached max attempts`
    );
    return { providerRef: quoteId, status: 'pending' };
  }

  private mapCoinbaseStatus(
    status: CoinbaseTransactionStatus
  ): 'pending' | 'processing' | 'completed' | 'failed' {
    if (status.endsWith('_SUCCESS')) return 'completed';
    if (status.endsWith('_FAILED')) return 'failed';
    if (status.endsWith('_IN_PROGRESS')) return 'processing';
    return 'pending';
  }

  /**
   * Parse composite providerRef format: "userId:quoteId"
   */
  private parseProviderRef(providerRef: string): [string, string] {
    const separatorIndex = providerRef.indexOf(':');
    if (separatorIndex === -1) {
      return [providerRef, providerRef];
    }
    return [
      providerRef.substring(0, separatorIndex),
      providerRef.substring(separatorIndex + 1),
    ];
  }

  /**
   * Map internal blockchain enum names to Coinbase network names.
   */
  private mapBlockchainName(blockchain: string): string {
    const mapping: Record<string, string> = {
      POLYGON_AMOY: 'polygon',
      POLYGON: 'polygon',
      ETHEREUM: 'ethereum',
      ETH_SEPOLIA: 'ethereum',
      ARBITRUM: 'arbitrum',
      ARBITRUM_SEPOLIA: 'arbitrum',
    };
    return mapping[blockchain] ?? 'polygon';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
