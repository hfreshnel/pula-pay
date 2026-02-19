# Pula Pay — Mobile App

Cross-platform fintech mobile app for USDC wallet management, mobile money on/off-ramp, and P2P transfers across Africa.

## Tech Stack

| Category       | Technology                                     |
|----------------|------------------------------------------------|
| Framework      | React Native 0.81 + Expo 54                    |
| Language       | TypeScript 5.9 (strict mode)                   |
| Routing        | Expo Router 6 (file-based, typed routes)        |
| State          | Zustand 5.0                                    |
| HTTP           | Axios 1.13                                     |
| i18n           | i18next 25 + react-i18next (EN, FR)            |
| Icons          | Lucide React Native 0.556                      |
| Phone Input    | react-native-international-phone-number 0.11   |
| QR Code        | react-native-qrcode-svg 6.3                    |
| Animations     | React Native Reanimated 4.1                    |
| Secure Storage | expo-secure-store 15 (Keychain / Keystore)     |
| Clipboard      | expo-clipboard 8                               |
| Gradients      | expo-linear-gradient 15                        |
| Build          | EAS Build (dev, preview, production profiles)  |
| React          | 19.1 (with React Compiler experiment)          |

## Project Structure

```
mobile/
├── src/
│   ├── app/                    # Expo Router screens (file-based routing)
│   │   ├── _layout.tsx         # Root layout (auth bootstrap, toast container)
│   │   ├── index.tsx           # Entry redirect
│   │   ├── (auth)/             # Auth stack
│   │   │   ├── _layout.tsx     # Stack navigator
│   │   │   ├── login.tsx       # Phone + password login
│   │   │   ├── register.tsx    # Phone + password + confirm
│   │   │   └── verify-otp.tsx  # 6-digit OTP verification
│   │   └── (main)/            # Main app (tab navigator)
│   │       ├── _layout.tsx     # Bottom tabs (4 tabs)
│   │       ├── dashboard.tsx   # Home: balance, quick actions, recent txs
│   │       ├── history.tsx     # Full transaction history
│   │       ├── profile.tsx     # User profile, preferences, logout
│   │       └── wallet/         # Nested stack
│   │           ├── _layout.tsx # Stack navigator
│   │           ├── index.tsx   # Wallet overview
│   │           ├── deposit.tsx # MoMo deposit
│   │           ├── withdraw.tsx# MoMo withdrawal
│   │           ├── transfert.tsx# P2P transfer
│   │           └── receive.tsx # QR code + address
│   ├── api/                    # HTTP layer
│   │   ├── client.ts           # Axios instance + interceptors + token refresh
│   │   ├── auth.ts             # Auth endpoints (separate client, no interceptors)
│   │   ├── wallet.ts           # Wallet, balance, transaction endpoints
│   │   ├── transactions.ts     # Transaction queries
│   │   ├── users.ts            # User preference updates
│   │   └── types.ts            # All DTOs, enums, request/response types
│   ├── store/                  # Zustand state management
│   │   ├── authStore.ts        # Auth state, tokens, bootstrap, login/logout
│   │   ├── walletStore.ts      # Wallet, balance, rates, transactions, operations
│   │   ├── toastStore.ts       # Toast notifications
│   │   ├── uiStore.ts          # Theme mode, language preference
│   │   └── types.ts            # Store type definitions
│   ├── components/             # React components
│   │   ├── ui/                 # Primitives
│   │   │   ├── button.tsx      # Primary/secondary/outline variants
│   │   │   ├── Input.tsx       # Text input with label + error
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── phone-input.tsx # International phone with country picker
│   │   │   ├── toast.tsx       # Single toast component
│   │   │   └── toast-container.tsx # Toast stack manager
│   │   ├── wallet-summary.tsx  # Gradient card: balance, actions, wallet creation
│   │   ├── balance-display.tsx # USDC + fiat balance (small/medium/large)
│   │   ├── quick-actions.tsx   # 6-card grid (deposit, receive, transfer, withdraw, ...)
│   │   ├── recent-transactions.tsx # Last 3 txs + "see all"
│   │   ├── transaction-item.tsx# Single tx row (icon, type, amount, status badge)
│   │   ├── transactions.tsx    # Full tx list with pull-to-refresh
│   │   ├── exchange-rate.tsx   # "1 USDC = X EUR" indicator + refresh
│   │   ├── qr-code.tsx        # QR from address + share button
│   │   ├── wallet-address.tsx  # Address display + copy + explorer link
│   │   ├── brand-header.tsx    # App header
│   │   ├── screen.tsx          # SafeArea + KeyboardAvoiding wrapper
│   │   └── error-boundary.tsx  # Catch render errors with retry
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-balance.ts      # Fetch balance
│   │   ├── use-conversion.ts   # USDC ↔ fiat conversion utilities
│   │   ├── use-exchange-rate.ts# Rate fetching with 5-min auto-refresh
│   │   ├── use-deposit.ts      # Deposit flow + status polling
│   │   ├── use-withdraw.ts     # Withdrawal flow + status polling
│   │   ├── use-transfert.ts    # Transfer flow + status polling
│   │   ├── use-transactions.ts # Transaction list fetching
│   │   ├── use-recipient-id.ts # Recipient lookup by phone
│   │   ├── use-wallet-address.ts# Address + copy + blockchain info
│   │   ├── use-theme.ts        # Current theme object
│   │   ├── use-styles.ts       # Memoized StyleSheet from theme
│   │   └── use-color-scheme.ts # System light/dark detection
│   ├── theme/                  # Theming
│   │   ├── index.ts            # Theme resolver (system/light/dark)
│   │   ├── types.ts            # Theme, ColorPalette, Spacing types
│   │   ├── light.ts            # Light palette (purple primary, white surface)
│   │   └── dark.ts             # Dark palette (light purple, navy background)
│   ├── i18n/                   # Translations
│   │   ├── index.ts            # i18next config (fallback: fr)
│   │   ├── en.json             # English translations
│   │   └── fr.json             # French translations
│   ├── utils/                  # Utilities
│   │   ├── api-error.ts        # Error code extraction + i18n key mapping
│   │   ├── phone.ts            # Phone/country code sanitization
│   │   ├── storage.ts          # Secure token storage abstraction
│   │   ├── transactions.ts     # Tx icons, formatting, sorting, filtering
│   │   └── logger.ts           # Structured logging (category + level)
│   └── constants/
│       ├── config.ts           # API_URL, IS_DEV flag
│       └── theme.ts            # Typography constants
├── assets/images/              # Icons, splash, adaptive icons
├── app.json                    # Expo config
├── eas.json                    # EAS Build profiles
├── tsconfig.json               # TypeScript (strict, @/* path alias)
└── package.json
```

