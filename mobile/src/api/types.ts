// === CURRENCIES ===
export type Currency = "EUR" | "XOF" | "USD";
export type DisplayCurrency = "EUR" | "XOF";

// === USER ===
export type UserDTO = {
    id: string;
    phone: string;
    name?: string;
    firstName?: string;
    email?: string;
    isVerified?: boolean;
    displayCurrency: DisplayCurrency;
    kycLevel?: "NONE" | "BASIC" | "VERIFIED";
};

// === WALLET ===
export type WalletDTO = {
    id: string;
    userId: string;
    address: string;
    blockchain: Blockchain;
    status: WalletStatus;
    createdAt: string;
};

export type Blockchain =
    | "POLYGON_AMOY"    // Testnet
    | "POLYGON"         // Mainnet
    | "ARBITRUM";

export type WalletStatus = "PENDING" | "ACTIVE" | "FROZEN";

// === BALANCE ===
export type BalanceDTO = {
    balanceUsdc: string;
    displayBalance: string;
    displayCurrency: DisplayCurrency;
    exchangeRate: string;
    rateTimestamp: string;
};

// === EXCHANGE RATE ===
export type ExchangeRateDTO = {
    baseCurrency: "USDC";
    quoteCurrency: DisplayCurrency;
    rate: string;
    timestamp: string;
    source: string;
};

// === TRANSACTIONS ===
export type TxStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED";

export type TxType =
    | "DEPOSIT_ONRAMP"      // MoMo → USDC
    | "DEPOSIT_CRYPTO"      // Crypto externe → Wallet
    | "WITHDRAWAL_OFFRAMP"  // USDC → MoMo
    | "WITHDRAWAL_CRYPTO"   // Wallet → Adresse externe
    | "TRANSFER_P2P"        // Wallet → Wallet interne
    | "REFUND"
    | "FEE";

export type TxDirection = 'IN' | 'OUT';

export type TxDTO = {
    id: string;
    idempotencyKey: string;
    externalRef?: string;
    type: TxType;
    status: TxStatus;
    direction: TxDirection;

    // Amounts
    amountUsdc: string;
    feeUsdc: string;
    displayAmount: string;
    displayCurrency: DisplayCurrency;
    exchangeRate: string;

    // Parties
    walletId: string;
    counterpartyId?: string;
    counterpartyAddress?: string;

    // Metadata
    description?: string;
    txHash?: string;

    createdAt: string;
    completedAt?: string;
};

// === ON-RAMP PROVIDERS ===
export type OnRampProvider = "MTN_MOMO" | "ORANGE_MONEY" | "BANK_TRANSFER" | "CRYPTO";

// === REQUESTS ===
export type DepositRequest = {
    amount: string;
    currency: DisplayCurrency;
    provider: OnRampProvider;
    msisdn?: string;
};

export type WithdrawRequest = {
    amount: string;
    currency: DisplayCurrency;
    provider: OnRampProvider;
    msisdn?: string;
};

export type TransferRequest = {
    receiverId?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    amount: string;
    currency: DisplayCurrency;
    description?: string;
};

// === RESPONSES ===
// Backend returns { transactionId } for transaction operations
export type DepositResponse = {
    transactionId: string;
};

export type WithdrawResponse = {
    transactionId: string;
};

export type TransferResponse = {
    transactionId: string;
};
