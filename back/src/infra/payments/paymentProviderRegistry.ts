import { EntryKind } from "@prisma/client";
import { mtnMomoProvider } from "./mtnMomo/mtnMomoProvider.js";

export type PaymentProviderCode = "MTN_MOMO";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PaymentProvider {
  code: PaymentProviderCode;

  requestDeposit(input: {
    referenceId: string;
    amount: string;
    currency: string;
    msisdn: string;
    externalId: string;
  }): Promise<void>;

  requestWithdrawal(input: {
    referenceId: string;
    amount: string;
    currency: string;
    msisdn: string;
    externalId: string;
  }): Promise<void>;

  getStatus(input: {
    referenceId: string;
    kind: EntryKind;
  }): Promise<PaymentStatus>;
}

const providers: Record<PaymentProviderCode, PaymentProvider> = {
  MTN_MOMO: mtnMomoProvider,
};

export function getPaymentProvider(providerCode: PaymentProviderCode): PaymentProvider {
  const provider = providers[providerCode];
  if (!provider) {
    throw new Error(`Unknown payment provider: ${providerCode}`);
  }
  return provider;
}

export const defaultPaymentProviderCode: PaymentProviderCode = "MTN_MOMO";