## Navigation

### Route Map

```
/ (Root Layout — auth bootstrap + toast container)
├── /(auth)/ (Stack)
│   ├── login          Phone + password
│   ├── register       Phone + password + confirm
│   └── verify-otp     6-digit OTP → auto-login → wallet creation
│
└── /(main)/ (Bottom Tabs — protected, redirects if unauthenticated)
    ├── dashboard      Balance card, quick actions, recent transactions
    ├── wallet/ (Nested Stack)
    │   ├── index      Wallet overview
    │   ├── deposit    Method selection → amount → MoMo collection
    │   ├── withdraw   Amount → MoMo disbursement
    │   ├── transfert  Recipient phone → amount → P2P transfer
    │   └── receive    QR code + address + copy + share
    ├── history        Full transaction list
    └── profile        Preferences, display currency, logout
```

**Tab bar icons:** Home, Wallet, Clock, User (Lucide)

### Auth Guard

- Root layout calls `bootstrap()` on mount — loads stored tokens, validates session via `GET /auth/me`
- `(main)/_layout.tsx` redirects to `/(auth)/login` if `status === "unauthenticated"`
- `(auth)/_layout.tsx` redirects to `/(main)/dashboard` if `status === "authenticated"`

## State Management

### Auth Store

```typescript
State: {
  token: string | null
  refreshToken: string | null
  user: UserDTO | null
  status: "bootstrapping" | "authenticated" | "unauthenticated"
  error: AuthError | null
  bootstrapped: boolean
}

Methods:
  bootstrap()              // Load tokens from secure storage, validate with getMe()
  login(access, refresh)   // Store tokens, fetch user, sync wallet store currency
  logout()                 // Clear storage, reset wallet store
  refreshTokens()          // Use refresh token → new access token
  refreshUser()            // Re-fetch user profile
  setDisplayCurrency(c)    // Update backend + local user + wallet store
```

