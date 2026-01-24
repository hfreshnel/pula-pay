import { LedgerEntry } from '../../services/LedgerService';
import { PaginationParams, PaginatedResult } from '../../../shared/types';

export interface LedgerEntryFilters {
  walletId?: string;
  accountType?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface LedgerEntryRecord extends LedgerEntry {
  id: string;
  createdAt: Date;
}

/**
 * Repository port for LedgerEntry persistence
 */
export interface LedgerEntryRepository {
  create(entry: LedgerEntry): Promise<LedgerEntryRecord>;
  createMany(entries: LedgerEntry[]): Promise<LedgerEntryRecord[]>;
  findByTransactionId(transactionId: string): Promise<LedgerEntryRecord[]>;
  findByWalletId(
    walletId: string,
    filters?: LedgerEntryFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<LedgerEntryRecord>>;
}
