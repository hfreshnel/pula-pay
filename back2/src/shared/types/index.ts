import { Currency, Blockchain, TxStatus, TxType, KycLevel, WalletStatus } from '@prisma/client';

// Re-export Prisma types for convenience
export { Currency, Blockchain, TxStatus, TxType, KycLevel, WalletStatus };

// Common result types
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

// Transaction-specific types
export interface TransactionDisplayInfo {
  amountUsdc: string;
  displayAmount: string;
  displayCurrency: Currency;
  exchangeRate: string;
}
