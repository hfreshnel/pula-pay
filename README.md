# Pula Pay

Universal African Money Account — a fintech platform enabling USDC wallet management, fiat on/off-ramp via mobile money, and peer-to-peer transfers across Africa.

## Overview

Pula Pay lets users deposit money from MTN Mobile Money, hold it as USDC on blockchain, send to other users instantly for free, and withdraw back to mobile money at any time. It supports multi-currency display (EUR, XOF, USD) with live exchange rates.

## Project Structure

```
pula-pay/
├── back2/                # Backend API (Express + TypeScript)
├── mobile/               # Mobile app (React Native + Expo)
└── docker-compose.yml    # PostgreSQL infrastructure
```

## Tech Stack

### Backend (`back2/`)

| Category        | Technology                          |
|-----------------|-------------------------------------|
| Framework       | Express.js                          |
| Language        | TypeScript (strict mode)            |
| Database        | PostgreSQL + Prisma ORM             |
| Blockchain      | Circle Programmable Wallets         |
| Payment         | MTN MoMo API (on/off-ramp)          |
| Exchange Rates  | CoinGecko API (cached)              |
| Auth            | JWT + bcrypt                        |
| Validation      | Zod                                 |
| Logging         | Pino                                |
| Testing         | Jest                                |
| Math Precision  | Decimal.js                          |

### Mobile (`mobile/`)

| Category        | Technology                          |
|-----------------|-------------------------------------|
| Framework       | React Native 0.81 + Expo 54        |
| Routing         | Expo Router (file-based)            |
| State           | Zustand                             |
| HTTP Client     | Axios                               |
| i18n            | i18next (EN, FR)                    |
| Icons           | Lucide React Native                 |
| Animations      | React Native Reanimated             |
| Secure Storage  | expo-secure-store                   |
| QR Codes        | react-native-qrcode-svg             |

## Architecture

### Backend — Clean / Hexagonal Architecture

```
back2/src/
├── domain/                    # Core business logic (no framework deps)
│   ├── entities/              # User, Wallet, Transaction
│   ├── value-objects/         # Money, WalletAddress, ExchangeRate
│   ├── services/              # LedgerService (double-entry accounting)
│   ├── ports/                 # Repository & Provider interfaces
│   └── errors/                # Domain exceptions
├── application/               # Use cases (Command/Query pattern)
│   ├── commands/              # 8 state-changing handlers
│   ├── queries/               # 6 read-only handlers
│   └── services/              # CurrencyConversionService
└── infrastructure/            # External integrations
    ├── adapters/              # Circle, MoMo, CoinGecko
    ├── persistence/           # Prisma repositories
    └── http/                  # Controllers, routes, middleware
```

Dependencies flow inward. The domain layer has zero framework dependencies. Ports define contracts, adapters implement them.

### Mobile — Feature-Based with Expo Router

```
mobile/src/
├── app/
│   ├── (auth)/                # Login, Register, OTP verification
│   └── (main)/               # Dashboard, Wallet, History, Profile
│       └── wallet/            # Deposit, Withdraw, Transfer, Receive
├── api/                       # Axios client + endpoint modules
├── store/                     # Zustand stores (auth, wallet, toast)
├── components/                # Reusable UI components
├── hooks/                     # Custom hooks (useBalance, useDeposit, etc.)
├── theme/                     # Light/dark theme system
├── i18n/                      # Translations (EN, FR)
└── utils/                     # Error handling, logging, formatting
```

## Features

### Wallet Management
- Create Circle-managed USDC wallets on blockchain (Polygon Amoy, Ethereum Sepolia, Arbitrum Sepolia)
- Real-time balance tracking in USDC with fiat display conversion
- Wallet address sharing via QR code

### Fiat On-Ramp (Deposit)
- MTN Mobile Money collection (XOF/EUR to USDC)
- Background polling fallback if webhook doesn't arrive
- Automatic testnet token faucet on deposit confirmation

### Fiat Off-Ramp (Withdrawal)
- MTN Mobile Money disbursement (USDC to XOF/EUR)
- Balance + fee validation before processing

### Peer-to-Peer Transfers
- Send USDC to other users by phone number or wallet address
- Recipient lookup and validation
- Free transfers (no fees)

