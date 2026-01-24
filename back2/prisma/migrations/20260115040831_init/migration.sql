-- CreateEnum
CREATE TYPE "KycLevel" AS ENUM ('NONE', 'BASIC', 'VERIFIED', 'ENHANCED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('EUR', 'XOF', 'USD');

-- CreateEnum
CREATE TYPE "Blockchain" AS ENUM ('POLYGON_AMOY', 'ETH_SEPOLIA', 'ARBITRUM_SEPOLIA', 'POLYGON', 'ARBITRUM', 'ETHEREUM');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('PENDING', 'ACTIVE', 'FROZEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('DEPOSIT_ONRAMP', 'DEPOSIT_CRYPTO', 'WITHDRAWAL_OFFRAMP', 'WITHDRAWAL_CRYPTO', 'TRANSFER_P2P', 'REFUND', 'FEE');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OnRampProvider" AS ENUM ('MTN_MOMO', 'MOOV_MONEY', 'CELTIIS', 'ORANGE_MONEY', 'WAVE', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('USER', 'ESCROW', 'FEES', 'LIQUIDITY');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "kycLevel" "KycLevel" NOT NULL DEFAULT 'NONE',
    "kycData" JSONB,
    "displayCurrency" "Currency" NOT NULL DEFAULT 'XOF',
    "locale" TEXT NOT NULL DEFAULT 'fr-BJ',
    "otpHash" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "circleWalletId" TEXT NOT NULL,
    "walletSetId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "blockchain" "Blockchain" NOT NULL DEFAULT 'POLYGON_AMOY',
    "status" "WalletStatus" NOT NULL DEFAULT 'PENDING',
    "balanceUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "externalRef" TEXT,
    "type" "TxType" NOT NULL,
    "status" "TxStatus" NOT NULL DEFAULT 'PENDING',
    "amountUsdc" DECIMAL(18,6) NOT NULL,
    "feeUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "exchangeRate" DECIMAL(18,8),
    "displayCurrency" "Currency",
    "displayAmount" DECIMAL(18,2),
    "walletId" TEXT NOT NULL,
    "counterpartyId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onramp_transactions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "provider" "OnRampProvider" NOT NULL,
    "providerRef" TEXT NOT NULL,
    "fiatCurrency" "Currency" NOT NULL,
    "fiatAmount" DECIMAL(18,2) NOT NULL,
    "providerStatus" TEXT NOT NULL,
    "providerData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onramp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "walletId" TEXT,
    "accountType" "AccountType" NOT NULL,
    "amountUsdc" DECIMAL(18,6) NOT NULL,
    "entryType" "EntryType" NOT NULL,
    "balanceAfter" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" "Currency" NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_accounts" (
    "id" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "balanceUsdc" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_circleWalletId_key" ON "wallets"("circleWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_circleWalletId_idx" ON "wallets"("circleWalletId");

-- CreateIndex
CREATE INDEX "wallets_address_idx" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_status_idx" ON "wallets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_externalRef_key" ON "transactions"("externalRef");

-- CreateIndex
CREATE INDEX "transactions_walletId_createdAt_idx" ON "transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_externalRef_idx" ON "transactions"("externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "onramp_transactions_transactionId_key" ON "onramp_transactions"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "onramp_transactions_providerRef_key" ON "onramp_transactions"("providerRef");

-- CreateIndex
CREATE INDEX "onramp_transactions_provider_idx" ON "onramp_transactions"("provider");

-- CreateIndex
CREATE INDEX "onramp_transactions_providerRef_idx" ON "onramp_transactions"("providerRef");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_createdAt_idx" ON "ledger_entries"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_transactionId_idx" ON "ledger_entries"("transactionId");

-- CreateIndex
CREATE INDEX "ledger_entries_accountType_idx" ON "ledger_entries"("accountType");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_externalId_key" ON "webhook_events"("externalId");

-- CreateIndex
CREATE INDEX "webhook_events_provider_eventType_idx" ON "webhook_events"("provider", "eventType");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "exchange_rates_quoteCurrency_validFrom_idx" ON "exchange_rates"("quoteCurrency", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_baseCurrency_quoteCurrency_validFrom_key" ON "exchange_rates"("baseCurrency", "quoteCurrency", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "system_accounts_accountType_key" ON "system_accounts"("accountType");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onramp_transactions" ADD CONSTRAINT "onramp_transactions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