**Storage:** `expo-secure-store` on native (iOS Keychain, Android Keystore), `localStorage` on web. Keys: `auth_token`, `refresh_token`.

### Wallet Store

```typescript
State: {
  wallet: WalletDTO | null
  walletNotFound: boolean
  balanceUsdc: string | null
  displayBalance: string | null
  displayCurrency: "EUR" | "XOF"
  exchangeRates: Record<DisplayCurrency, ExchangeRateDTO> | null
  ratesLoading: boolean
  transactions: TxDTO[]
  loading: boolean
  error: string | null
}

Methods:
  fetchWallet()                    // GET /wallet/me
  fetchBalance(currency?)          // GET /wallet/balance?currency=
  fetchTransactions()              // GET /wallet/transactions
  fetchExchangeRates()             // GET /exchange-rates
  deposit(req, opts?)              // POST /wallet/deposit (idempotent)
  withdraw(req, opts?)             // POST /wallet/withdraw (idempotent)
  transfer(req, opts?)             // POST /wallet/transferable (idempotent)
  syncWalletStatus()               // POST /wallet/sync-status
  trackTransaction(txId)           // Poll every 2s until terminal state
  convertToDisplay(amountUsdc)     // USDC × rate, formatted with Intl
  convertToUsdc(displayAmount)     // displayAmount / rate, 6 decimals
  setDisplayCurrency(currency)     // Update + re-fetch balance
  reset()                          // Clear all data on logout
```

**Currency decimals:** EUR: 2, XOF: 0. Formatting uses `Intl.NumberFormat`.

### Toast Store

```typescript
State: { toasts: ToastItem[] }

ToastItem: { id, type, message, duration }
Types: "success" | "error" | "info" | "warning"
Default duration: 4000ms

API:
  toast.success(message, duration?)
  toast.error(message, duration?)
  toast.info(message, duration?)
  toast.warning(message, duration?)
```

### UI Store

```typescript
State: {
  theme: "system" | "light" | "dark"
  language: "fr" | "en"
}

Methods:
  setTheme(mode)
  setLanguage(lang)
```

## API Layer

### Client Configuration

Axios instance with:
- **Request interceptor:** Injects `Bearer` token, logs `→ METHOD URL`
- **Response interceptor:** Logs `← STATUS (duration)ms`
- **401 handler:** Queues failed requests, refreshes token, retries all queued requests. On refresh failure: logout.

Auth endpoints use a **separate client** (no interceptors) to avoid circular dependency during token refresh.

### Endpoints

#### Auth — Public

```
POST /auth/login              { phone, password }     → { accessToken, refreshToken, user }
POST /auth/register           { phone, password }     → { accessToken, refreshToken, user }
POST /auth/request-otp        { phone }               → { message, expiresIn, otp? }
POST /auth/verify-otp         { phone, otp }          → { accessToken, refreshToken, user }
POST /auth/refresh            { refreshToken }         → { accessToken, refreshToken }
```

#### Wallet — Protected

```
POST   /wallet                { blockchain? }         → { walletId, address, blockchain, status }
GET    /wallet/me                                     → WalletDTO
GET    /wallet/address                                → { walletId, address, blockchain, status }
POST   /wallet/sync-status                            → { walletId, previousStatus, currentStatus, wasUpdated }
GET    /wallet/balance        ?currency=EUR           → BalanceDTO
GET    /exchange-rates        ?currencies=EUR,XOF     → ExchangeRateDTO[]
POST   /wallet/deposit        + x-idempotency-key     → DepositResponse
POST   /wallet/withdraw       + x-idempotency-key     → WithdrawResponse
POST   /wallet/transferable   + x-idempotency-key     → TransferResponse
GET    /wallet/transactions                           → TxDTO[]
GET    /wallet/transactions/:txId                     → TxDTO
GET    /wallet/resolve-recipient ?phone=              → userId
```

#### Users — Protected

```
PATCH  /users/me/preferences  { displayCurrency }     → void
```

