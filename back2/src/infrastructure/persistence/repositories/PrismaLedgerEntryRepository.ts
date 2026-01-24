import Decimal from 'decimal.js';
import { PrismaClient, LedgerEntry as PrismaLedgerEntry } from '@prisma/client';
import { LedgerEntry } from '../../../domain/services/LedgerService';
import {
  LedgerEntryRepository,
  LedgerEntryRecord,
  LedgerEntryFilters,
} from '../../../domain/ports/repositories/LedgerEntryRepository';
import { PaginationParams, PaginatedResult } from '../../../shared/types';

export class PrismaLedgerEntryRepository implements LedgerEntryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(entry: LedgerEntry): Promise<LedgerEntryRecord> {
    const created = await this.prisma.ledgerEntry.create({
      data: {
        transactionId: entry.transactionId,
        walletId: entry.walletId,
        accountType: entry.accountType,
        amountUsdc: entry.amountUsdc.toNumber(),
        entryType: entry.entryType,
        balanceAfter: entry.balanceAfter.toNumber(),
      },
    });
    return this.toDomain(created);
  }

  async createMany(entries: LedgerEntry[]): Promise<LedgerEntryRecord[]> {
    // Prisma createMany doesn't return created records, so we use a transaction
    const created = await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.ledgerEntry.create({
          data: {
            transactionId: entry.transactionId,
            walletId: entry.walletId,
            accountType: entry.accountType,
            amountUsdc: entry.amountUsdc.toNumber(),
            entryType: entry.entryType,
            balanceAfter: entry.balanceAfter.toNumber(),
          },
        })
      )
    );
    return created.map((e) => this.toDomain(e));
  }

  async findByTransactionId(transactionId: string): Promise<LedgerEntryRecord[]> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });
    return entries.map((e) => this.toDomain(e));
  }

  async findByWalletId(
    walletId: string,
    filters?: LedgerEntryFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<LedgerEntryRecord>> {
    const where = {
      walletId,
      ...(filters?.accountType && { accountType: filters.accountType }),
      ...(filters?.fromDate || filters?.toDate
        ? {
            createdAt: {
              ...(filters.fromDate && { gte: filters.fromDate }),
              ...(filters.toDate && { lte: filters.toDate }),
            },
          }
        : {}),
    };

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const [total, entries] = await Promise.all([
      this.prisma.ledgerEntry.count({ where }),
      this.prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: entries.map((e) => this.toDomain(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private toDomain(prismaEntry: PrismaLedgerEntry): LedgerEntryRecord {
    return {
      id: prismaEntry.id,
      transactionId: prismaEntry.transactionId,
      walletId: prismaEntry.walletId,
      accountType: prismaEntry.accountType,
      amountUsdc: new Decimal(prismaEntry.amountUsdc.toString()),
      entryType: prismaEntry.entryType,
      balanceAfter: new Decimal(prismaEntry.balanceAfter.toString()),
      createdAt: prismaEntry.createdAt,
    };
  }
}
