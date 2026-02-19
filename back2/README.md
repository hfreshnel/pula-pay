# Pula Pay v2 — Backend API

Universal African Money Account backend with Circle/USDC integration, MTN MoMo on/off-ramp, and double-entry accounting.

## Tech Stack

| Category       | Technology                                |
|----------------|-------------------------------------------|
| Framework      | Express.js 4.18                           |
| Language       | TypeScript 5.3 (strict mode)              |
| Database       | PostgreSQL 16 + Prisma 5.9                |
| Blockchain     | Circle Programmable Wallets               |
| Payment        | MTN MoMo API (collection + disbursement)  |
| Exchange Rates | CoinGecko API (cached in DB)              |
| Auth           | JWT (15m access / 7d refresh) + bcrypt    |
| Validation     | Zod                                       |
| Logging        | Pino (structured)                         |
| Testing        | Jest + ts-jest (70% coverage threshold)   |
| Math Precision | Decimal.js (18,6 for USDC)                |
| Security       | Helmet, CORS, rate limiting (100 req/min) |
| API Docs       | Swagger / OpenAPI                         |

## Architecture

Clean Architecture with CQRS (Command Query Responsibility Segregation):

```
src/
├── domain/                        # Core business logic (zero framework deps)
│   ├── entities/                  # User, Wallet, Transaction
│   ├── value-objects/             # Money, WalletAddress, ExchangeRate
│   ├── services/                  # LedgerService (double-entry accounting)
│   ├── ports/                     # Repository & Provider interfaces
│   │   └── repositories/         # UserRepo, WalletRepo, TransactionRepo, LedgerRepo
│   └── errors/                    # Domain exceptions
│
├── application/                   # Use cases
│   ├── commands/                  # 8 write handlers
│   ├── queries/                   # 6 read handlers
│   └── services/                  # CurrencyConversionService
│
├── infrastructure/                # External world
│   ├── adapters/
│   │   ├── circle/                # CircleWalletAdapter (blockchain)
│   │   ├── momo/                  # MomoOnRampAdapter (mobile money)
│   │   └── exchange/              # CoingeckoAdapter + CachedAdapter
│   ├── persistence/
│   │   ├── prisma/                # DB client
│   │   └── repositories/         # 4 Prisma repository implementations
│   └── http/
│       ├── controllers/           # Auth, Wallet, Webhook, ExchangeRate, Health
│       ├── middleware/            # auth, errorHandler, requestLogger
│       └── routes/                # Express router
│
└── shared/
    ├── config/                    # Env validation (Zod)
    ├── types/                     # ApiResponse, PaginatedResult, Result<T,E>
    └── utils/                     # Logger, encryption, idempotency
```

**Key principle:** Dependencies flow inward. Domain has no imports from application or infrastructure. Ports define contracts, adapters implement them.

## Domain Model

### Entities

#### User
```
Fields: id, phone, email, passwordHash, kycLevel, kycData, displayCurrency, locale, otpHash, otpExpiresAt
KYC Levels: NONE → BASIC → VERIFIED → ENHANCED
Daily Limits: $0 / $100 / $1,000 / $10,000
Methods: hasBasicKyc(), getDailyLimit(), setOtp(), upgradeKyc(), updateDisplayCurrency()
```

#### Wallet
```
Fields: id, userId, circleWalletId, walletSetId, address, blockchain, status, balanceUsdc
Status: PENDING → ACTIVE → FROZEN | CLOSED
Methods: credit(), debit(), syncBalance(), activate(), freeze(), close()
Guards: assertCanTransact() → WalletFrozenError, assertCanWithdraw() → InsufficientFundsError
```

#### Transaction
```
Fields: id, idempotencyKey, externalRef, type, status, amountUsdc, feeUsdc, exchangeRate,
        displayCurrency, displayAmount, walletId, counterpartyId, description, metadata, failureReason

Types: DEPOSIT_ONRAMP, DEPOSIT_CRYPTO, WITHDRAWAL_OFFRAMP, WITHDRAWAL_CRYPTO, TRANSFER_P2P, FEE, REFUND

State Machine:
  PENDING → PROCESSING, CANCELLED, EXPIRED, FAILED
  PROCESSING → COMPLETED, FAILED
  COMPLETED, FAILED, CANCELLED, EXPIRED → (terminal)

Methods: markProcessing(), complete(), fail(), cancel(), expire()
Computed: netAmountUsdc = amountUsdc - feeUsdc
```

### Value Objects

#### Money
Immutable amount in USDC + display currency. Factory methods `fromUsdc()` and `fromFiat()`. Operations: `add()`, `subtract()`, `multiply()`, `percentage()`. Comparison: `gte()`, `gt()`, `equals()`. Precision: 6 decimals USDC, 2 decimals fiat.

