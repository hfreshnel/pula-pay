import { Blockchain } from '@prisma/client';

export interface CreateWalletParams {
  userId: string;
  idempotencyKey: string;
  blockchain: Blockchain;
}

export interface WalletCreationResult {
  circleWalletId: string;
  walletSetId: string;
  address: string;
  status: 'pending' | 'active';
}

export interface WalletBalance {
  tokenId: string; // USDC contract address
  amount: string; // In token units (6 decimals for USDC)
  blockchain: string;
}

export interface TransferParams {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  tokenId: string;
  idempotencyKey: string;
}

export interface TransferResult {
  id: string;
  status: 'pending' | 'complete' | 'failed';
  txHash?: string;
}

export interface EstimateFeeParams {
  fromWalletId: string;
  toAddress: string;
  amount: string;
  tokenId: string;
}

export interface WalletDetails {
  id: string;
  address: string;
  blockchain: string;
  state: 'LIVE' | 'PENDING' | 'FROZEN';
  walletSetId: string;
  custodyType: string;
  accountType: string;
  userId?: string;
  refId?: string;
}

/**
 * Port for blockchain wallet integration
 * Implemented by CircleWalletAdapter
 */
export interface WalletProvider {
  /**
   * Create a new wallet for a user
   */
  createWallet(params: CreateWalletParams): Promise<WalletCreationResult>;

  /**
   * Get wallet details from Circle
   */
  getWallet(circleWalletId: string): Promise<WalletDetails>;

  /**
   * Get USDC balance for a wallet
   */
  getBalance(circleWalletId: string): Promise<WalletBalance>;

  /**
   * Execute a transfer (P2P or external)
   */
  transfer(params: TransferParams): Promise<TransferResult>;

  /**
   * Get transfer status
   */
  getTransferStatus(transferId: string): Promise<TransferResult>;

  /**
   * Estimate gas fees for a transfer
   */
  estimateFee(params: EstimateFeeParams): Promise<string>;
}
