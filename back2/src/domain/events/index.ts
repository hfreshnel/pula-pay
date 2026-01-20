/**
 * Domain events for event-driven architecture
 */

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  payload: Record<string, unknown>;
}

export interface WalletCreatedEvent extends DomainEvent {
  eventType: 'WALLET_CREATED';
  payload: {
    walletId: string;
    userId: string;
    address: string;
    blockchain: string;
  };
}

export interface DepositCompletedEvent extends DomainEvent {
  eventType: 'DEPOSIT_COMPLETED';
  payload: {
    transactionId: string;
    walletId: string;
    amountUsdc: string;
    provider: string;
  };
}

export interface WithdrawalCompletedEvent extends DomainEvent {
  eventType: 'WITHDRAWAL_COMPLETED';
  payload: {
    transactionId: string;
    walletId: string;
    amountUsdc: string;
    provider: string;
  };
}

export interface TransferExecutedEvent extends DomainEvent {
  eventType: 'TRANSFER_EXECUTED';
  payload: {
    transactionId: string;
    senderWalletId: string;
    receiverWalletId: string;
    amountUsdc: string;
  };
}

export interface TransactionFailedEvent extends DomainEvent {
  eventType: 'TRANSACTION_FAILED';
  payload: {
    transactionId: string;
    walletId: string;
    reason: string;
  };
}

export type AnyDomainEvent =
  | WalletCreatedEvent
  | DepositCompletedEvent
  | WithdrawalCompletedEvent
  | TransferExecutedEvent
  | TransactionFailedEvent;