#### WalletAddress
Validates EVM addresses (0x format). Methods: `isTestnet()`, `abbreviated()` (0x1234...5678), `explorerUrl()`.

#### ExchangeRate
Rate with timestamp and source. Methods: `convertFromUsdc()`, `convertToUsdc()`, `isValid(ttlMinutes)`.

### Domain Services

#### LedgerService — Double-Entry Accounting
Every transaction creates balanced debit/credit entries. Invariant: sum of debits = sum of credits.

| Method                     | Flow                         |
|----------------------------|------------------------------|
| `createDepositEntries()`   | ESCROW → USER (minus fees)   |
| `createWithdrawalEntries()`| USER → ESCROW (plus fees)    |
| `createTransferEntries()`  | SENDER → RECEIVER            |
| `createFeeEntries()`       | USER → FEES                  |
| `createRefundEntries()`    | ESCROW → USER                |

Account types: `USER`, `ESCROW`, `FEES`, `LIQUIDITY`

### Domain Errors

| Error                         | HTTP | Trigger                           |
|-------------------------------|------|-----------------------------------|
| `InsufficientFundsError`      | 400  | Balance < requested amount        |
| `WalletFrozenError`           | 403  | Wallet not in ACTIVE status       |
| `WalletNotFoundError`         | 404  | Wallet lookup failed              |
| `UserNotFoundError`           | 404  | User lookup failed                |
| `TransactionNotFoundError`    | 404  | Transaction lookup failed         |
| `InvalidTransactionStateError`| 409  | Invalid state transition          |
| `LedgerImbalanceError`       | 500  | Debits ≠ credits (invariant)     |

## Use Cases

### Commands (Write Operations)

| Handler                      | Input                                          | What it does                                                    |
|------------------------------|-------------------------------------------------|-----------------------------------------------------------------|
| `CreateWalletHandler`        | userId, blockchain?                            | Creates Circle wallet, persists locally, activates if LIVE      |
| `ActivateWalletHandler`      | circleWalletId                                 | Transitions wallet PENDING → ACTIVE                             |
| `InitiateDepositHandler`     | userId, phone, fiatAmount, fiatCurrency        | Creates tx, initiates MoMo collection, starts polling fallback  |
| `ConfirmDepositHandler`      | providerRef, providerStatus                    | Credits wallet, creates ledger entries, requests faucet tokens  |
| `InitiateWithdrawalHandler`  | userId, phone, fiatAmount, targetCurrency      | Validates balance+fee, initiates MoMo disbursement              |
| `ExecuteTransferHandler`     | senderUserId, recipientPhone/address, amount   | Resolves wallets, executes Circle transfer, creates ledger      |
| `ExecuteSimpleTransferHandler`| senderUserId, recipientPhone, amount           | Simplified P2P without Circle API interaction                   |
| `SyncWalletStatusHandler`    | userId                                         | Queries Circle for latest wallet state and balance              |

### Queries (Read Operations)

| Handler                        | Input                              | Returns                                    |
|--------------------------------|------------------------------------|--------------------------------------------|
| `GetBalanceHandler`            | userId, displayCurrency?          | USDC balance + fiat conversion             |
| `GetTransactionHistoryHandler` | userId, type?, status?, dates?, page, limit | Paginated transactions with direction |
| `GetTransactionByIdHandler`    | userId, txId                      | Single transaction details                 |
| `GetWalletAddressHandler`      | userId                            | Wallet address + blockchain                |
| `GetExchangeRateHandler`       | currencies[]                      | Current rates with source + timestamp      |
| `ResolveRecipientHandler`      | phone? or address?                | Recipient wallet info                      |

## API Endpoints

All routes prefixed with `/api/v2`.

### Auth (Public)

```
POST   /auth/register       Register new user
POST   /auth/login          Login → { accessToken, refreshToken }
POST   /auth/request-otp    Send OTP to phone
POST   /auth/verify-otp     Verify OTP → upgrades KYC to BASIC
POST   /auth/refresh        Refresh access token
```

### Auth (Protected)

```
GET    /auth/me              Current user profile
PATCH  /auth/me              Update preferences (displayCurrency, locale)
```

### Exchange Rates (Public)

```
GET    /exchange-rates               Get rates (?currencies=EUR,XOF)
GET    /exchange-rates/preview       Conversion preview (?amount=100&from=EUR&to=USDC)
```

### Wallet (Protected — requires Bearer token)