### Data Types

```typescript
// Enums
DisplayCurrency = "EUR" | "XOF"
Blockchain      = "POLYGON_AMOY" | "POLYGON" | "ARBITRUM"
WalletStatus    = "PENDING" | "ACTIVE" | "FROZEN"
TxStatus        = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED"
TxType          = "DEPOSIT_ONRAMP" | "DEPOSIT_CRYPTO" | "WITHDRAWAL_OFFRAMP" | "WITHDRAWAL_CRYPTO"
                | "TRANSFER_P2P" | "REFUND" | "FEE"
TxDirection     = "IN" | "OUT"
OnRampProvider  = "MTN_MOMO" | "ORANGE_MONEY" | "BANK_TRANSFER" | "CRYPTO"

// Key DTOs
UserDTO    = { id, phone, name?, firstName?, email?, isVerified?, displayCurrency, kycLevel? }
WalletDTO  = { id, userId, address, blockchain, status, createdAt }
BalanceDTO = { balanceUsdc, displayBalance, displayCurrency, exchangeRate, rateTimestamp }

TxDTO = {
  id, idempotencyKey, externalRef?, type, status, direction,
  amountUsdc, feeUsdc, displayAmount, displayCurrency, exchangeRate,
  walletId, counterpartyId?, counterpartyAddress?, description?, txHash?,
  createdAt, completedAt?
}

// Requests
DepositRequest  = { amount, currency, provider, msisdn? }
WithdrawRequest = { amount, currency, provider, msisdn? }
TransferRequest = { receiverId?, receiverPhone?, receiverAddress?, amount, currency, description? }
```

## Hooks

| Hook                          | Returns                                                             | Notes                                 |
|-------------------------------|---------------------------------------------------------------------|---------------------------------------|
| `useBalance()`                | `{ balance, loading, error, getBalance() }`                        | Fetches wallet balance                |
| `useConversion(currency)`     | `{ toDisplay(), toUsdc(), rate, loading, refresh() }`              | USDC ↔ fiat conversion utilities      |
| `useExchangeRate(currency)`   | `{ rate, loading, convert(), convertToUsdc(), refresh() }`         | Auto-refreshes every 5 minutes        |
| `useDeposit()`                | `{ txId, status, loading, error, startDeposit() }`                | Polls status every 1.5s after submit  |
| `useWithdraw()`               | `{ txId, status, loading, error, startWithdraw() }`               | Polls status every 1.5s after submit  |
| `useTransfert()`              | `{ txId, status, loading, error, startTransfer() }`               | Polls status every 1.5s after submit  |
| `useTransactions()`           | `{ transactions, loading, error, getTransactions() }`             | Fetch full tx list                    |
| `useRecipientId()`            | `{ recipientId, errorKey, errorCode, getPhoneUserId() }`          | Lookup recipient by phone             |
| `useWalletAddress()`          | `{ address, truncatedAddress, blockchain, copyToClipboard(), copied }` | Address + copy with 2s feedback  |
| `useTheme()`                  | `Theme`                                                             | Current theme (system/override)       |
| `useStyles(fn)`               | `StyleSheet`                                                        | Memoized styles from theme            |

## Screens

### Login

**Fields:** International phone input (country selector), password
**Validation:** Both required, valid country code
**Flow:** Sanitize phone → `POST /auth/login` → store tokens → redirect to dashboard

### Register

**Fields:** International phone input, password, confirm password
**Validation:** All required, passwords must match
**Flow:** `POST /auth/register` → navigate to verify-otp with formatted phone

### Verify OTP

**Params:** `phone` (from register)
**Fields:** 6-digit numeric input (maxLength 6)
**Flow:** Auto-requests OTP on mount → user enters code → `POST /auth/verify-otp` → auto-login → `POST /wallet` (non-blocking) → redirect to dashboard
**Features:** Resend OTP button, expiry display

### Dashboard

**Sections:**
1. Greeting with user name + formatted date
2. `WalletSummary` — gradient card with balance (eye toggle), USDC equivalent, 4 action buttons, refresh
3. `QuickActions` — 6-card grid (deposit, receive, transfer, withdraw, recharge\*, bills\*) \*disabled
4. `RecentTransactions` — last 3 txs, "see all" link, empty state
5. Promo card

