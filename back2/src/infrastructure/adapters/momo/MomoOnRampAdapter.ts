import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { OnRampProvider as Provider } from '@prisma/client';
import { OnRampProvider, InitiateDepositParams, DepositResult, InitiatePayoutParams, PayoutResult } from '../../../domain/ports/OnRampProvider';
import { config } from '../../../shared/config';
import { logger } from '../../../shared/utils/logger';

interface MomoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface MomoPaymentStatusResponse {
  referenceId: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  financialTransactionId?: string;
  reason?: string;
}

/**
 * MTN MoMo adapter for on/off-ramp
 */
export class MomoOnRampAdapter implements OnRampProvider {
  readonly providerCode: Provider = 'MTN_MOMO';

  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    const baseUrl =
      config.momo.environment === 'production'
        ? 'https://sandbox.momodeveloper.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com';

    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': config.momo.subscriptionKey || '',
      },
    });
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if valid
    if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${config.momo.apiKey}:${config.momo.apiSecret}`
    ).toString('base64');

    const response = await this.client.post<MomoTokenResponse>(
      '/collection/token/',
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 60) * 1000);

    return this.accessToken;
  }

  async initiateDeposit(params: InitiateDepositParams): Promise<DepositResult> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      await this.client.post(
        '/collection/v1_0/requesttopay',
        {
          amount: params.amount.toString(),
          currency: params.currency === 'XOF' ? 'XOF' : 'EUR',
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
            'X-Callback-Url': params.callbackUrl,
            'X-Target-Environment': config.momo.environment,
          },
        }
      );

      logger.info({ referenceId, userId: params.userId }, 'MoMo deposit initiated');

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
    const token = await this.getAccessToken();

    const response = await this.client.get<MomoPaymentStatusResponse>(
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
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      await this.client.post(
        '/disbursement/v1_0/transfer',
        {
          amount: params.amount.toString(),
          currency: params.currency === 'XOF' ? 'XOF' : 'EUR',
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

      logger.info({ referenceId, userId: params.userId }, 'MoMo payout initiated');

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
    const token = await this.getAccessToken();

    const response = await this.client.get<MomoPaymentStatusResponse>(
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
    // In production, validate the callback authenticity
    const subscriptionKey = headers['ocp-apim-subscription-key'];
    return subscriptionKey === config.momo.subscriptionKey;
  }

  private mapMomoStatus(
    status: 'PENDING' | 'SUCCESSFUL' | 'FAILED'
  ): 'pending' | 'processing' | 'completed' | 'failed' {
    switch (status) {
      case 'SUCCESSFUL':
        return 'completed';
      case 'FAILED':
        return 'failed';
      default:
        return 'processing';
    }
  }
}
