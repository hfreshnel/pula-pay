// ============================================
// Session Token
// ============================================

export interface CoinbaseSessionTokenRequest {
  addresses: Array<{
    address: string;
    blockchains: string[];
  }>;
  assets?: string[];
}

export interface CoinbaseSessionTokenResponse {
  token: string;
  channel_id: string;
}

// ============================================
// Buy Quote (Onramp)
// ============================================

export interface CoinbaseBuyQuoteRequest {
  purchaseCurrency: string;
  paymentAmount: string;
  paymentCurrency: string;
  paymentMethod: string;
  country: string;
  purchaseNetwork?: string;
  destinationAddress?: string;
}

export interface CoinbaseAmountValue {
  value: string;
  currency: string;
}

export interface CoinbaseBuyQuoteResponse {
  quote_id: string;
  purchase_amount: CoinbaseAmountValue;
  payment_subtotal: CoinbaseAmountValue;
  coinbase_fee: CoinbaseAmountValue;
  network_fee: CoinbaseAmountValue;
  payment_total: CoinbaseAmountValue;
  onramp_url?: string;
}

// ============================================
// Sell Quote (Offramp)
// ============================================

export interface CoinbaseSellQuoteRequest {
  sellCurrency: string;
  sellAmount: string;
  cashoutCurrency: string;
  paymentMethod: string;
  country: string;
  sellNetwork?: string;
  sourceAddress?: string;
  redirectUrl?: string;
  partnerUserId?: string;
}

export interface CoinbaseSellQuoteResponse {
  quote_id: string;
  sell_amount: CoinbaseAmountValue;
  cashout_subtotal: CoinbaseAmountValue;
  cashout_total: CoinbaseAmountValue;
  coinbase_fee: CoinbaseAmountValue;
  offramp_url?: string;
}

// ============================================
// Transaction Status
// ============================================

export type CoinbaseTransactionStatus =
  | 'ONRAMP_TRANSACTION_STATUS_CREATED'
  | 'ONRAMP_TRANSACTION_STATUS_IN_PROGRESS'
  | 'ONRAMP_TRANSACTION_STATUS_SUCCESS'
  | 'ONRAMP_TRANSACTION_STATUS_FAILED'
  | 'OFFRAMP_TRANSACTION_STATUS_CREATED'
  | 'OFFRAMP_TRANSACTION_STATUS_IN_PROGRESS'
  | 'OFFRAMP_TRANSACTION_STATUS_SUCCESS'
  | 'OFFRAMP_TRANSACTION_STATUS_FAILED';

export interface CoinbaseTransaction {
  transaction_id: string;
  status: CoinbaseTransactionStatus;
  purchase_amount?: CoinbaseAmountValue;
  payment_amount?: CoinbaseAmountValue;
  sell_amount?: CoinbaseAmountValue;
  cashout_amount?: CoinbaseAmountValue;
  wallet_address?: string;
  tx_hash?: string;
  created_at: string;
  completed_at?: string;
}

export interface CoinbaseTransactionsResponse {
  transactions: CoinbaseTransaction[];
  next_page_key?: string;
  total_count?: number;
}

// ============================================
// Webhook
// ============================================

export interface CoinbaseCdpWebhookPayload {
  event_type:
    | 'onramp.transaction.created'
    | 'onramp.transaction.updated'
    | 'onramp.transaction.success'
    | 'onramp.transaction.failed'
    | 'offramp.transaction.created'
    | 'offramp.transaction.updated'
    | 'offramp.transaction.success'
    | 'offramp.transaction.failed';
  transaction_id: string;
  partner_user_id: string;
  status: CoinbaseTransactionStatus;
  metadata?: Record<string, unknown>;
}
