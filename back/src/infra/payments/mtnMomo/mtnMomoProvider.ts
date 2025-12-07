import { EntryKind } from "@prisma/client";
import { getCollectionToken, getDisbursementsToken, getRequestToPayStatus, getTransferStatus, requestToPay, transfer } from "./momoClients.js";
import { PaymentProvider, PaymentStatus } from "../paymentProviderRegistry.js";

export const mtnMomoProvider: PaymentProvider = {
    code: "MTN_MOMO",

    async requestDeposit({ referenceId, amount, currency, msisdn, externalId }) {
        const token = await getCollectionToken();
        await requestToPay({ token, referenceId, amount, currency, msisdn, externalId });
    },

    async requestWithdrawal({ referenceId, amount, currency, msisdn, externalId }) {
    const token = await getDisbursementsToken();
    await transfer({ token, referenceId, amount, currency, msisdn, externalId });
  },

  async getStatus({ referenceId, kind }): Promise<PaymentStatus> {
    const token =
      kind === EntryKind.DEPOSIT
        ? await getCollectionToken()
        : await getDisbursementsToken();

    const raw =
      kind === EntryKind.DEPOSIT
        ? await getRequestToPayStatus({ token, referenceId })
        : await getTransferStatus({ token, referenceId });

    const status = (raw.status ?? "").toUpperCase();

    if (status === "SUCCESSFUL") return "SUCCESS";
    if (["FAILED", "REJECTED", "TIMEOUT"].includes(status)) return "FAILED";
    return "PENDING";
  },

};