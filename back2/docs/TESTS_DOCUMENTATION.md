# Pula Pay v2 - Documentation des Tests

**Version** : 1.0
**Date** : Janvier 2026
**Objectif** : Documentation complète de la suite de tests automatisés

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Configuration](#2-configuration)
3. [Structure des Tests](#3-structure-des-tests)
4. [Fixtures et Mocks](#4-fixtures-et-mocks)
5. [Tests Domain Layer](#5-tests-domain-layer)
6. [Tests Application Layer](#6-tests-application-layer)
7. [Tests Infrastructure Layer](#7-tests-infrastructure-layer)
8. [Exécution des Tests](#8-exécution-des-tests)
9. [Couverture de Code](#9-couverture-de-code)

---

## 1. Vue d'Ensemble

### 1.1 Stack de Tests

| Composant | Technologie |
|-----------|-------------|
| Framework | Jest 29.7.0 |
| TypeScript | ts-jest 29.1.2 |
| Assertions | Jest built-in |
| Mocking | Jest mocks |

### 1.2 Philosophie de Tests

La suite de tests suit une **architecture en couches** alignée avec l'architecture hexagonale du projet :

```
┌─────────────────────────────────────────────────────────────┐
│                    TESTS E2E (à venir)                       │
│              Scénarios complets utilisateur                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              TESTS INFRASTRUCTURE LAYER                      │
│         Controllers HTTP, Validation, Repositories           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│               TESTS APPLICATION LAYER                        │
│            Command Handlers, Query Handlers                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  TESTS DOMAIN LAYER                          │
│         Entities, Value Objects, Domain Services             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Statistiques

| Catégorie | Fichiers de Tests | Cas de Tests |
|-----------|-------------------|--------------|
| Domain - Entities | 3 | ~70 |
| Domain - Value Objects | 3 | ~80 |
| Domain - Services | 1 | ~25 |
| Domain - Errors | 1 | ~15 |
| Application - Commands | 2 | ~25 |
| Application - Queries | 1 | ~12 |
| Infrastructure - Controllers | 2 | ~45 |
| **Total** | **13** | **~270** |

---

## 2. Configuration

### 2.1 Fichier de Configuration Jest

**Fichier** : `jest.config.ts`

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  testTimeout: 10000,
};

export default config;
```

### 2.2 Path Aliases

Les tests utilisent les mêmes alias que le code source :

| Alias | Chemin |
|-------|--------|
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@infrastructure/*` | `src/infrastructure/*` |
| `@shared/*` | `src/shared/*` |

---

## 3. Structure des Tests

### 3.1 Arborescence

```
src/
├── __tests__/
│   ├── fixtures/
│   │   ├── index.ts
│   │   ├── user.fixture.ts
│   │   ├── wallet.fixture.ts
│   │   ├── transaction.fixture.ts
│   │   └── exchange-rate.fixture.ts
│   │
│   └── mocks/
│       ├── index.ts
│       ├── repositories.mock.ts
│       └── adapters.mock.ts
│
├── domain/
│   ├── entities/
│   │   └── __tests__/
│   │       ├── User.test.ts
│   │       ├── Wallet.test.ts
│   │       └── Transaction.test.ts
│   │
│   ├── value-objects/
│   │   └── __tests__/
│   │       ├── Money.test.ts
│   │       ├── ExchangeRate.test.ts
│   │       └── WalletAddress.test.ts
│   │
│   ├── services/
│   │   └── __tests__/
│   │       └── LedgerService.test.ts
│   │
│   └── errors/
│       └── __tests__/
│           └── DomainErrors.test.ts
│
├── application/
│   ├── commands/
│   │   └── __tests__/
│   │       ├── CreateWalletHandler.test.ts
│   │       └── InitiateDepositHandler.test.ts
│   │
│   └── queries/
│       └── __tests__/
│           └── GetBalanceHandler.test.ts
│
└── infrastructure/
    └── http/
        └── controllers/
            └── __tests__/
                ├── WalletController.test.ts
                └── AuthController.test.ts
```

---

## 4. Fixtures et Mocks

### 4.1 Fixtures

#### 4.1.1 User Fixtures

**Fichier** : `src/__tests__/fixtures/user.fixture.ts`

| Fixture | Description | KYC Level |
|---------|-------------|-----------|
| `userFixtures.noKyc()` | Utilisateur sans vérification | NONE |
| `userFixtures.basicKyc()` | Utilisateur vérifié par OTP | BASIC |
| `userFixtures.verifiedKyc()` | Utilisateur avec pièce d'identité | VERIFIED |
| `userFixtures.enhancedKyc()` | Utilisateur avec justificatif domicile | ENHANCED |
| `userFixtures.withPendingOtp()` | Utilisateur avec OTP en attente | NONE |
| `userFixtures.withExpiredOtp()` | Utilisateur avec OTP expiré | NONE |
| `userFixtures.xofCurrency()` | Utilisateur avec préférence XOF | BASIC |

**Fonctions utilitaires** :
- `createUserProps(overrides)` - Crée des props User avec surcharge
- `createUser(overrides)` - Crée une instance User

#### 4.1.2 Wallet Fixtures

**Fichier** : `src/__tests__/fixtures/wallet.fixture.ts`

| Fixture | Description | Status | Balance |
|---------|-------------|--------|---------|
| `walletFixtures.activeWithBalance()` | Wallet actif avec solde | ACTIVE | 150.50 USDC |
| `walletFixtures.activeZeroBalance()` | Wallet actif sans solde | ACTIVE | 0 USDC |
| `walletFixtures.pending()` | Wallet en attente d'activation | PENDING | 0 USDC |
| `walletFixtures.frozen()` | Wallet gelé | FROZEN | 500 USDC |
| `walletFixtures.closed()` | Wallet fermé | CLOSED | 0 USDC |
| `walletFixtures.ethereumSepolia()` | Wallet sur Ethereum Sepolia | ACTIVE | 100 USDC |
| `walletFixtures.largeBalance()` | Wallet avec gros solde | ACTIVE | 10,000 USDC |
| `walletFixtures.smallBalance()` | Wallet avec petit solde | ACTIVE | 0.000001 USDC |
| `walletFixtures.recipient()` | Wallet destinataire (P2P) | ACTIVE | 50 USDC |

#### 4.1.3 Transaction Fixtures

**Fichier** : `src/__tests__/fixtures/transaction.fixture.ts`

| Fixture | Type | Status |
|---------|------|--------|
| `transactionFixtures.pendingDeposit()` | DEPOSIT_ONRAMP | PENDING |
| `transactionFixtures.processingDeposit()` | DEPOSIT_ONRAMP | PROCESSING |
| `transactionFixtures.completedDeposit()` | DEPOSIT_ONRAMP | COMPLETED |
| `transactionFixtures.failedDeposit()` | DEPOSIT_ONRAMP | FAILED |
| `transactionFixtures.pendingWithdrawal()` | WITHDRAWAL_OFFRAMP | PENDING |
| `transactionFixtures.completedWithdrawal()` | WITHDRAWAL_OFFRAMP | COMPLETED |
| `transactionFixtures.pendingTransfer()` | TRANSFER_P2P | PENDING |
| `transactionFixtures.completedTransfer()` | TRANSFER_P2P | COMPLETED |
| `transactionFixtures.cryptoDeposit()` | DEPOSIT_CRYPTO | COMPLETED |
| `transactionFixtures.expiredTransaction()` | DEPOSIT_ONRAMP | EXPIRED |
| `transactionFixtures.cancelledTransaction()` | WITHDRAWAL_OFFRAMP | CANCELLED |
| `transactionFixtures.eurTransaction()` | DEPOSIT_ONRAMP | COMPLETED |

#### 4.1.4 Exchange Rate Fixtures

**Fichier** : `src/__tests__/fixtures/exchange-rate.fixture.ts`

| Fixture | Paire | Taux |
|---------|-------|------|
| `exchangeRates.usdcToEur()` | USDC/EUR | 0.92 |
| `exchangeRates.usdcToXof()` | USDC/XOF | 603.45 |
| `exchangeRates.usdcToUsd()` | USDC/USD | 1.00 |
| `exchangeRates.expiredEurRate()` | USDC/EUR | 0.91 (expiré) |
| `exchangeRates.freshXofRate()` | USDC/XOF | 605.00 (frais) |

### 4.2 Mocks

#### 4.2.1 Repository Mocks

**Fichier** : `src/__tests__/mocks/repositories.mock.ts`

**Mocks Jest** :
- `createMockUserRepository()` - Mock UserRepository
- `createMockWalletRepository()` - Mock WalletRepository
- `createMockTransactionRepository()` - Mock TransactionRepository

**Implémentations In-Memory** (pour tests d'intégration) :
- `InMemoryUserRepository` - Stockage en Map avec CRUD complet
- `InMemoryWalletRepository` - Stockage en Map avec recherche par userId, address
- `InMemoryTransactionRepository` - Stockage en Map avec filtres et pagination

#### 4.2.2 Adapter Mocks

**Fichier** : `src/__tests__/mocks/adapters.mock.ts`

**Mocks Jest** :
- `createMockWalletProvider()` - Mock Circle WalletProvider
- `createMockOnRampProvider()` - Mock MoMo OnRampProvider
- `createMockExchangeRateProvider()` - Mock ExchangeRateProvider

**Implémentations In-Memory** :
- `InMemoryWalletProvider` - Simule Circle API
- `InMemoryOnRampProvider` - Simule MoMo API avec `confirmDeposit()`, `failDeposit()`
- `InMemoryExchangeRateProvider` - Taux configurables via `setRate()`

---

## 5. Tests Domain Layer

### 5.1 Entity: User

**Fichier** : `src/domain/entities/__tests__/User.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **constructor and getters** | should create user with all properties | Vérifie la création avec toutes les propriétés |
| | should handle null email | Gère email null |
| | should handle null OTP | Gère OTP null |
| **KYC checks** | should return false for hasBasicKyc when KYC is NONE | Vérifie NONE → false |
| | should return true for hasBasicKyc when KYC is BASIC | Vérifie BASIC → true |
| | should return true for hasBasicKyc when KYC is VERIFIED | Vérifie VERIFIED → true |
| | should return true for hasBasicKyc when KYC is ENHANCED | Vérifie ENHANCED → true |
| | should return false for hasVerifiedKyc when KYC is BASIC | Vérifie BASIC → false |
| | should return true for hasVerifiedKyc when KYC is VERIFIED | Vérifie VERIFIED → true |
| | should return true for hasVerifiedKyc when KYC is ENHANCED | Vérifie ENHANCED → true |
| | should return false for hasEnhancedKyc when KYC is VERIFIED | Vérifie VERIFIED → false |
| | should return true for hasEnhancedKyc when KYC is ENHANCED | Vérifie ENHANCED → true |
| **KYC limits** | should return 0 daily limit for NONE KYC | Limite 0 pour NONE |
| | should return 100 USDC daily limit for BASIC KYC | Limite 100 pour BASIC |
| | should return 1000 USDC daily limit for VERIFIED KYC | Limite 1000 pour VERIFIED |
| | should return 10000 USDC daily limit for ENHANCED KYC | Limite 10000 pour ENHANCED |
| | should calculate monthly limit as 30x daily limit | Calcul limite mensuelle |
| **OTP management** | should set OTP hash and expiry | Définir OTP |
| | should update updatedAt when setting OTP | MAJ timestamp |
| | should clear OTP | Effacer OTP |
| | should return false for isOtpValid when no OTP set | Pas d'OTP → false |
| | should return true for isOtpValid when OTP is not expired | OTP valide → true |
| | should return false for isOtpValid when OTP is expired | OTP expiré → false |
| **preferences** | should update display currency | Changer devise |
| | should update locale | Changer locale |
| | should update email | Changer email |
| **KYC upgrade** | should upgrade from NONE to BASIC | Upgrade NONE → BASIC |
| | should upgrade from BASIC to VERIFIED with KYC data | Upgrade avec données |
| | should upgrade from VERIFIED to ENHANCED | Upgrade VERIFIED → ENHANCED |
| | should throw error when trying to downgrade KYC | Interdit downgrade |
| | should throw error when trying to set same KYC level | Interdit même niveau |
| | should skip levels when upgrading (NONE to VERIFIED) | Saut de niveau autorisé |
| **serialization** | should convert to JSON without sensitive data | JSON sans passwordHash |
| | should convert dates to ISO strings | Dates en ISO |
| | should return persistence format with all properties | Format complet pour DB |

### 5.2 Entity: Wallet

**Fichier** : `src/domain/entities/__tests__/Wallet.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **constructor and getters** | should create wallet with all properties | Création complète |
| | should initialize balance as Decimal | Balance en Decimal |
| **status checks** | should return true for isActive when status is ACTIVE | isActive() |
| | should return true for isPending when status is PENDING | isPending() |
| | should return true for isFrozen when status is FROZEN | isFrozen() |
| | should return true for isClosed when status is CLOSED | isClosed() |
| **canTransact** | should return true for ACTIVE wallet | ACTIVE peut transiger |
| | should return false for PENDING wallet | PENDING ne peut pas |
| | should return false for FROZEN wallet | FROZEN ne peut pas |
| | should return false for CLOSED wallet | CLOSED ne peut pas |
| **canReceive** | should return true for ACTIVE wallet | ACTIVE peut recevoir |
| | should return true for PENDING wallet | PENDING peut recevoir |
| | should return false for FROZEN wallet | FROZEN ne peut pas |
| | should return false for CLOSED wallet | CLOSED ne peut pas |
| **canWithdraw** | should return true when active and has sufficient balance | Solde suffisant |
| | should return true when withdrawing exact balance | Solde exact |
| | should return false when insufficient balance | Solde insuffisant |
| | should return false when wallet is frozen | Wallet gelé |
| **assertCanTransact** | should not throw for ACTIVE wallet | Pas d'erreur ACTIVE |
| | should throw WalletFrozenError for FROZEN wallet | Erreur FROZEN |
| | should throw WalletFrozenError for PENDING wallet | Erreur PENDING |
| | should throw WalletFrozenError for CLOSED wallet | Erreur CLOSED |
| **assertCanWithdraw** | should not throw when active and has sufficient balance | Pas d'erreur |
| | should throw InsufficientFundsError when insufficient balance | Erreur solde |
| | should throw WalletFrozenError before checking balance | Erreur gelé d'abord |
| **balance operations - credit** | should increase balance | Augmente solde |
| | should handle small amounts with precision | Précision petits montants |
| | should throw error for negative credit amount | Interdit montant négatif |
| | should update updatedAt timestamp | MAJ timestamp |
| **balance operations - debit** | should decrease balance | Diminue solde |
| | should allow debiting entire balance | Débit total autorisé |
| | should throw InsufficientFundsError when debiting more than balance | Erreur dépassement |
| | should throw WalletFrozenError when wallet is frozen | Erreur gelé |
| **balance operations - syncBalance** | should set balance directly | Sync direct |
| | should allow setting zero balance | Zero autorisé |
| | should update updatedAt timestamp | MAJ timestamp |
| **status transitions - activate** | should transition from PENDING to ACTIVE | PENDING → ACTIVE |
| | should throw error when activating from ACTIVE | Erreur depuis ACTIVE |
| | should throw error when activating from FROZEN | Erreur depuis FROZEN |
| **status transitions - freeze** | should transition from ACTIVE to FROZEN | ACTIVE → FROZEN |
| | should throw error when freezing from PENDING | Erreur depuis PENDING |
| | should throw error when freezing from FROZEN | Erreur depuis FROZEN |
| **status transitions - unfreeze** | should transition from FROZEN to ACTIVE | FROZEN → ACTIVE |
| | should throw error when unfreezing from ACTIVE | Erreur depuis ACTIVE |
| **status transitions - close** | should transition to CLOSED when balance is zero | Fermeture OK |
| | should throw error when closing with non-zero balance | Erreur si solde > 0 |
| **getWalletAddress** | should return WalletAddress value object | Retourne VO |
| **getDisplayBalance** | should return Money value object with converted amount | Retourne Money |
| **serialization** | should convert to JSON | JSON correct |
| | should not expose circleWalletId in JSON | Pas de données Circle |
| | should return persistence format with all properties | Format complet |

### 5.3 Entity: Transaction

**Fichier** : `src/domain/entities/__tests__/Transaction.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **constructor and getters** | should create transaction with all properties | Création complète |
| | should handle null optional fields | Champs optionnels null |
| **netAmountUsdc** | should calculate net amount (amount - fee) | Montant net = montant - frais |
| | should return full amount when fee is zero | Frais 0 → montant complet |
| | should handle small fee precision | Précision petits frais |
| **status checks** | should return true for isPending when status is PENDING | isPending() |
| | should return true for isProcessing when status is PROCESSING | isProcessing() |
| | should return true for isCompleted when status is COMPLETED | isCompleted() |
| | should return true for isFailed when status is FAILED | isFailed() |
| | should return true for isCancelled when status is CANCELLED | isCancelled() |
| | should return true for isExpired when status is EXPIRED | isExpired() |
| **type checks** | should return true for isDeposit when type is DEPOSIT_ONRAMP | isDeposit() |
| | should return true for isDeposit when type is DEPOSIT_CRYPTO | isDeposit() crypto |
| | should return true for isWithdrawal when type is WITHDRAWAL_OFFRAMP | isWithdrawal() |
| | should return true for isTransfer when type is TRANSFER_P2P | isTransfer() |
| **state transitions - markProcessing** | should transition from PENDING to PROCESSING | PENDING → PROCESSING |
| | should set external ref when provided | Définir externalRef |
| | should throw InvalidTransactionStateError from COMPLETED | Erreur depuis COMPLETED |
| **state transitions - complete** | should transition from PROCESSING to COMPLETED | PROCESSING → COMPLETED |
| | should set completedAt timestamp | Définir completedAt |
| | should throw InvalidTransactionStateError from PENDING | Erreur depuis PENDING |
| **state transitions - fail** | should transition from PROCESSING to FAILED | PROCESSING → FAILED |
| | should transition from PENDING to FAILED | PENDING → FAILED |
| | should throw InvalidTransactionStateError from COMPLETED | Erreur depuis COMPLETED |
| **state transitions - cancel** | should transition from PENDING to CANCELLED | PENDING → CANCELLED |
| | should throw InvalidTransactionStateError from PROCESSING | Erreur depuis PROCESSING |
| **state transitions - expire** | should transition from PENDING to EXPIRED | PENDING → EXPIRED |
| | should throw InvalidTransactionStateError from PROCESSING | Erreur depuis PROCESSING |
| **metadata** | should set metadata key | Ajouter metadata |
| | should merge with existing metadata | Fusionner metadata |
| **setFee** | should update fee on non-terminal transaction | MAJ fee OK |
| | should throw error when modifying fee on terminal transaction | Erreur si terminal |
| | should throw error when modifying fee on FAILED transaction | Erreur si FAILED |
| **serialization** | should convert to JSON | JSON correct |
| | should convert Decimal values to strings | Decimal → string |
| | should handle null optional fields in JSON | Champs null en JSON |
| | should convert dates to ISO strings | Dates ISO |
| | should return persistence format with all properties | Format complet |

### 5.4 Value Object: Money

**Fichier** : `src/domain/value-objects/__tests__/Money.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **fromUsdc** | should create Money from USDC amount with EUR | Création EUR |
| | should create Money from USDC amount with XOF | Création XOF |
| | should accept Decimal input | Input Decimal |
| | should accept string input | Input string |
| | should round display amount to 2 decimal places | Arrondi 2 décimales |
| **fromFiat** | should create Money from EUR amount | Depuis EUR |
| | should create Money from XOF amount | Depuis XOF |
| | should round USDC amount to 6 decimal places | Arrondi 6 décimales |
| **zero** | should create zero Money | Zéro |
| | should create zero Money with custom exchange rate | Zéro avec taux |
| **immutability** | should be frozen (immutable) | Object.freeze |
| **arithmetic - add** | should add two Money values with same currency | Addition |
| | should throw error when adding different currencies | Erreur devises ≠ |
| | should return new instance (immutability) | Nouvelle instance |
| **arithmetic - subtract** | should subtract Money values | Soustraction |
| | should allow negative result | Résultat négatif OK |
| **arithmetic - multiply** | should multiply by factor | Multiplication number |
| | should multiply by Decimal | Multiplication Decimal |
| | should multiply by fraction | Multiplication fraction |
| **arithmetic - percentage** | should calculate percentage | Pourcentage |
| | should calculate 1% correctly | 1% correct |
| **comparison** | should return true for isPositive when amount > 0 | isPositive() |
| | should return true for isZero when amount = 0 | isZero() |
| | should return true for isNegative when amount < 0 | isNegative() |
| | should compare gte correctly | gte() |
| | should compare gt correctly | gt() |
| | should compare lte correctly | lte() |
| | should compare lt correctly | lt() |
| | should check equals correctly | equals() |
| **display formatting** | should format EUR display string | Format EUR |
| | should format XOF display string | Format XOF FCFA |
| | should format USD display string | Format USD |
| | should format USDC string | Format USDC |
| **serialization** | should convert to JSON | JSON |
| | should handle precise decimal values in JSON | Précision JSON |

### 5.5 Value Object: ExchangeRate

**Fichier** : `src/domain/value-objects/__tests__/ExchangeRate.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **create** | should create exchange rate for EUR | Création EUR |
| | should create exchange rate for XOF | Création XOF |
| | should accept Decimal as rate | Input Decimal |
| | should accept string as rate | Input string |
| | should use custom timestamp when provided | Timestamp custom |
| | should throw error for zero rate | Erreur taux = 0 |
| | should throw error for negative rate | Erreur taux < 0 |
| **immutability** | should be frozen (immutable) | Object.freeze |
| **convertFromUsdc** | should convert USDC to EUR | USDC → EUR |
| | should convert USDC to XOF | USDC → XOF |
| | should accept Decimal input | Input Decimal |
| | should accept string input | Input string |
| | should round to 2 decimal places | Arrondi 2 décimales |
| **convertToUsdc** | should convert EUR to USDC | EUR → USDC |
| | should convert XOF to USDC | XOF → USDC |
| | should accept Decimal input | Input Decimal |
| | should round to 6 decimal places | Arrondi 6 décimales |
| **isValid** | should return true for fresh rate | Taux frais → true |
| | should return true when within TTL | Dans TTL → true |
| | should return false when expired | Expiré → false |
| | should return false when exactly at TTL boundary | Limite exacte → false |
| **ageMinutes** | should return 0 for fresh rate | Frais → 0 |
| | should return approximate age in minutes | Âge approximatif |
| **toDisplayString** | should format EUR rate for display | Affichage EUR |
| | should format XOF rate for display | Affichage XOF |
| | should format with 4 decimal places | 4 décimales |
| **serialization** | should convert to JSON | JSON |
| | should convert rate to string in JSON | Rate en string |

### 5.6 Value Object: WalletAddress

**Fichier** : `src/domain/value-objects/__tests__/WalletAddress.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **create** | should create valid EVM address for POLYGON_AMOY | Polygon Amoy |
| | should create valid EVM address for ETH_SEPOLIA | Ethereum Sepolia |
| | should create valid EVM address for ARBITRUM_SEPOLIA | Arbitrum Sepolia |
| | should create valid EVM address for POLYGON mainnet | Polygon mainnet |
| | should create valid EVM address for ETHEREUM mainnet | Ethereum mainnet |
| | should create valid EVM address for ARBITRUM mainnet | Arbitrum mainnet |
| | should normalize address to lowercase | Lowercase |
| | should trim whitespace from address | Trim whitespace |
| | should throw error for invalid EVM address - too short | Trop court |
| | should throw error for invalid EVM address - too long | Trop long |
| | should throw error for invalid EVM address - missing 0x prefix | Sans 0x |
| | should throw error for invalid EVM address - invalid characters | Caractères invalides |
| **fromTrusted** | should create address without validation | Sans validation |
| | should normalize to lowercase | Lowercase |
| **isValid static** | should return true for valid EVM address | Valide → true |
| | should return true for uppercase EVM address | Majuscules OK |
| | should return false for invalid address | Invalide → false |
| | should return false for empty address | Vide → false |
| **immutability** | should be frozen (immutable) | Object.freeze |
| **isTestnet** | should return true for POLYGON_AMOY | Testnet Polygon |
| | should return true for ETH_SEPOLIA | Testnet Ethereum |
| | should return true for ARBITRUM_SEPOLIA | Testnet Arbitrum |
| | should return false for POLYGON mainnet | Mainnet false |
| | should return false for ETHEREUM mainnet | Mainnet false |
| | should return false for ARBITRUM mainnet | Mainnet false |
| **abbreviated** | should return abbreviated address | 0x1234...5678 |
| | should return full address if length <= 10 | Adresse courte |
| **explorerUrl** | should return correct explorer URL for POLYGON_AMOY | URL Amoy |
| | should return correct explorer URL for ETH_SEPOLIA | URL Sepolia |
| | should return correct explorer URL for ARBITRUM_SEPOLIA | URL Arbitrum |
| | should return correct explorer URL for POLYGON mainnet | URL Polygon |
| | should return correct explorer URL for ETHEREUM mainnet | URL Etherscan |
| | should return correct explorer URL for ARBITRUM mainnet | URL Arbiscan |
| **equals** | should return true for same address and blockchain | Égalité |
| | should return true regardless of case | Case insensitive |
| | should return false for different addresses | Adresses ≠ |
| | should return false for same address but different blockchain | Blockchain ≠ |
| **toString** | should return the address string | String |
| **serialization** | should convert to JSON | JSON |

### 5.7 Service: LedgerService

**Fichier** : `src/domain/services/__tests__/LedgerService.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **createEntries** | should create balanced entries | Entrées équilibrées |
| | should throw LedgerImbalanceError for unbalanced entries | Erreur déséquilibre |
| | should set correct entry types (CREDIT for positive, DEBIT for negative) | Types corrects |
| | should store absolute amount in amountUsdc | Valeur absolue |
| **createDepositEntries** | should create balanced deposit entries | Dépôt équilibré |
| | should create fee entry | Entrée frais |
| | should create escrow entries | Entrées escrow |
| | should calculate correct balance after for user | Balance après |
| **createWithdrawalEntries** | should create balanced withdrawal entries | Retrait équilibré |
| | should create fee entry | Entrée frais |
| | should calculate correct balance after for user | Balance après |
| **createTransferEntries** | should create balanced P2P transfer entries | Transfert équilibré |
| | should be balanced (sender debit = receiver credit) | Débit = Crédit |
| **createCryptoDepositEntries** | should create balanced crypto deposit entries | Dépôt crypto équilibré |
| | should use LIQUIDITY account for source | Compte LIQUIDITY |
| **createFeeEntries** | should create balanced fee entries | Frais équilibrés |
| **createRefundEntries** | should create balanced refund entries | Remboursement équilibré |
| **balance invariant** | should always produce balanced entries for deposits | Invariant dépôt |
| | should always produce balanced entries for withdrawals | Invariant retrait |
| | should always produce balanced entries for transfers | Invariant transfert |
| **edge cases** | should handle zero fee in deposit | Frais = 0 |
| | should handle very small amounts | Très petits montants |
| | should handle large amounts | Grands montants |

### 5.8 Domain Errors

**Fichier** : `src/domain/errors/__tests__/DomainErrors.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **DomainError (abstract)** | should set error name to class name | Nom de classe |
| | should set timestamp | Timestamp |
| | should be instance of Error | instanceof Error |
| **InsufficientFundsError** | should create error with wallet info | Info wallet |
| | should have descriptive message | Message descriptif |
| | should serialize to JSON | JSON |
| **WalletFrozenError** | should create error with wallet status | Status wallet |
| | should work with PENDING status | Status PENDING |
| | should work with CLOSED status | Status CLOSED |
| | should have descriptive message | Message descriptif |
| | should serialize to JSON | JSON |
| **InvalidTransactionStateError** | should create error with state transition info | Info transition |
| | should have descriptive message | Message descriptif |
| | should serialize to JSON | JSON |
| **LedgerImbalanceError** | should create error with imbalance info | Info déséquilibre |
| | should handle negative imbalance | Déséquilibre négatif |
| | should have descriptive message | Message descriptif |
| | should serialize to JSON | JSON |
| **UserNotFoundError** | should create error with user identifier | Identifiant user |
| **WalletNotFoundError** | should create error with wallet identifier | Identifiant wallet |
| **TransactionNotFoundError** | should create error with transaction identifier | Identifiant tx |

---

## 6. Tests Application Layer

### 6.1 Command: CreateWalletHandler

**Fichier** : `src/application/commands/__tests__/CreateWalletHandler.test.ts`

| Cas de Test | Description |
|-------------|-------------|
| should create wallet for existing user | Création wallet pour user existant |
| should throw UserNotFoundError when user does not exist | Erreur user inexistant |
| should return existing wallet if already created (idempotent) | Idempotence |
| should return pending status for pending wallet | Status PENDING |
| should use default blockchain when not specified | Blockchain par défaut |
| should use provided idempotencyKey | Clé idempotence fournie |
| should use specific blockchain when provided | Blockchain spécifique |
| should persist wallet with Circle data | Persistance données Circle |

### 6.2 Command: InitiateDepositHandler

**Fichier** : `src/application/commands/__tests__/InitiateDepositHandler.test.ts`

| Cas de Test | Description |
|-------------|-------------|
| should initiate deposit successfully | Dépôt réussi |
| should convert fiat amount to USDC using exchange rate | Conversion fiat → USDC |
| should throw WalletNotFoundError when wallet does not exist | Erreur wallet inexistant |
| should throw WalletFrozenError when wallet is frozen | Erreur wallet gelé |
| should return existing transaction if idempotencyKey already used | Idempotence |
| should create transaction in PENDING status initially | Status initial PENDING |
| should create OnRamp details after initiating deposit | Création OnRampDetails |
| should update transaction to PROCESSING after MoMo call | MAJ status PROCESSING |
| should handle EUR currency | Devise EUR |

### 6.3 Query: GetBalanceHandler

**Fichier** : `src/application/queries/__tests__/GetBalanceHandler.test.ts`

| Cas de Test | Description |
|-------------|-------------|
| should return balance with user preferred currency | Devise préférée user |
| should convert balance to display currency | Conversion devise affichage |
| should use provided displayCurrency over user preference | Surcharge devise |
| should throw UserNotFoundError when user does not exist | Erreur user inexistant |
| should throw WalletNotFoundError when wallet does not exist | Erreur wallet inexistant |
| should return zero balance correctly | Solde zéro |
| should handle XOF currency with user preference | Préférence XOF |
| should return wallet status | Status wallet |
| should handle large balance precision | Précision gros montants |
| should handle small balance precision | Précision petits montants |

---

## 7. Tests Infrastructure Layer

### 7.1 Controller: WalletController

**Fichier** : `src/infrastructure/http/controllers/__tests__/WalletController.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **createWallet** | should create wallet and return 201 | Création 201 |
| | should create wallet with default blockchain when not specified | Blockchain défaut |
| | should call next with error when handler throws | Erreur → next() |
| | should reject invalid blockchain | Validation blockchain |
| **getBalance** | should return balance with 200 | Balance 200 |
| | should pass currency query parameter | Param currency |
| **initiateDeposit** | should initiate deposit and return 202 | Dépôt 202 |
| | should validate required fields | Champs requis |
| | should validate positive amount | Montant positif |
| | should validate currency enum | Enum currency |
| **initiateWithdrawal** | should initiate withdrawal and return 202 | Retrait 202 |
| **transfer** | should transfer to phone and return 202 | Transfert phone 202 |
| | should transfer to address | Transfert adresse |
| | should reject transfer without recipient | Recipient requis |
| | should validate description max length | Description max 200 |
| **getTransactionHistory** | should return transaction history | Historique |
| | should filter by type | Filtre type |
| | should filter by status | Filtre status |
| | should filter by date range | Filtre dates |
| | should validate limit max 100 | Limit max 100 |

### 7.2 Controller: AuthController

**Fichier** : `src/infrastructure/http/controllers/__tests__/AuthController.test.ts`

| Suite | Cas de Test | Description |
|-------|-------------|-------------|
| **register** | should register new user and return 201 | Inscription 201 |
| | should return 409 when phone already exists | Erreur phone existant |
| | should return 409 when email already exists | Erreur email existant |
| | should validate phone format | Validation phone |
| | should validate password minimum length | Password min 8 |
| | should validate email format when provided | Validation email |
| | should hash password before storing | Hash password |
| **login** | should login user with valid credentials | Login OK |
| | should return 401 for invalid phone | Phone invalide |
| | should return 401 for invalid password | Password invalide |
| **requestOtp** | should generate and store OTP | Génération OTP |
| | should return 404 for unknown phone | Phone inconnu |
| **verifyOtp** | should verify OTP and upgrade KYC to BASIC | Vérification → BASIC |
| | should return 400 for expired OTP | OTP expiré |
| | should return 400 for invalid OTP | OTP invalide |
| | should validate OTP format (6 digits) | Format 6 chiffres |
| | should validate OTP contains only digits | Chiffres uniquement |
| **refreshToken** | should refresh tokens | Refresh OK |
| | should return 401 for unknown user in token | User inconnu |
| **me** | should return user profile with limits | Profil avec limites |
| | should return 404 when user not found | User inexistant |
| **updateProfile** | should update user email | MAJ email |
| | should return 409 when new email already in use | Email déjà utilisé |
| | should update display currency | MAJ devise |
| | should update locale | MAJ locale |

---

## 8. Exécution des Tests

### 8.1 Commandes NPM

```bash
# Exécuter tous les tests
npm test

# Mode watch (re-exécute sur modification)
npm run test:watch

# Avec rapport de couverture
npm run test:coverage

# Exécuter un fichier spécifique
npm test -- User.test.ts

# Exécuter une suite spécifique
npm test -- --testNamePattern="User Entity"

# Exécuter avec verbose
npm test -- --verbose
```

### 8.2 Filtres Utiles

```bash
# Tests Domain uniquement
npm test -- --testPathPattern="domain"

# Tests Application uniquement
npm test -- --testPathPattern="application"

# Tests Infrastructure uniquement
npm test -- --testPathPattern="infrastructure"

# Tests d'une entity spécifique
npm test -- --testPathPattern="Wallet.test"
```

---

## 9. Couverture de Code

### 9.1 Seuils de Couverture

| Métrique | Seuil Minimum |
|----------|---------------|
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |
| Statements | 70% |

### 9.2 Rapport de Couverture

Le rapport de couverture est généré dans le dossier `coverage/` :

```bash
npm run test:coverage

# Ouvrir le rapport HTML
open coverage/lcov-report/index.html
```

### 9.3 Exclusions

Les fichiers suivants sont exclus de la couverture :
- `src/**/*.d.ts` - Fichiers de déclaration TypeScript
- `src/**/__tests__/**` - Fichiers de tests
- `src/index.ts` - Point d'entrée application

---

## Annexe A : Bonnes Pratiques

### A.1 Nommage des Tests

```typescript
// ✅ Bon : décrit le comportement attendu
it('should throw InsufficientFundsError when balance is insufficient', () => {});

// ❌ Mauvais : trop vague
it('should fail', () => {});
```

### A.2 Structure AAA (Arrange-Act-Assert)

```typescript
it('should create wallet for existing user', async () => {
  // Arrange - Préparer les données
  const user = userFixtures.basicKyc();
  mockUserRepo.findById.mockResolvedValue(user);

  // Act - Exécuter l'action
  const result = await handler.execute({ userId: user.id });

  // Assert - Vérifier le résultat
  expect(result.walletId).toBeDefined();
  expect(mockWalletProvider.createWallet).toHaveBeenCalled();
});
```

### A.3 Isolation des Tests

Chaque test doit être indépendant :

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset des états
});
```

---

*Document généré pour Pula Pay v2 — Documentation des Tests*
