import { Blockchain } from '@prisma/client';
import { WalletProvider, CreateWalletParams, WalletCreationResult, WalletBalance, WalletDetails, TransferParams, TransferResult, EstimateFeeParams } from '../../../domain/ports/WalletProvider';
import { config } from '../../../shared/config';
import { encryptEntitySecret } from '../../../shared/utils';
import { logger } from '../../../shared/utils/logger';
import { CircleWallet, CircleTokenBalance, CircleTransaction } from './types';

// Mapping Prisma blockchain → Circle blockchain
const BLOCKCHAIN_MAP: Record<Blockchain, string> = {
  POLYGON_AMOY: 'MATIC-AMOY',
  ETH_SEPOLIA: 'ETH-SEPOLIA',
  ARBITRUM_SEPOLIA: 'ARB-SEPOLIA',
  POLYGON: 'MATIC',
  ARBITRUM: 'ARB',
  ETHEREUM: 'ETH',
};

/**
 * Circle Programmable Wallets adapter
 */
export class CircleWalletAdapter implements WalletProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly entitySecret: string;
  private readonly rsaPublicKey: string;
  private readonly walletSetId: string;

  constructor() {
    this.baseUrl =
      config.circle.environment === 'production'
        ? 'https://api.circle.com/v1/w3s'
        : 'https://api.circle.com/v1/w3s';
    this.apiKey = config.circle.apiKey;
    this.entitySecret = config.circle.entitySecret;
    this.rsaPublicKey = config.circle.rsaPublicKey;
    this.walletSetId = config.circle.walletSetId;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>,
    requiresEntitySecret = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'X-Request-Id': crypto.randomUUID(),
    };

    // Add entitySecretCiphertext to body for operations requiring signing
    const requestBody = body ? { ...body } : undefined;
    if (requiresEntitySecret && requestBody && this.entitySecret) {
      requestBody.entitySecretCiphertext = encryptEntitySecret(
        this.entitySecret,
        this.rsaPublicKey
      );
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ url, status: response.status, error }, 'Circle API error');
      throw new Error(`Circle API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.data as T;
  }

  async createWallet(params: CreateWalletParams): Promise<WalletCreationResult> {
    const circleBlockchain = BLOCKCHAIN_MAP[params.blockchain];

    const result = await this.request<{ wallets: CircleWallet[] }>(
      'POST',
      '/developer/wallets',
      {
        idempotencyKey: params.idempotencyKey,
        walletSetId: this.walletSetId,
        blockchains: [circleBlockchain],
        count: 1,
        metadata: [{ name: 'User Wallet', refId: params.userId }],
      },
      true // requires entitySecretCiphertext
    );

    const wallet = result.wallets?.[0];
    if (!wallet) {
      throw new Error('Failed to create Circle wallet');
    }

    logger.info({ walletId: wallet.id, address: wallet.address }, 'Circle wallet created');

    return {
      circleWalletId: wallet.id,
      walletSetId: this.walletSetId,
      address: wallet.address,
      status: wallet.state === 'LIVE' ? 'active' : 'pending',
    };
  }

  async getWallet(circleWalletId: string): Promise<WalletDetails> {
    const result = await this.request<{ wallet: CircleWallet }>(
      'GET',
      `/wallets/${circleWalletId}`
    );

    const wallet = result.wallet;

    return {
      id: wallet.id,
      address: wallet.address,
      blockchain: wallet.blockchain,
      state: wallet.state,
      walletSetId: wallet.walletSetId,
      custodyType: wallet.custodyType,
      accountType: wallet.accountType,
      userId: wallet.userId,
      refId: wallet.refId,
    };
  }

  async getBalance(circleWalletId: string): Promise<WalletBalance> {
    const result = await this.request<{ tokenBalances: CircleTokenBalance[] }>(
      'GET',
      `/developer/wallets/${circleWalletId}/balances`
    );

    const usdcBalance = result.tokenBalances?.find((tb) => tb.token.symbol === 'USDC');

    return {
      tokenId: usdcBalance?.token.id ?? '',
      amount: usdcBalance?.amount ?? '0',
      blockchain: usdcBalance?.token.blockchain ?? '',
    };
  }

  async transfer(params: TransferParams): Promise<TransferResult> {
    const result = await this.request<{ transaction: CircleTransaction }>(
      'POST',
      '/developer/transactions/transfer',
      {
        idempotencyKey: params.idempotencyKey,
        walletId: params.fromWalletId,
        tokenId: params.tokenId,
        destinationAddress: params.toAddress,
        amounts: [params.amount],
        fee: {
          type: 'level',
          config: { feeLevel: 'MEDIUM' },
        },
      },
      true // requires entitySecretCiphertext
    );

    const tx = result.transaction;

    logger.info(
      { transferId: tx?.id, status: tx?.state },
      'Circle transfer initiated'
    );

    return {
      id: tx?.id ?? '',
      status: this.mapCircleStatus(tx?.state),
      txHash: tx?.txHash,
    };
  }

  async getTransferStatus(transferId: string): Promise<TransferResult> {
    const result = await this.request<{ transaction: CircleTransaction }>(
      'GET',
      `/developer/transactions/${transferId}`
    );

    const tx = result.transaction;

    return {
      id: tx?.id ?? '',
      status: this.mapCircleStatus(tx?.state),
      txHash: tx?.txHash,
    };
  }

  async estimateFee(params: EstimateFeeParams): Promise<string> {
    const result = await this.request<{
      high: { networkFee: string };
      medium: { networkFee: string };
      low: { networkFee: string };
    }>('POST', '/developer/transactions/transfer/estimateFee', {
      walletId: params.fromWalletId,
      tokenId: params.tokenId,
      destinationAddress: params.toAddress,
      amounts: [params.amount],
    });

    return result.high?.networkFee ?? '0';
  }

  private mapCircleStatus(state?: string): 'pending' | 'complete' | 'failed' {
    switch (state) {
      case 'COMPLETE':
      case 'CONFIRMED':
      case 'CLEARED':
        return 'complete';
      case 'FAILED':
      case 'CANCELLED':
      case 'DENIED':
      case 'STUCK':
        return 'failed';
      case 'INITIATED':
      case 'QUEUED':
      case 'SENT':
      default:
        return 'pending';
    }
  }
}