### Deposit

**Step 1 — Method selection:**
- MTN Mobile Money (active)
- Orange Money (coming soon, disabled)
- Receive Crypto (redirects to /receive)

**Step 2 — Amount entry (MTN_MOMO):**
- Phone pre-filled from user profile
- Amount input
- Exchange rate indicator with refresh

**Step 3 — Success:**
- Method, amount, USDC equivalent, phone, transaction ID
- "View transactions" button

**Flow:** Sync wallet status → validate ACTIVE → `POST /wallet/deposit` → poll status → success

### Withdraw

**Display:** Available balance (fiat + USDC in parentheses)
**Fields:** Amount, method (fixed: MTN_MOMO), phone (pre-filled, disabled)
**Validation:** Balance >= estimated USDC amount
**Flow:** Sync wallet → `POST /wallet/withdraw` → poll → success

### Transfer

**Fields:** Recipient phone (international input), amount, optional note
**Recipient lookup:** Debounced 400ms → `GET /wallet/resolve-recipient?phone=` → "User found" or error
**Validation:** Recipient found, sufficient balance
**Flow:** Sync wallet → `POST /wallet/transferable` → poll → success

### Receive

**Display:**
- QR code generated from wallet address (200x200)
- Full address with copy button (2s feedback)
- Blockchain network name
- Testnet warning banner (if applicable)
- "Only USDC on correct network" warning
- Share button (system share sheet)

### History

Full transaction list with pull-to-refresh. Each item shows icon, type label, reference, date, signed amount, status badge with color.

### Profile

User info, display currency preference selector, logout button.

## Theme System

### Structure

```typescript
Theme = {
  mode: "light" | "dark"
  colors: ColorPalette
  spacing: { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48 }
  borderRadius: { s: 4, m: 8, l: 12, full: 9999 }
  typography: { h1, h2, body, caption }
}
```

### Palettes

| Token        | Light     | Dark      |
|--------------|-----------|-----------|
| Primary      | `#7c3aed` | `#a78bfa` |
| Primary Dark | `#6d28d9` | `#7c3aed` |
| On Primary   | `#FFFFFF` | `#FFFFFF` |
| Background   | `#F8FAFC` | `#0F172A` |
| Surface      | `#FFFFFF` | `#1E293B` |
| Text         | `#1E293B` | `#F8FAFC` |
| Success      | `#22c55e` | `#4ade80` |
| Danger       | `#ef4444` | `#f87171` |
| Warning      | `#f59e0b` | `#fbbf24` |

### Typography

```
h1:      fontSize 28, fontWeight 700, lineHeight 36
h2:      fontSize 20, fontWeight 600, lineHeight 28
body:    fontSize 14, fontWeight 400, lineHeight 20
caption: fontSize 12, fontWeight 400, lineHeight 16
```

Automatic light/dark from device settings, manual override via `uiStore.setTheme()`.

## Internationalization

**Config:** Default language from device locale, fallback to French (`fr`).

**Supported languages:** English (`en`), French (`fr`)

**Key namespaces:**

| Namespace          | Content                                       |
|--------------------|-----------------------------------------------|
| `login.*`          | Auth screen labels and buttons                |
| `register.*`       | Registration, OTP labels                      |
| `wallet.*`         | Balance labels, action buttons, wallet prompts|
| `deposit.*`        | Deposit screen labels                         |
| `withdraw.*`       | Withdrawal screen labels                      |
| `transfer.*`       | Transfer screen labels                        |
| `receive.*`        | Receive screen labels                         |
| `transactions.*`   | History, type labels, status labels           |
| `quickActions.*`   | Dashboard action cards (title, subtitle)      |
| `currencies.*`     | Currency display names                        |
| `apiErrors.*`      | Error code → user-friendly messages           |
| `validation.*`     | Form validation messages                      |
| `common.*`         | Shared labels (cancel, confirm, loading)      |

## Error Handling

### API Error Flow

```
Axios error → getApiError(error)
  → { code: ApiErrorCode, translationKey: string, message: string | null }
  → t(translationKey) for user-facing message
  → toast.error() or inline error display
```