### Transaction Tracking
- Full transaction history with pagination and filtering
- State machine: PENDING → PROCESSING → COMPLETED / FAILED / CANCELLED / EXPIRED
- Real-time status polling (2s intervals on mobile)

### Authentication & KYC
- Phone-based registration with OTP verification
- JWT authentication with automatic token refresh
- Progressive KYC levels with transaction limits:
  - NONE: $0/day
  - BASIC: $100/day
  - VERIFIED: $1,000/day
  - ENHANCED: $10,000/day

### Exchange Rates
- Live USDC/fiat rates via CoinGecko
- Cached in database (5 min TTL)
- Conversion preview endpoint

### Financial Accounting
- Double-entry ledger (every transaction creates balanced debit/credit entries)
- Account types: USER, ESCROW, FEES, LIQUIDITY
- Full audit trail

### Fee Structure
- Deposits: 1%
- Withdrawals: 1.5%
- P2P Transfers: Free

## API Endpoints

### Auth
| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| POST   | /auth/register       | Register new user        |
| POST   | /auth/login          | Login with phone/password|
| POST   | /auth/request-otp    | Request OTP              |
| POST   | /auth/verify-otp     | Verify OTP               |
| POST   | /auth/refresh        | Refresh access token     |
| GET    | /auth/me             | Get current user         |
| PATCH  | /auth/me             | Update preferences       |

### Exchange Rates
| Method | Endpoint                     | Description          |
|--------|------------------------------|----------------------|
| GET    | /exchange-rates              | Get current rates    |
| GET    | /exchange-rates/preview      | Conversion preview   |

### Wallet (Protected)
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| POST   | /wallet                      | Create wallet            |
| GET    | /wallet/address              | Get wallet address       |
| GET    | /wallet/balance              | Get balance              |
| POST   | /wallet/sync-status          | Sync with Circle         |
| POST   | /wallet/deposit              | Initiate deposit         |
| POST   | /wallet/withdraw             | Initiate withdrawal      |
| POST   | /wallet/transfer             | P2P transfer             |
| GET    | /wallet/transactions         | Transaction history      |
| GET    | /wallet/transactions/:txId   | Transaction details      |

### Webhooks
| Method | Endpoint             | Description                |
|--------|----------------------|----------------------------|
| POST   | /webhooks/momo       | MoMo payment callbacks     |
| POST   | /webhooks/circle     | Circle wallet notifications|

### Health
| Method | Endpoint  | Description         |
|--------|-----------|---------------------|
| GET    | /health   | Full health check   |
| GET    | /ready    | Readiness probe     |
| GET    | /live     | Liveness probe      |

## Database Schema

Core tables managed by Prisma:

- **users** — Accounts with KYC levels and preferences
- **wallets** — Circle wallets with local balance sync
- **transactions** — All operations with state machine
- **onramp_transactions** — MoMo-specific details
- **ledger_entries** — Double-entry accounting records
- **exchange_rates** — Cached rates with TTL
- **webhook_events** — Webhook processing queue
- **system_accounts** — ESCROW, FEES, LIQUIDITY accounts

## Infrastructure

**Docker Compose** provides:
- PostgreSQL 16 with health checks and persistent volumes

**Supported Blockchains:**
- Polygon Amoy (testnet, default)
- Ethereum Sepolia (testnet)
- Arbitrum Sepolia (testnet)
- Mainnet equivalents ready

## Key Design Decisions

- **Idempotency** — Every command uses idempotency keys to prevent duplicate processing
- **Atomic transactions** — Wallet balance updates + ledger entries in a single Prisma transaction
- **State machine** — Transactions follow strict valid state transitions
- **Polling fallback** — If MoMo webhooks don't arrive, background polling completes transactions
- **Decimal precision** — All financial math uses Decimal.js (6 decimals for USDC, 2 for fiat)
- **Secure storage** — Mobile tokens stored in iOS Keychain / Android Keystore

## Getting Started

### Backend

```bash
cd back2
npm install
npx prisma migrate dev
npm run dev
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

### Docker (Database)

```bash
docker-compose up db
```
