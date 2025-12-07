import axios from "axios";

const MOMO_BASE = process.env.MOMO_BASE!;
const MOMO_TARGET = process.env.MOMO_TARGET!;
const MOMO_COLLECTION_KEY = process.env.MOMO_COLLECTION_KEY!;
const MOMO_DISBURSEMENT_KEY = process.env.MOMO_DISBURSEMENT_KEY!;
const MOMO_API_USER = process.env.MOMO_API_USER!;
const MOMO_API_KEY = process.env.MOMO_API_KEY!;

const requiredEnv = [
  "MOMO_BASE",
  "MOMO_TARGET",
  "MOMO_COLLECTION_KEY",
  "MOMO_DISBURSEMENT_KEY",
  "MOMO_API_USER",
  "MOMO_API_KEY",
] as const;

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

export interface MomoStatusResponse {
  status?: string;
  [key: string]: any;
}

export async function getCollectionToken(): Promise<string> {
  const url = `${MOMO_BASE}/collection/token/`;
  const res = await axios.post(url, "", {
    headers: { "Ocp-Apim-Subscription-Key": MOMO_COLLECTION_KEY },
    auth: { username: MOMO_API_USER, password: MOMO_API_KEY },
  });
  return res.data.access_token as string;
}

export async function getDisbursementsToken(): Promise<string> {
  const url = `${MOMO_BASE}/disbursement/token/`;
  const res = await axios.post(url, "", {
    headers: { "Ocp-Apim-Subscription-Key": MOMO_DISBURSEMENT_KEY },
    auth: { username: MOMO_API_USER, password: MOMO_API_KEY },
  });
  return res.data.access_token as string;
}

export async function requestToPay(params: {
  token: string;
  referenceId: string;
  amount: string;
  currency: string;
  msisdn: string;
  externalId: string;
}): Promise<void> {
  const { token, referenceId, amount, currency, msisdn, externalId } = params;
  const url = `${MOMO_BASE}/collection/v1_0/requesttopay`;

  await axios.post(
    url,
    {
      amount,
      currency,
      externalId,
      payer: { partyIdType: "MSISDN", partyId: msisdn },
      payerMessage: "Top-up",
      payeeNote: "PULA-PAY",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": MOMO_TARGET,
        "Ocp-Apim-Subscription-Key": MOMO_COLLECTION_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function getRequestToPayStatus(params: {
  token: string;
  referenceId: string;
}): Promise<MomoStatusResponse> {
  const { token, referenceId } = params;
  const url = `${MOMO_BASE}/collection/v1_0/requesttopay/${referenceId}`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": MOMO_TARGET,
      "Ocp-Apim-Subscription-Key": MOMO_COLLECTION_KEY,
    },
  });
  return data;
}

export async function transfer(params: {
  token: string;
  referenceId: string;
  amount: string;
  currency: string;
  msisdn: string;
  externalId: string;
}): Promise<void> {
  const { token, referenceId, amount, currency, msisdn, externalId } = params;
  const url = `${MOMO_BASE}/disbursement/v1_0/transfer`;

  await axios.post(
    url,
    {
      amount,
      currency,
      externalId,
      payee: { partyIdType: "MSISDN", partyId: msisdn },
      payerMessage: "PULA-PAY",
      payeeNote: "Withdraw",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": MOMO_TARGET,
        "Ocp-Apim-Subscription-Key": MOMO_DISBURSEMENT_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function getTransferStatus(params: {
  token: string;
  referenceId: string;
}): Promise<MomoStatusResponse> {
  const { token, referenceId } = params;
  const url = `${MOMO_BASE}/disbursement/v1_0/transfer/${referenceId}`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": MOMO_TARGET,
      "Ocp-Apim-Subscription-Key": MOMO_DISBURSEMENT_KEY,
    },
  });
  return data;
}