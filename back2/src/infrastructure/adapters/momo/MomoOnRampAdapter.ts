import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { OnRampProvider as Provider } from '@prisma/client';
import { OnRampProvider, InitiateDepositParams, DepositResult, InitiatePayoutParams, PayoutResult } from '../../../domain/ports/OnRampProvider';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/utils/logger';

// MoMo sandbox only supports EUR, so we convert XOF to EUR using the fixed rate
const MOMO_CURRENCY = 'EUR';

interface MomoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MomoPaymentStatusResponse {
  referenceId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REJECTED' | 'TIMEOUT';
  financialTransactionId?: string;
  reason?: string;
}

interface TokenCache {
  token: string;
  expiresAt: Date;
}

/**
 * MTN MoMo adapter for on/off-ramp
 */
export class MomoOnRampAdapter implements OnRampProvider {
  readonly providerCode: Provider = 'MTN_MOMO';

  private baseUrl: string;
  private collectionTokenCache: TokenCache | null = null;
  private disbursementTokenCache: TokenCache | null = null;

  constructor() {
    this.baseUrl =
      config.momo.environment === 'production'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com';
  }

  private createClient(subscriptionKey: string): AxiosInstance {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
    });
  }

  private async getCollectionToken(): Promise<string> {
    if (this.collectionTokenCache && new Date() < this.collectionTokenCache.expiresAt) {
      return this.collectionTokenCache.token;
    }

    const credentials = Buffer.from(
      `${config.momo.apiUser}:${config.momo.apiKey}`
    ).toString('base64');

    const client = this.createClient(config.momo.collectionSubscriptionKey || '');
    const response = await client.post<MomoTokenResponse>(
      '/collection/token/',
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    this.collectionTokenCache = {
      token: response.data.access_token,
      expiresAt: new Date(Date.now() + (response.data.expires_in - 60) * 1000),
    };

    return this.collectionTokenCache.token;
  }

  private async getDisbursementToken(): Promise<string> {
    if (this.disbursementTokenCache && new Date() < this.disbursementTokenCache.expiresAt) {
      return this.disbursementTokenCache.token;
    }

    const credentials = Buffer.from(
      `${config.momo.apiUser}:${config.momo.apiKey}`
    ).toString('base64');

    const client = this.createClient(config.momo.disbursementSubscriptionKey || '');
    const response = await client.post<MomoTokenResponse>(
      '/disbursement/token/',
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    this.disbursementTokenCache = {
      token: response.data.access_token,
      expiresAt: new Date(Date.now() + (response.data.expires_in - 60) * 1000),
    };

    return this.disbursementTokenCache.token;
  }

  /**
   * Convert amount to EUR for MoMo API
   * MoMo sandbox only supports EUR, so XOF amounts are converted using the fixed rate
   */
  private convertToMomoCurrency(amount: number | string, currency: string): string {
    const amountDecimal = new Decimal(amount);

    if (currency === 'XOF') {
      // Convert XOF to EUR: divide by fixed rate
      const eurAmount = amountDecimal.div(config.exchangeRate.xofEurFixedRate);
      // Round to 2 decimal places for EUR
      return eurAmount.toFixed(2);
    }

    // Already in EUR or other supported currency
    return amountDecimal.toFixed(2);
  }

  async initiateDeposit(params: InitiateDepositParams): Promise<DepositResult> {
    const token = await this.getCollectionToken();
    const client = this.createClient(config.momo.collectionSubscriptionKey || '');
    const referenceId = uuidv4();

    // Convert amount to EUR (MoMo sandbox only supports EUR)
    const momoAmount = this.convertToMomoCurrency(params.amount, params.currency);

    try {
      await client.post(
        '/collection/v1_0/requesttopay',
        {
          amount: momoAmount,
          currency: MOMO_CURRENCY,
          externalId: params.idempotencyKey,
          payer: {
            partyIdType: 'MSISDN',
            partyId: params.phoneNumber.replace('+', ''),
          },
          payerMessage: 'Pula Pay deposit',
          payeeNote: `Deposit for user ${params.userId}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            //'X-Callback-Url': params.callbackUrl,
            'X-Target-Environment': config.momo.environment,
          },
        }
      );

      logger.info(
        { referenceId, userId: params.userId, originalAmount: params.amount, originalCurrency: params.currency, momoAmount },
        'MoMo deposit initiated'
      );

      return {
        providerRef: referenceId,
        status: 'pending',
      };
    } catch (error) {
      logger.error({ error, userId: params.userId }, 'MoMo deposit failed');
      throw error;
    }
  }

  async getDepositStatus(providerRef: string): Promise<DepositResult> {
    const token = await this.getCollectionToken();
    const client = this.createClient(config.momo.collectionSubscriptionKey || '');

    const response = await client.get<MomoPaymentStatusResponse>(
      `/collection/v1_0/requesttopay/${providerRef}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': config.momo.environment,
        },
      }
    );

    return {
      providerRef,
      status: this.mapMomoStatus(response.data.status),
    };
  }

  async initiatePayout(params: InitiatePayoutParams): Promise<PayoutResult> {
    const token = await this.getDisbursementToken();
    const client = this.createClient(config.momo.disbursementSubscriptionKey || '');
    const referenceId = uuidv4();

    // Convert amount to EUR (MoMo sandbox only supports EUR)
    const momoAmount = this.convertToMomoCurrency(params.amount, params.currency);

    try {
      await client.post(
        '/disbursement/v1_0/transfer',
        {
          amount: momoAmount,
          currency: MOMO_CURRENCY,
          externalId: params.idempotencyKey,
          payee: {
            partyIdType: 'MSISDN',
            partyId: params.phoneNumber.replace('+', ''),
          },
          payerMessage: 'Pula Pay withdrawal',
          payeeNote: `Withdrawal for user ${params.userId}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': config.momo.environment,
          },
        }
      );

      logger.info(
        { referenceId, userId: params.userId, originalAmount: params.amount, originalCurrency: params.currency, momoAmount },
        'MoMo payout initiated'
      );

      return {
        providerRef: referenceId,
        status: 'pending',
      };
    } catch (error) {
      logger.error({ error, userId: params.userId }, 'MoMo payout failed');
      throw error;
    }
  }

  async getPayoutStatus(providerRef: string): Promise<PayoutResult> {
    const token = await this.getDisbursementToken();
    const client = this.createClient(config.momo.disbursementSubscriptionKey || '');

    const response = await client.get<MomoPaymentStatusResponse>(
      `/disbursement/v1_0/transfer/${providerRef}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Target-Environment': config.momo.environment,
        },
      }
    );

    return {
      providerRef,
      status: this.mapMomoStatus(response.data.status),
    };
  }

  validateWebhook(headers: Record<string, string>, _body: unknown): boolean {
    // MoMo doesn't provide webhook signatures in sandbox
    // In production, validate the callback authenticity using IP allowlist or other methods
    // For now, we accept callbacks that have a valid subscription key header
    const subscriptionKey = headers['ocp-apim-subscription-key'];
    return (
      subscriptionKey === config.momo.collectionSubscriptionKey ||
      subscriptionKey === config.momo.disbursementSubscriptionKey
    );
  }

  private mapMomoStatus(
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'REJECTED' | 'TIMEOUT'
  ): 'pending' | 'processing' | 'completed' | 'failed' {
    switch (status) {
      case 'SUCCESSFUL':
        return 'completed';
      case 'FAILED':
      case 'REJECTED':
      case 'TIMEOUT':
        return 'failed';
      case 'PENDING':
        return 'pending';
      default:
        return 'processing';
    }
  }

  /**
   * Poll deposit status until terminal state or max attempts reached
   * Use as fallback when callback doesn't arrive
   */
  async pollDepositUntilComplete(
    providerRef: string,
    onStatusChange?: (result: DepositResult) => Promise<void>
  ): Promise<DepositResult> {
    const intervalMs = config.momo.pollingIntervalMs;
    const maxAttempts = config.momo.pollingMaxAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.getDepositStatus(providerRef);

      logger.debug(
        { providerRef, attempt, maxAttempts, status: result.status },
        'Polling deposit status'
      );

      if (result.status === 'completed' || result.status === 'failed') {
        if (onStatusChange) {
          await onStatusChange(result);
        }
        return result;
      }

      if (attempt < maxAttempts) {
        await this.delay(intervalMs);
      }
    }

    logger.warn({ providerRef, maxAttempts }, 'Deposit polling reached max attempts');
    return { providerRef, status: 'pending' };
  }

  /**
   * Poll payout status until terminal state or max attempts reached
   * Use as fallback when callback doesn't arrive
   */
  async pollPayoutUntilComplete(
    providerRef: string,
    onStatusChange?: (result: PayoutResult) => Promise<void>
  ): Promise<PayoutResult> {
    const intervalMs = config.momo.pollingIntervalMs;
    const maxAttempts = config.momo.pollingMaxAttempts;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await this.getPayoutStatus(providerRef);

      logger.debug(
        { providerRef, attempt, maxAttempts, status: result.status },
        'Polling payout status'
      );

      if (result.status === 'completed' || result.status === 'failed') {
        if (onStatusChange) {
          await onStatusChange(result);
        }
        return result;
      }

      if (attempt < maxAttempts) {
        await this.delay(intervalMs);
      }
    }

    logger.warn({ providerRef, maxAttempts }, 'Payout polling reached max attempts');
    return { providerRef, status: 'pending' };
  }

  /**
   * Start background polling for deposit (fire-and-forget)
   */
  startDepositPolling(
    providerRef: string,
    onStatusChange: (result: DepositResult) => Promise<void>
  ): void {
    this.pollDepositUntilComplete(providerRef, onStatusChange).catch((error) => {
      logger.error({ error, providerRef }, 'Background deposit polling failed');
    });
  }

  /**
   * Start background polling for payout (fire-and-forget)
   */
  startPayoutPolling(
    providerRef: string,
    onStatusChange: (result: PayoutResult) => Promise<void>
  ): void {
    this.pollPayoutUntilComplete(providerRef, onStatusChange).catch((error) => {
      logger.error({ error, providerRef }, 'Background payout polling failed');
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