### Error Codes

| Code                 | Translation Key                 |
|----------------------|---------------------------------|
| VALIDATION_ERROR     | apiErrors.VALIDATION_ERROR      |
| USER_EXISTS          | apiErrors.USER_EXISTS           |
| PHONE_EXISTS         | apiErrors.PHONE_EXISTS          |
| INVALID_CREDENTIALS  | apiErrors.INVALID_CREDENTIALS   |
| OTP_EXPIRED          | apiErrors.OTP_EXPIRED           |
| WALLET_NOT_FOUND     | apiErrors.WALLET_NOT_FOUND      |
| WALLET_PENDING       | apiErrors.WALLET_PENDING        |
| WALLET_FROZEN        | apiErrors.WALLET_FROZEN         |
| INSUFFICIENT_FUNDS   | apiErrors.INSUFFICIENT_FUNDS    |
| NETWORK_ERROR        | apiErrors.NETWORK_ERROR         |
| INTERNAL_ERROR       | apiErrors.INTERNAL_ERROR        |
| UNKNOWN_ERROR        | apiErrors.UNKNOWN_ERROR         |

### Error Boundary

Class component wrapping the app. Catches render errors, displays error message with stack trace and retry button.

## Utilities

### Logger

```typescript
Categories: "API" | "AUTH" | "WALLET" | "UI" | "APP"
Levels: "debug" | "info" | "warn" | "error"
Format: [HH:MM:SS] LEVEL [CATEGORY] message data
```

Dev: all levels. Prod: warn + error only. Optional `setRemoteHandler()` for crash reporting.

### Transaction Utils

```typescript
getTxIcon(type)                         // TxType → Lucide icon component
getStatusColors(status, theme)          // → { bg, text } colors
formatAmount(amount, currency, locale)  // Intl.NumberFormat
formatTxDate(dateStr, locale, year?)    // Locale-aware date
sortByDateDesc(transactions)            // Sort newest first
filterTransactions(transactions, query) // Search filter
isCredit(direction)                     // "IN" → true
```

### Phone Utils

```typescript
sanitizeCountryCode(code)    // "+229" → "229"
sanitizePhoneNumber(phone)   // Remove whitespace
```

### Storage

Abstraction over `expo-secure-store` (native) / `localStorage` (web):
```typescript
saveToken(token)      // Store access token
getToken()            // Retrieve access token
removeToken()         // Delete access token
```

## Build & Deploy

### EAS Build Profiles

| Profile          | Purpose           | Distribution | Format |
|------------------|-------------------|-------------|--------|
| `development`    | Dev client builds | internal    | —      |
| `preview`        | Internal testing  | internal    | APK    |
| `production`     | App store release | —           | AAB    |
| `production-apk` | Direct APK        | —           | APK    |

Auto-increment version enabled for production profiles.

### App Configuration

```
Name:               PulaPay
Scheme:             pulapay
Bundle ID (iOS):    com.freshnelhouenou.pulapay
Package (Android):  com.freshnelhouenou.pulapay
Orientation:        portrait
New Architecture:   enabled
React Compiler:     enabled (experiment)
Typed Routes:       enabled (experiment)
```

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npm start

# Platform-specific
npm run android
npm run ios
npm run web

# Lint
npm run lint
```

### API Configuration

Edit `src/constants/config.ts`:
```typescript
export const API_URL = "http://<your-local-ip>:3000/api/v2";
```

Use your local network IP for device testing (not `localhost`).

## Key Patterns

- **Idempotency** — All transaction requests include `x-idempotency-key` header to prevent duplicates on retry
- **Token refresh queue** — On 401, requests queue while token refreshes, then all retry with new token
- **Wallet sync before operations** — Every deposit/withdraw/transfer syncs wallet status with Circle first
- **Transaction polling** — After submitting an operation, polls status every 1.5–2s until terminal state
- **Debounced recipient lookup** — 400ms delay before querying recipient by phone number
- **Dual currency display** — All amounts shown in both USDC and user's preferred fiat currency
- **Secure storage** — Tokens encrypted at rest on native platforms (iOS Keychain / Android Keystore)
- **Separate auth client** — Auth API uses its own Axios instance without interceptors to avoid circular refresh loops