```
POST   /wallet                       Create wallet (body: { blockchain? })
GET    /wallet/address               Get wallet address
GET    /wallet/balance               Get balance (?currency=XOF)
POST   /wallet/sync-status           Sync status with Circle
POST   /wallet/deposit               Initiate MoMo deposit
POST   /wallet/withdraw              Initiate MoMo withdrawal
POST   /wallet/transfer              P2P transfer (Circle on-chain)
POST   /wallet/transferable          Simple P2P transfer
GET    /wallet/transactions          Transaction history (?page=1&limit=20&type=&status=)
GET    /wallet/transactions/:txId    Single transaction
GET    /wallet/resolve-recipient     Lookup by ?phone= or ?address=
```

### Webhooks

```
POST   /webhooks/momo                MoMo payment callbacks
POST   /webhooks/circle              Circle wallet notifications
```

### Health

```
GET    /health                       Full health check (DB status)
GET    /ready                        Kubernetes readiness probe
GET    /live                         Kubernetes liveness probe
```

### Request/Response Format

All responses follow:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

Error responses:
```json
{
  "success": false,
  "error": { "code": "INSUFFICIENT_FUNDS", "message": "...", "details": {} }
}
```

### Example: Deposit Flow

```
POST /api/v2/wallet/deposit
Authorization: Bearer <token>
Content-Type: application/json

{ "phoneNumber": "+22890123456", "amount": 10000, "currency": "XOF" }

→ 202 Accepted
{
  "success": true,
  "data": {
    "transactionId": "clx...",
    "providerRef": "uuid-...",
    "status": "PROCESSING",
    "amountUsdc": "15.25",
    "displayAmount": "10000.00",
    "displayCurrency": "XOF"
  }
}
```

## Database Schema

8 tables managed by Prisma:

| Table                | Purpose                                           |
|----------------------|---------------------------------------------------|
| `users`              | Accounts with KYC levels, preferences, OTP        |
| `wallets`            | Circle wallets with local balance (Decimal 18,6)  |
| `transactions`       | All operations with state machine                 |
| `onramp_transactions`| MoMo-specific details (provider ref, fiat amount) |
| `ledger_entries`     | Double-entry accounting (debit/credit, balanceAfter)|
| `exchange_rates`     | Cached rates with TTL                             |
| `webhook_events`     | Webhook processing queue with retry count         |
| `system_accounts`    | ESCROW, FEES, LIQUIDITY balances                  |

### Key Enums

```
Blockchain:    POLYGON_AMOY, ETH_SEPOLIA, ARBITRUM_SEPOLIA, POLYGON, ARBITRUM, ETHEREUM
WalletStatus:  PENDING, ACTIVE, FROZEN, CLOSED
TxType:        DEPOSIT_ONRAMP, DEPOSIT_CRYPTO, WITHDRAWAL_OFFRAMP, WITHDRAWAL_CRYPTO, TRANSFER_P2P, FEE, REFUND
TxStatus:      PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, EXPIRED
KycLevel:      NONE, BASIC, VERIFIED, ENHANCED
Currency:      EUR, XOF, USD
AccountType:   USER, ESCROW, FEES, LIQUIDITY
EntryType:     DEBIT, CREDIT
OnRampProvider: MTN_MOMO, MOOV_MONEY, CELTIIS, ORANGE_MONEY, WAVE, BANK_TRANSFER
```

## External Integrations

### Circle Programmable Wallets

Adapter: `CircleWalletAdapter` implements `WalletProvider`

| Method                  | Circle API                        | Purpose                      |
|-------------------------|-----------------------------------|------------------------------|
| `createWallet()`        | POST /developer/wallets           | Create blockchain wallet     |
| `getWallet()`           | GET /wallets/{id}                 | Fetch wallet state           |
| `getBalance()`          | GET /wallets/{id}/balances        | Query USDC balance           |
| `transfer()`            | POST /developer/transactions/transfer | On-chain USDC transfer   |
| `getTransferStatus()`   | GET /transactions/{id}            | Poll transfer status         |
| `estimateFee()`         | POST /transactions/transfer/estimateFee | Gas fee estimate       |
| `requestTestnetTokens()`| POST /faucet/drips                | Request testnet USDC + gas   |

Blockchain mapping: `POLYGON_AMOY → MATIC-AMOY`, `ETH_SEPOLIA → ETH-SEPOLIA`, etc.

Entity secret encrypted with RSA public key before each API call.

### MTN MoMo API

Adapter: `MomoOnRampAdapter` implements `OnRampProvider`

| Method                | MoMo API                           | Purpose                     |
|-----------------------|------------------------------------|-----------------------------|
| `initiateDeposit()`   | POST /collection/v1_0/requesttopay | Request payment from user   |
| `getDepositStatus()`  | GET /collection/v1_0/requesttopay/{ref} | Check payment status   |
| `initiatePayout()`    | POST /disbursement/v1_0/transfer   | Send money to user          |
| `getPayoutStatus()`   | GET /disbursement/v1_0/transfer/{ref} | Check disbursement status|

