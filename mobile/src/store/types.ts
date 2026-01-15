import { TxDTO, DepositRequest, WithdrawRequest, TransferRequest } from "@/src/api/types";

// Wallet types ---------------------------------------------------
export type IdempotencyOpts = { idempotencyKey?: string };

export type WalletState = {
    balance: string | null;
    currency: string;

    transactions: TxDTO[];
    loading: boolean;
    error: string | null;

    fetchBalance: () => Promise<void>;
    fetchTransactions: () => Promise<void>;

    deposit: (req: DepositRequest, opts?: IdempotencyOpts) => Promise<string>;
    withdraw: (req: WithdrawRequest, opts?: IdempotencyOpts) => Promise<string>;
    transfer: (req: TransferRequest, opts?: IdempotencyOpts) => Promise<string>;

    trackTransaction: (txId: string) => Promise<void>;
    reset: () => void;
};

// Auth types ---------------------------------------------------
export type User = {
    id: string;
    phone: string;
};

export type AuthStatus = "bootstrapping" | "authenticated" | "unauthenticated";

export type AuthError = { code: "TOKEN_INVALID" | "NETWORK_ERROR" | "UNKNOWN"; message: string } | null;

export type AuthState = {
    token: string | null;
    user: User | null;
    status: AuthStatus;
    error: AuthError;
    bootstrapped: boolean;

    bootstrap: () => Promise<void>;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
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
