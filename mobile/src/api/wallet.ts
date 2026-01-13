import client from "./client";
import { Currency, DepositRequest, TransferRequest, TxDTO, TxStatus, WithdrawRequest } from "./types";

type Idempotency = { idempotencyKey?: string };

function cfgIdempotency(idempotencyKey?: string) {
  return idempotencyKey
    ? { headers: { "x-idempotency-key": idempotencyKey } }
    : undefined;
}

export async function createDeposit(
  req: DepositRequest,
  opts?: Idempotency
): Promise<{ txId: string }> {
  const { data } = await client.post("/wallet/deposits", req, cfgIdempotency(opts?.idempotencyKey));
  return data;
}

export async function createWithdraw(
  req: WithdrawRequest,
  opts?: Idempotency
): Promise<{ txId: string }> {
  const { data } = await client.post("/wallet/withdraw", req, cfgIdempotency(opts?.idempotencyKey));
  return data;
}

export async function createTransfer(
  req: TransferRequest,
  opts?: Idempotency
): Promise<{ txId: string }> {
  const { data } = await client.post("/wallet/transfer", req, cfgIdempotency(opts?.idempotencyKey));
  return data;
}

export async function getTxStatus(txId: string): Promise<TxStatus> {
  const { data } = await client.get(`/wallet/transactions/${txId}`);
  return data.status;
}

export async function getMyTransactions(): Promise<TxDTO[]> {
  const { data } = await client.get(`/wallet/users/transactions`);
  return data.txs;
}

export async function getMyBalance(currency: Currency = "EUR"): Promise<string> {
  const { data } = await client.get(`/wallet/users/balance`, { params: { currency } });
  return data.balance; 
}

export async function resolveRecipientId(phone: string): Promise<string> {
  const { data } = await client.get("/wallet/resolve-recipient", { params: { phone } });
  return data.userId;
}