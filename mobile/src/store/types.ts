import {
    TxDTO,
    DepositRequest,
    WithdrawRequest,
    TransferRequest,
    DisplayCurrency,
    ExchangeRateDTO,
    WalletDTO
} from "@/src/api/types";

// Wallet types ---------------------------------------------------
export type IdempotencyOpts = { idempotencyKey?: string };

export type WalletState = {
    // Wallet info
    wallet: WalletDTO | null;
    walletNotFound: boolean;

    // Balance
    balanceUsdc: string | null;
    displayBalance: string | null;
    displayCurrency: DisplayCurrency;

    // Exchange rates
    exchangeRates: Record<DisplayCurrency, ExchangeRateDTO> | null;
    ratesLoading: boolean;

    // Transactions
    transactions: TxDTO[];

    // Loading states
    loading: boolean;
    error: string | null;

    // Actions - Fetch
    fetchWallet: () => Promise<void>;
    fetchBalance: () => Promise<void>;
    fetchTransactions: () => Promise<void>;
    fetchExchangeRates: () => Promise<void>;

    // Actions - Operations
    deposit: (req: DepositRequest, opts?: IdempotencyOpts) => Promise<string>;
    withdraw: (req: WithdrawRequest, opts?: IdempotencyOpts) => Promise<string>;
    transfer: (req: TransferRequest, opts?: IdempotencyOpts) => Promise<string>;

    // Actions - Helpers
    setDisplayCurrency: (currency: DisplayCurrency) => void;
    convertToDisplay: (amountUsdc: string) => string;
    convertToUsdc: (displayAmount: string) => string;
    syncWalletStatus: () => Promise<{ wasUpdated: boolean; currentStatus: string }>;

    // Actions - Track
    trackTransaction: (txId: string) => Promise<void>;
    reset: () => void;
};

// Auth types ---------------------------------------------------
export type User = {
    id: string;
    phone: string;
    name?: string;
    firstName?: string;
    email?: string;
    isVerified?: boolean;
    displayCurrency: DisplayCurrency;
};

export type AuthStatus = "bootstrapping" | "authenticated" | "unauthenticated";

export type AuthError = { code: "TOKEN_INVALID" | "NETWORK_ERROR" | "UNKNOWN"; message: string } | null;

export type AuthState = {
    token: string | null;
    refreshToken: string | null;
    user: User | null;
    status: AuthStatus;
    error: AuthError;
    bootstrapped: boolean;

    bootstrap: () => Promise<void>;
    login: (accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    refreshTokens: () => Promise<boolean>;
    setDisplayCurrency: (currency: DisplayCurrency) => Promise<void>;
};

// UI types ---------------------------------------------------
export type ThemeMode = "system" | "light" | "dark";
export type Language = "fr" | "en";

export type UIState = {
    theme: ThemeMode;
    language: Language;
    setTheme: (mode: ThemeMode) => void;
    setLanguage: (lang: Language) => void;
};
