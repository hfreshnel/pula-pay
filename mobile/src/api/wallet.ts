import client from "./client";
import {
    BalanceDTO,
    WalletDTO,
    ExchangeRateDTO,
    DisplayCurrency,
    DepositRequest,
    DepositResponse,
    WithdrawRequest,
    WithdrawResponse,
    TransferRequest,
    TransferResponse,
    TxDTO,
    TxStatus
} from "./types";

type Idempotency = { idempotencyKey?: string };

function cfgIdempotency(idempotencyKey?: string) {
    return idempotencyKey
        ? { headers: { "x-idempotency-key": idempotencyKey } }
        : undefined;
}

// === WALLET ===

export type CreateWalletResponse = {
    walletId: string;
    address: string;
    blockchain: string;
    status: string;
};

export async function createWallet(blockchain: string = "POLYGON_AMOY"): Promise<CreateWalletResponse> {
    const { data } = await client.post("/wallet", { blockchain });
    return data.data;
}

export async function getMyWallet(): Promise<WalletDTO> {
    const { data } = await client.get("/wallet/me");
    return data;
}

export async function getWalletAddress(): Promise<{ walletId: string; address: string; blockchain: string; status: string }> {
    const { data } = await client.get("/wallet/address");
    return data.data;
}

export type SyncWalletStatusResponse = {
    walletId: string;
    previousStatus: string;
    currentStatus: string;
    wasUpdated: boolean;
};

export async function syncWalletStatus(): Promise<SyncWalletStatusResponse> {
    const { data } = await client.post("/wallet/sync-status");
    return data.data;
}

// === BALANCE ===

export async function getMyBalance(currency: DisplayCurrency = "EUR"): Promise<BalanceDTO> {
    const { data } = await client.get("/wallet/balance", {
        params: { currency }
    });
    return data.data;
}

// === EXCHANGE RATES ===

export async function getExchangeRates(): Promise<ExchangeRateDTO[]> {
    const { data } = await client.get("/exchange-rates");
    return data.rates;
}

export async function getExchangeRate(currency: DisplayCurrency): Promise<ExchangeRateDTO> {
    const { data } = await client.get(`/exchange-rates`, {params: { currencies: currency }});
    return data.data.rates[0];
}

// === DEPOSITS ===

export async function createDeposit(
    req: DepositRequest,
    opts?: Idempotency
): Promise<DepositResponse> {
    // Transform frontend request to backend expected format
    const backendPayload = {
        phoneNumber: req.msisdn,
        amount: parseFloat(req.amount),
        currency: req.currency,
    };
    const { data } = await client.post("/wallet/deposit", backendPayload, cfgIdempotency(opts?.idempotencyKey));
    return data.data;
}

// === WITHDRAWALS ===

export async function createWithdraw(
    req: WithdrawRequest,
    opts?: Idempotency
): Promise<WithdrawResponse> {
    // Transform frontend request to backend expected format
    // Amount is in target currency (fiat), backend will convert to USDC
    const backendPayload = {
        phoneNumber: req.msisdn,
        amount: parseFloat(req.amount),
        targetCurrency: req.currency,
    };
    const { data } = await client.post("/wallet/withdraw", backendPayload, cfgIdempotency(opts?.idempotencyKey));
    console.log("Withdraw response data:", data);
    return data.data;
}

// === TRANSFERS ===

export async function createTransfer(
    req: TransferRequest,
    opts?: Idempotency
): Promise<TransferResponse> {
    // Transform frontend request to backend expected format
    const backendPayload = {
        recipientPhone: req.receiverPhone,
        recipientAddress: req.receiverAddress,
        amount: parseFloat(req.amount),
        currency: req.currency,
        description: req.description,
    };
    const { data } = await client.post("/wallet/transferable", backendPayload, cfgIdempotency(opts?.idempotencyKey));
    return data.data;
}

// === TRANSACTIONS ===

export async function getTxStatus(txId: string): Promise<TxStatus> {
    const { data } = await client.get(`/wallet/transactions/${txId}`);
    return data.status;
}

export async function getTransaction(txId: string): Promise<TxDTO> {
    const { data } = await client.get(`/wallet/transactions/${txId}`);
    return data;
}

export async function getMyTransactions(): Promise<TxDTO[]> {
    const { data } = await client.get("/wallet/transactions");
    return data.data.items;
}

// === RECIPIENT RESOLUTION ===

export async function resolveRecipient(query: {
    phone?: string;
    address?: string;
}): Promise<{ userId: string; address: string; phone?: string }> {
    const { data } = await client.get("/wallet/resolve-recipient", {
        params: query
    });
    return data;
}

// Convenience function for resolving by phone only
export async function resolveRecipientId(phone: string): Promise<string> {
    const { data } = await client.get("/wallet/resolve-recipient", {
        params: { phone }
    });
    return data.userId;
}

// === USER PREFERENCES ===

export async function updateDisplayCurrency(currency: DisplayCurrency): Promise<void> {
    await client.patch("/users/me/preferences", { displayCurrency: currency });
}
