export type UserDTO = {
    id: string;
    phone: string;
    email?: string;
    isVerified: boolean;
}

export type BalanceDTO = {
    amount: string;
    currency?: string;
};

export type Currency = "EUR" | "XOF";
export type TxStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
export type EntryKind =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "TRANSFER"
  | "REFUND"
  | "FEE"
  | "ADJUSTMENT";

export type TxDTO = {
  id: string;
  externalId?: string | null;
  idempotencyKey: string;
  status: TxStatus;
  kind: EntryKind;
  currency: string;
  amount: string; // Decimal -> string
  meta: Record<string, unknown>;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type DepositRequest = {
  amount: string;   // regex back: /^\d+(\.\d{1,6})?$/
  msisdn: string;   // regex back: /^\+?\d{7,15}$/
  currency?: Currency; // default back: "EUR"
};

export type WithdrawRequest = {
  amount: string;
  msisdn: string;
  currency?: Currency;
};

export type TransferRequest = {
  receiverId: string; // uuid
  amount: string;
  currency?: Currency;
};