Features:
- OAuth2 token caching with automatic refresh
- Currency conversion XOF ↔ EUR (MoMo sandbox only supports EUR)
- Polling fallback: 5s interval, 24 attempts (2 min max)
- Background polling as fire-and-forget when webhook may not arrive

### CoinGecko Exchange Rates

Two adapters (decorator pattern):
- `CoingeckoAdapter` — fetches live rates from CoinGecko API
- `CachedExchangeRateAdapter` — wraps upstream with DB caching (5 min TTL)

Fixed rate: 1 EUR = 655.957 XOF (CFA franc peg)

## Design Decisions

### Idempotency
Every command accepts an `idempotencyKey`. If a transaction with that key already exists, the handler returns the existing result instead of creating a duplicate. Safe to retry on network failures.

### Atomic Database Transactions
Wallet balance updates and ledger entries are persisted in a single Prisma `$transaction()` call. This prevents inconsistencies between balance and accounting records.

### Transaction State Machine
Transactions follow strict state transitions enforced by the entity. Invalid transitions throw `InvalidTransactionStateError`. Terminal states (COMPLETED, FAILED, CANCELLED, EXPIRED) cannot be changed.

### Polling Fallback
MoMo webhooks are unreliable. After initiating a deposit/withdrawal, the handler starts background polling (fire-and-forget). If the webhook arrives first, polling detects the terminal state and stops. If the webhook never arrives, polling completes the transaction.

### Decimal Precision
All financial math uses `Decimal.js`. USDC amounts stored with 6 decimal places (`Decimal(18,6)`), exchange rates with 8 (`Decimal(18,8)`), fiat amounts with 2 (`Decimal(18,2)`).

### Fee Structure
- Deposits: 1% fee deducted from credited USDC
- Withdrawals: 1.5% fee added to deducted USDC
- P2P Transfers: Free

## Environment Variables

```bash
# Server
NODE_ENV=development          # development | production | test
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pulapay_v2

# Circle
CIRCLE_API_KEY=TEST_API_KEY:...
CIRCLE_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
CIRCLE_ENTITY_SECRET=<hex-encoded-secret>
CIRCLE_WALLET_SET_ID=<uuid>
CIRCLE_ENVIRONMENT=sandbox    # sandbox | production

# Blockchain
DEFAULT_BLOCKCHAIN=POLYGON_AMOY
USDC_TOKEN_ID_POLYGON_AMOY=<circle-token-id>
USDC_TOKEN_ID_POLYGON=<circle-token-id>

# Exchange Rates
EXCHANGE_RATE_PROVIDER=coingecko
EXCHANGE_RATE_CACHE_TTL_MINUTES=5
COINGECKO_API_KEY=<api-key>
XOF_EUR_FIXED_RATE=655.957

# MTN MoMo
MTN_MOMO_API_KEY=<api-key>
MTN_MOMO_API_USER=<uuid>
MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY=<key>
MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY=<key>
MTN_MOMO_ENVIRONMENT=sandbox  # sandbox | production
MTN_MOMO_CALLBACK_URL=https://<ngrok-url>/webhooks/momo
MTN_MOMO_POLLING_INTERVAL_MS=5000
MTN_MOMO_POLLING_MAX_ATTEMPTS=24

# JWT
JWT_SECRET=<secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Scripts

```bash
npm run dev              # Start dev server (ts-node-dev, auto-reload)
npm run build            # Compile TypeScript → dist/
npm start                # Run compiled output
npm test                 # Run Jest tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:migrate:prod  # Run migrations (production)
npm run prisma:studio    # Open Prisma Studio (DB GUI)
npm run prisma:seed      # Seed database
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env     # Edit with your credentials

# Database
docker-compose up db -d  # Start PostgreSQL
npx prisma migrate dev   # Run migrations
npx prisma generate      # Generate client

# Start server
npm run dev              # http://localhost:3000

# Verify
curl http://localhost:3000/api/v2/health
```

## Testing

```bash
npm test                 # Run all tests
npm run test:coverage    # Coverage report (min 70% branches/functions/lines)
```

Tests are colocated in `__tests__/` folders next to source files. Path aliases (`@domain/*`, `@application/*`, `@infrastructure/*`, `@shared/*`) are configured in Jest.

## TypeScript Config

- Target: ES2022
- Strict mode enabled (noImplicitAny, strictNullChecks, noUnusedLocals, noUnusedParameters)
- Path aliases: `@domain/*`, `@application/*`, `@infrastructure/*`, `@shared/*`
- Declaration maps and source maps enabled
