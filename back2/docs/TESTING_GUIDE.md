# Pula Pay v2 - Guide de Tests

**Version** : 1.0
**Date** : Janvier 2026
**Objectif** : Documentation complète pour les tests de l'API Pula Pay v2

---

## Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture](#2-architecture)
3. [Configuration de l'Environnement](#3-configuration-de-lenvironnement)
4. [Endpoints API](#4-endpoints-api)
5. [Scénarios de Tests](#5-scénarios-de-tests)
6. [Modèles de Données](#6-modèles-de-données)
7. [Codes d'Erreur](#7-codes-derreur)
8. [Webhooks](#8-webhooks)
9. [Limites KYC](#9-limites-kyc)

---

## 1. Vue d'Ensemble

### 1.1 Description du Projet

Pula Pay v2 est une application fintech permettant de gérer des portefeuilles USDC via Circle Programmable Wallets avec support pour :

- **On-ramp** : Dépôts via Mobile Money (MTN MoMo) → USDC
- **Off-ramp** : Retraits USDC → Mobile Money
- **Transferts P2P** : Entre utilisateurs Pula Pay
- **Dépôts Crypto** : Réception directe d'USDC externe
- **Conversion** : Affichage en EUR/XOF/USD

### 1.2 Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js >= 18 |
| Framework | Express 4.18 |
| ORM | Prisma 5.9 |
| Base de données | PostgreSQL |
| Blockchain | Circle Programmable Wallets |
| Mobile Money | MTN MoMo API |
| Taux de change | Coingecko API |
| Auth | JWT (Bearer Token) |

### 1.3 URL de Base

```
Development : http://localhost:3000/api/v2
Staging     : https://api-staging.pulapay.com/api/v2
Production  : https://api.pulapay.com/api/v2
```

---

## 2. Architecture

### 2.1 Architecture Hexagonale

```
┌─────────────────────────────────────────────────────────────────┐
│                      COUCHE HTTP (Express)                       │
│  Controllers → Routes → Middleware (Auth, Logging, Errors)       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    COUCHE APPLICATION                            │
│  Command Handlers (CreateWallet, InitiateDeposit, Transfer...)   │
│  Query Handlers (GetBalance, GetHistory, GetExchangeRate...)     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      COUCHE DOMAIN                               │
│  Entities: User, Wallet, Transaction                             │
│  Value Objects: Money, WalletAddress, ExchangeRate               │
│  Services: LedgerService (comptabilité double entrée)            │
└──────┬─────────────────────────────────────────┬────────────────┘
       │                                         │
┌──────▼───────────────┐               ┌─────────▼────────────────┐
│   PERSISTENCE        │               │      ADAPTERS            │
│   Prisma + PostgreSQL│               │ Circle, MoMo, Coingecko  │
└──────────────────────┘               └──────────────────────────┘
```

### 2.2 Structure des Dossiers

```
back2/
├── src/
│   ├── domain/           # Logique métier pure
│   │   ├── entities/     # User, Wallet, Transaction
│   │   ├── value-objects/# Money, WalletAddress, ExchangeRate
│   │   ├── services/     # LedgerService
│   │   ├── ports/        # Interfaces (WalletProvider, OnRampProvider)
│   │   └── errors/       # Erreurs domain
│   │
│   ├── application/      # Cas d'usage
│   │   ├── commands/     # CreateWallet, InitiateDeposit, Transfer
│   │   ├── queries/      # GetBalance, GetHistory
│   │   └── services/     # CurrencyConversionService
│   │
│   ├── infrastructure/   # Implémentations
│   │   ├── http/         # Controllers, Routes, Middleware
│   │   ├── persistence/  # Prisma Repositories
│   │   └── adapters/     # Circle, MoMo, Coingecko
│   │
│   └── shared/           # Utils, Config, Logger
│
└── prisma/               # Schema et migrations
```

---

## 3. Configuration de l'Environnement

### 3.1 Variables d'Environnement

```env
# Serveur
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Base de données
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pulapay_v2

# Circle Programmable Wallets
CIRCLE_API_KEY=TEST_API_KEY:xxxxxxxx
CIRCLE_RSA_PUBLIC_KEY=-----BEGIN RSA PUBLIC KEY-----...
CIRCLE_ENTITY_SECRET=encrypted_secret
CIRCLE_WALLET_SET_ID=uuid-wallet-set-id
CIRCLE_ENVIRONMENT=sandbox

# Blockchain
DEFAULT_BLOCKCHAIN=POLYGON_AMOY
USDC_TOKEN_ID_POLYGON_AMOY=0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582

# Taux de change
EXCHANGE_RATE_PROVIDER=coingecko
EXCHANGE_RATE_CACHE_TTL_MINUTES=5

# MTN MoMo
MTN_MOMO_API_KEY=momo_api_key
MTN_MOMO_API_SECRET=momo_api_secret
MTN_MOMO_SUBSCRIPTION_KEY=subscription_key
MTN_MOMO_ENVIRONMENT=sandbox
MTN_MOMO_CALLBACK_URL=http://localhost:3000/api/v2/webhooks/momo

# JWT
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3.2 Démarrage

```bash
# Installation
npm install

# Génération Prisma
npx prisma generate

# Migration DB
npx prisma migrate dev

# Seed (optionnel)
npx prisma db seed

# Démarrage dev
npm run dev

# Build production
npm run build
npm start
```

---

## 4. Endpoints API

### 4.1 Format de Réponse Standard

**Succès :**
```json
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-01-19T10:30:00.000Z"
  }
}
```

**Erreur :**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Solde insuffisant pour cette opération",
    "details": { /* optionnel */ }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-01-19T10:30:00.000Z"
  }
}
```

### 4.2 Health Check

#### `GET /health`
**Description** : Vérification simple de l'état du serveur

**Authentification** : Non requise

**Réponse :**
```json
{
  "status": "ok",
  "timestamp": "2026-01-19T10:30:00.000Z"
}
```

---

#### `GET /ready`
**Description** : Vérification de la disponibilité (DB, services externes)

**Authentification** : Non requise

**Réponse :**
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "circle": "ok",
    "momo": "ok"
  }
}
```

---

#### `GET /live`
**Description** : Probe de liveness pour Kubernetes

**Authentification** : Non requise

**Réponse :**
```json
{
  "status": "live"
}
```

---

### 4.3 Authentification

#### `POST /auth/register`
**Description** : Inscription d'un nouvel utilisateur

**Authentification** : Non requise

**Body :**
```json
{
  "phone": "+22501234567",
  "email": "user@example.com",       // optionnel
  "password": "SecureP@ss123",
  "displayCurrency": "EUR",          // optionnel, défaut: EUR
  "locale": "fr-FR"                  // optionnel, défaut: fr-FR
}
```

**Validations :**
- `phone` : Format E.164 requis (+225XXXXXXXX)
- `password` : Min 8 caractères
- `displayCurrency` : EUR | XOF | USD
- `locale` : fr-FR | en-US | etc.

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxx...",
      "phone": "+22501234567",
      "email": "user@example.com",
      "kycLevel": "NONE",
      "displayCurrency": "EUR",
      "locale": "fr-FR",
      "createdAt": "2026-01-19T10:30:00.000Z"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

**Erreurs possibles :**
- `400` : Validation échouée
- `409` : Téléphone ou email déjà utilisé

---

#### `POST /auth/login`
**Description** : Connexion utilisateur

**Authentification** : Non requise

**Body :**
```json
{
  "phone": "+22501234567",
  "password": "SecureP@ss123"
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxx...",
      "phone": "+22501234567",
      "kycLevel": "BASIC",
      "displayCurrency": "EUR"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

**Erreurs possibles :**
- `401` : Identifiants incorrects

---

#### `POST /auth/request-otp`
**Description** : Demande d'envoi OTP pour vérification KYC

**Authentification** : Bearer Token requis

**Body :**
```json
{
  "phone": "+22501234567"
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "message": "OTP envoyé",
    "expiresIn": 600
  }
}
```

---

#### `POST /auth/verify-otp`
**Description** : Vérification OTP → Upgrade KYC vers BASIC

**Authentification** : Bearer Token requis

**Body :**
```json
{
  "otp": "123456"
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clxx...",
      "kycLevel": "BASIC"
    },
    "message": "KYC mis à jour vers BASIC"
  }
}
```

**Erreurs possibles :**
- `400` : OTP invalide ou expiré

---

#### `POST /auth/refresh`
**Description** : Renouvellement du token d'accès

**Authentification** : Non requise

**Body :**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 900
  }
}
```

---

#### `GET /auth/me`
**Description** : Récupération du profil utilisateur

**Authentification** : Bearer Token requis

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "phone": "+22501234567",
    "email": "user@example.com",
    "kycLevel": "BASIC",
    "displayCurrency": "EUR",
    "locale": "fr-FR",
    "createdAt": "2026-01-19T10:30:00.000Z",
    "updatedAt": "2026-01-19T10:30:00.000Z"
  }
}
```

---

#### `PATCH /auth/me`
**Description** : Mise à jour du profil

**Authentification** : Bearer Token requis

**Body :**
```json
{
  "email": "new@example.com",        // optionnel
  "displayCurrency": "XOF",          // optionnel
  "locale": "fr-CI"                  // optionnel
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "email": "new@example.com",
    "displayCurrency": "XOF",
    "locale": "fr-CI"
  }
}
```

---

### 4.4 Taux de Change

#### `GET /exchange-rates`
**Description** : Récupération de tous les taux de change

**Authentification** : Non requise

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "rates": [
      {
        "baseCurrency": "USDC",
        "quoteCurrency": "EUR",
        "rate": "0.92",
        "timestamp": "2026-01-19T10:30:00.000Z",
        "source": "coingecko"
      },
      {
        "baseCurrency": "USDC",
        "quoteCurrency": "XOF",
        "rate": "603.45",
        "timestamp": "2026-01-19T10:30:00.000Z",
        "source": "coingecko"
      }
    ],
    "cacheExpiry": "2026-01-19T10:35:00.000Z"
  }
}
```

---

#### `GET /exchange-rates/preview`
**Description** : Aperçu de conversion pour un montant donné

**Authentification** : Non requise

**Query Parameters :**
- `amount` (requis) : Montant à convertir
- `fromCurrency` (requis) : Devise source (USDC | EUR | XOF)
- `toCurrency` (requis) : Devise cible (USDC | EUR | XOF)

**Exemple :** `GET /exchange-rates/preview?amount=100&fromCurrency=EUR&toCurrency=USDC`

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "fromAmount": "100.00",
    "fromCurrency": "EUR",
    "toAmount": "108.70",
    "toCurrency": "USDC",
    "rate": "1.087",
    "timestamp": "2026-01-19T10:30:00.000Z"
  }
}
```

---

### 4.5 Wallet

#### `POST /wallet`
**Description** : Création du wallet Circle pour l'utilisateur

**Authentification** : Bearer Token requis

**KYC requis** : BASIC minimum

**Body :**
```json
{
  "blockchain": "POLYGON_AMOY"  // optionnel, défaut: POLYGON_AMOY
}
```

**Blockchains supportées :**
- Testnets : `POLYGON_AMOY`, `ETH_SEPOLIA`, `ARBITRUM_SEPOLIA`
- Mainnets : `POLYGON`, `ARBITRUM`, `ETHEREUM`

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "id": "clxx...",
      "circleWalletId": "circle-uuid",
      "address": "0x1234567890abcdef...",
      "blockchain": "POLYGON_AMOY",
      "status": "ACTIVE",
      "createdAt": "2026-01-19T10:30:00.000Z"
    }
  }
}
```

**Erreurs possibles :**
- `400` : Wallet déjà existant
- `403` : KYC insuffisant

---

#### `GET /wallet/balance`
**Description** : Récupération du solde avec conversion devise

**Authentification** : Bearer Token requis

**Query Parameters :**
- `currency` (optionnel) : Devise d'affichage (défaut: préférence user)

**Exemple :** `GET /wallet/balance?currency=XOF`

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "balance": {
      "usdc": "150.500000",
      "display": {
        "amount": "90832.73",
        "currency": "XOF",
        "formatted": "90 832,73 FCFA"
      }
    },
    "wallet": {
      "address": "0x1234567890abcdef...",
      "blockchain": "POLYGON_AMOY",
      "status": "ACTIVE"
    },
    "exchangeRate": {
      "rate": "603.45",
      "timestamp": "2026-01-19T10:30:00.000Z"
    }
  }
}
```

**Erreurs possibles :**
- `404` : Wallet non trouvé

---

#### `POST /wallet/deposit`
**Description** : Initiation d'un dépôt via Mobile Money

**Authentification** : Bearer Token requis

**KYC requis** : BASIC minimum

**Body :**
```json
{
  "amount": 10000,
  "currency": "XOF",
  "phoneNumber": "+22501234567",
  "idempotencyKey": "uuid-unique"   // optionnel
}
```

**Réponse (202) :**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "clxx...",
      "type": "DEPOSIT_ONRAMP",
      "status": "PROCESSING",
      "amountUsdc": "16.57",
      "feeUsdc": "0.17",
      "displayAmount": "10000.00",
      "displayCurrency": "XOF",
      "exchangeRate": "603.45",
      "createdAt": "2026-01-19T10:30:00.000Z"
    },
    "provider": {
      "name": "MTN_MOMO",
      "ref": "momo-ref-123",
      "status": "PENDING"
    },
    "instructions": "Confirmez le paiement sur votre téléphone"
  }
}
```

**Erreurs possibles :**
- `400` : Montant invalide ou devise non supportée
- `403` : Limite KYC dépassée
- `503` : Provider MoMo indisponible

---

#### `POST /wallet/withdraw`
**Description** : Initiation d'un retrait vers Mobile Money

**Authentification** : Bearer Token requis

**KYC requis** : BASIC minimum

**Body :**
```json
{
  "amount": 50,
  "currency": "USDC",              // ou EUR/XOF avec conversion
  "phoneNumber": "+22501234567",
  "idempotencyKey": "uuid-unique"  // optionnel
}
```

**Réponse (202) :**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "clxx...",
      "type": "WITHDRAWAL_OFFRAMP",
      "status": "PROCESSING",
      "amountUsdc": "50.00",
      "feeUsdc": "0.50",
      "netAmount": "49.50",
      "displayAmount": "29871.00",
      "displayCurrency": "XOF",
      "exchangeRate": "603.45",
      "createdAt": "2026-01-19T10:30:00.000Z"
    },
    "provider": {
      "name": "MTN_MOMO",
      "ref": "momo-ref-456",
      "status": "PENDING"
    },
    "estimatedArrival": "2026-01-19T10:35:00.000Z"
  }
}
```

**Erreurs possibles :**
- `400` : Solde insuffisant
- `403` : Limite KYC dépassée

---

#### `POST /wallet/transfer`
**Description** : Transfert P2P vers un autre utilisateur ou adresse externe

**Authentification** : Bearer Token requis

**KYC requis** : BASIC minimum

**Body (vers utilisateur Pula Pay) :**
```json
{
  "amount": 25.50,
  "currency": "EUR",
  "recipientPhone": "+22507654321",
  "description": "Remboursement restaurant",
  "idempotencyKey": "uuid-unique"
}
```

**Body (vers adresse externe) :**
```json
{
  "amount": 100,
  "currency": "USDC",
  "recipientAddress": "0xabcdef1234567890...",
  "description": "Retrait vers wallet externe",
  "idempotencyKey": "uuid-unique"
}
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "clxx...",
      "type": "TRANSFER_P2P",
      "status": "COMPLETED",
      "amountUsdc": "27.72",
      "feeUsdc": "0.00",
      "displayAmount": "25.50",
      "displayCurrency": "EUR",
      "exchangeRate": "0.92",
      "recipient": {
        "phone": "+22507654321",
        "address": "0x7654321..."
      },
      "txHash": "0xabcdef...",
      "createdAt": "2026-01-19T10:30:00.000Z",
      "completedAt": "2026-01-19T10:30:05.000Z"
    }
  }
}
```

**Erreurs possibles :**
- `400` : Solde insuffisant
- `404` : Destinataire non trouvé
- `403` : Limite KYC dépassée

---

#### `GET /wallet/transactions`
**Description** : Historique des transactions avec pagination

**Authentification** : Bearer Token requis

**Query Parameters :**
- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nb par page (défaut: 20, max: 100)
- `type` (optionnel) : Filtre par type
- `status` (optionnel) : Filtre par statut
- `startDate` (optionnel) : Date début (ISO 8601)
- `endDate` (optionnel) : Date fin (ISO 8601)

**Exemple :** `GET /wallet/transactions?page=1&limit=10&type=TRANSFER_P2P&status=COMPLETED`

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "clxx...",
        "type": "TRANSFER_P2P",
        "status": "COMPLETED",
        "amountUsdc": "27.72",
        "displayAmount": "25.50",
        "displayCurrency": "EUR",
        "direction": "OUT",
        "counterparty": {
          "phone": "+22507654321"
        },
        "description": "Remboursement restaurant",
        "createdAt": "2026-01-19T10:30:00.000Z"
      },
      {
        "id": "clxx...",
        "type": "DEPOSIT_ONRAMP",
        "status": "COMPLETED",
        "amountUsdc": "16.40",
        "displayAmount": "10000.00",
        "displayCurrency": "XOF",
        "direction": "IN",
        "createdAt": "2026-01-18T14:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 4.6 Webhooks

#### `POST /webhooks/momo`
**Description** : Callback MTN MoMo pour notifications de paiement

**Authentification** : Signature MoMo (subscription key)

**Headers requis :**
```
X-Reference-Id: uuid
Ocp-Apim-Subscription-Key: subscription_key
```

**Body (exemple succès) :**
```json
{
  "financialTransactionId": "momo-tx-123",
  "externalId": "transaction-id",
  "status": "SUCCESSFUL",
  "amount": "10000",
  "currency": "XOF",
  "payer": {
    "partyIdType": "MSISDN",
    "partyId": "22501234567"
  }
}
```

**Réponse (200) :**
```json
{
  "received": true
}
```

---

#### `POST /webhooks/circle`
**Description** : Callback Circle pour événements wallet

**Authentification** : Signature Circle

**Body (exemple transfert entrant) :**
```json
{
  "subscriptionId": "circle-sub-id",
  "notificationType": "transactions.complete",
  "notification": {
    "id": "circle-tx-id",
    "state": "COMPLETE",
    "walletId": "circle-wallet-id",
    "tokenId": "usdc-token-id",
    "amounts": ["100.50"],
    "transactionType": "INBOUND",
    "txHash": "0xabcdef..."
  }
}
```

**Réponse (200) :**
```json
{
  "received": true
}
```

---

## 5. Scénarios de Tests

### 5.1 Scénario Complet : Inscription → Dépôt → Transfert

```
1. POST /auth/register
   - Créer un utilisateur avec phone +22501234567
   - Récupérer accessToken

2. POST /auth/request-otp
   - Demander OTP pour KYC

3. POST /auth/verify-otp
   - Vérifier OTP "123456" (test)
   - KYC passe à BASIC

4. POST /wallet
   - Créer le wallet Circle
   - Récupérer l'adresse blockchain

5. GET /wallet/balance
   - Vérifier solde = 0

6. POST /wallet/deposit
   - Dépôt de 10000 XOF
   - Status: PROCESSING

7. POST /webhooks/momo (simulé)
   - Confirmer le paiement MoMo

8. GET /wallet/balance
   - Vérifier solde ≈ 16.40 USDC

9. POST /wallet/transfer
   - Envoyer 10 EUR à +22507654321
   - Status: COMPLETED

10. GET /wallet/transactions
    - Vérifier historique (2 transactions)
```

### 5.2 Tests Unitaires Recommandés

#### Domain Layer

```typescript
// User Entity
describe('User', () => {
  it('should create user with NONE KYC level', () => {});
  it('should upgrade KYC to BASIC after OTP verification', () => {});
  it('should enforce KYC limits on transactions', () => {});
  it('should hash OTP before storage', () => {});
});

// Wallet Entity
describe('Wallet', () => {
  it('should start with PENDING status', () => {});
  it('should transition to ACTIVE after Circle confirmation', () => {});
  it('should reject transactions when FROZEN', () => {});
  it('should validate balance before debit', () => {});
});

// Transaction Entity
describe('Transaction', () => {
  it('should follow state machine transitions', () => {});
  it('should not allow COMPLETED → PENDING', () => {});
  it('should calculate net amount (amount - fee)', () => {});
});

// Money Value Object
describe('Money', () => {
  it('should convert USDC to EUR correctly', () => {});
  it('should convert USDC to XOF correctly', () => {});
  it('should throw on different currency addition', () => {});
  it('should format display string correctly', () => {});
});

// LedgerService
describe('LedgerService', () => {
  it('should create balanced deposit entries', () => {});
  it('should create balanced transfer entries', () => {});
  it('should throw on imbalanced entries', () => {});
});
```

#### Application Layer

```typescript
// CreateWalletHandler
describe('CreateWalletHandler', () => {
  it('should create wallet via Circle API', () => {});
  it('should be idempotent with same key', () => {});
  it('should reject if wallet exists', () => {});
});

// InitiateDepositHandler
describe('InitiateDepositHandler', () => {
  it('should convert fiat to USDC amount', () => {});
  it('should initiate MoMo collection', () => {});
  it('should create PENDING transaction', () => {});
});

// ExecuteTransferHandler
describe('ExecuteTransferHandler', () => {
  it('should execute P2P transfer', () => {});
  it('should reject insufficient balance', () => {});
  it('should update both wallets atomically', () => {});
});
```

### 5.3 Tests d'Intégration

```typescript
// API Integration Tests
describe('Wallet API', () => {
  it('POST /wallet - should create wallet', async () => {
    const response = await request(app)
      .post('/api/v2/wallet')
      .set('Authorization', `Bearer ${token}`)
      .send({ blockchain: 'POLYGON_AMOY' });

    expect(response.status).toBe(201);
    expect(response.body.data.wallet.status).toBe('ACTIVE');
  });

  it('POST /wallet/deposit - should initiate deposit', async () => {
    const response = await request(app)
      .post('/api/v2/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 10000,
        currency: 'XOF',
        phoneNumber: '+22501234567'
      });

    expect(response.status).toBe(202);
    expect(response.body.data.transaction.status).toBe('PROCESSING');
  });

  it('POST /wallet/transfer - should transfer P2P', async () => {
    const response = await request(app)
      .post('/api/v2/wallet/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 25,
        currency: 'EUR',
        recipientPhone: '+22507654321'
      });

    expect(response.status).toBe(200);
    expect(response.body.data.transaction.status).toBe('COMPLETED');
  });
});
```

### 5.4 Tests de Charge

```yaml
# k6 load test
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/v2/wallet/balance', {
    headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

---

## 6. Modèles de Données

### 6.1 User

| Champ | Type | Description |
|-------|------|-------------|
| id | string | CUID unique |
| phone | string | Format E.164, unique |
| email | string? | Email, unique si présent |
| passwordHash | string | Hash bcrypt |
| kycLevel | enum | NONE, BASIC, VERIFIED, ENHANCED |
| kycData | json? | Données KYC supplémentaires |
| displayCurrency | enum | EUR, XOF, USD |
| locale | string | fr-FR, en-US, etc. |
| otpHash | string? | Hash OTP temporaire |
| otpExpiresAt | datetime? | Expiration OTP |
| createdAt | datetime | Date création |
| updatedAt | datetime | Date mise à jour |

### 6.2 Wallet

| Champ | Type | Description |
|-------|------|-------------|
| id | string | CUID unique |
| userId | string | FK vers User (unique) |
| circleWalletId | string | ID Circle, unique |
| walletSetId | string | ID Wallet Set Circle |
| address | string | Adresse blockchain, unique |
| blockchain | enum | POLYGON_AMOY, ETH_SEPOLIA, etc. |
| status | enum | PENDING, ACTIVE, FROZEN, CLOSED |
| balanceUsdc | decimal(18,6) | Solde USDC |
| createdAt | datetime | Date création |
| updatedAt | datetime | Date mise à jour |

### 6.3 Transaction

| Champ | Type | Description |
|-------|------|-------------|
| id | string | CUID unique |
| idempotencyKey | string | Clé idempotence, unique |
| externalRef | string? | Réf externe (Circle, MoMo), unique |
| type | enum | DEPOSIT_ONRAMP, TRANSFER_P2P, etc. |
| status | enum | PENDING, PROCESSING, COMPLETED, etc. |
| amountUsdc | decimal(18,6) | Montant en USDC |
| feeUsdc | decimal(18,6) | Frais en USDC |
| exchangeRate | decimal(18,8)? | Taux de change utilisé |
| displayCurrency | enum? | Devise affichage |
| displayAmount | decimal(18,2)? | Montant affiché |
| walletId | string | FK vers Wallet |
| counterpartyId | string? | FK vers Wallet destinataire |
| description | string? | Description libre |
| metadata | json? | Métadonnées provider |
| failureReason | string? | Raison échec |
| createdAt | datetime | Date création |
| updatedAt | datetime | Date mise à jour |
| completedAt | datetime? | Date complétion |

### 6.4 LedgerEntry

| Champ | Type | Description |
|-------|------|-------------|
| id | string | CUID unique |
| transactionId | string | FK vers Transaction |
| walletId | string? | FK vers Wallet (null = compte système) |
| accountType | enum | USER, ESCROW, FEES, LIQUIDITY |
| amountUsdc | decimal(18,6) | Montant (+ crédit, - débit) |
| entryType | enum | DEBIT, CREDIT |
| balanceAfter | decimal(18,6) | Solde après écriture |
| createdAt | datetime | Date création |

---

## 7. Codes d'Erreur

### 7.1 Erreurs HTTP Standard

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Ressource créée |
| 202 | Accepté (traitement async) |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès interdit |
| 404 | Ressource non trouvée |
| 409 | Conflit (duplicate) |
| 422 | Entité non traitable |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |
| 503 | Service indisponible |

### 7.2 Codes d'Erreur Métier

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Données invalides |
| `INVALID_CREDENTIALS` | 401 | Identifiants incorrects |
| `TOKEN_EXPIRED` | 401 | Token JWT expiré |
| `INVALID_TOKEN` | 401 | Token JWT invalide |
| `KYC_REQUIRED` | 403 | Niveau KYC insuffisant |
| `KYC_LIMIT_EXCEEDED` | 403 | Limite KYC dépassée |
| `WALLET_FROZEN` | 403 | Wallet gelé |
| `USER_NOT_FOUND` | 404 | Utilisateur non trouvé |
| `WALLET_NOT_FOUND` | 404 | Wallet non trouvé |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction non trouvée |
| `DUPLICATE_PHONE` | 409 | Téléphone déjà utilisé |
| `DUPLICATE_EMAIL` | 409 | Email déjà utilisé |
| `WALLET_EXISTS` | 409 | Wallet déjà créé |
| `INSUFFICIENT_FUNDS` | 422 | Solde insuffisant |
| `INVALID_OTP` | 422 | OTP invalide ou expiré |
| `INVALID_TRANSACTION_STATE` | 422 | État transaction invalide |
| `RATE_LIMIT_EXCEEDED` | 429 | Trop de requêtes |
| `CIRCLE_ERROR` | 503 | Erreur API Circle |
| `MOMO_ERROR` | 503 | Erreur API MoMo |

---

## 8. Webhooks

### 8.1 Événements MoMo

| Type | Description | Action |
|------|-------------|--------|
| `SUCCESSFUL` | Paiement réussi | Compléter transaction, créditer wallet |
| `FAILED` | Paiement échoué | Marquer transaction FAILED |
| `PENDING` | En attente | Aucune (attendre) |
| `EXPIRED` | Expiré | Marquer transaction EXPIRED |

### 8.2 Événements Circle

| Type | Description | Action |
|------|-------------|--------|
| `transactions.complete` | Transaction terminée | Mettre à jour status |
| `transactions.failed` | Transaction échouée | Marquer FAILED |
| `wallets.created` | Wallet créé | Activer wallet |
| `wallets.updated` | Wallet mis à jour | Sync status |
| `inbound_transfer` | Dépôt crypto entrant | Créer transaction DEPOSIT_CRYPTO |

### 8.3 Retry Policy

- **Tentatives** : 3 maximum
- **Intervalle** : Exponentiel (1s, 5s, 30s)
- **Timeout** : 30 secondes
- **Dead Letter** : Après 3 échecs

---

## 9. Limites KYC

### 9.1 Niveaux et Limites

| Niveau | Dépôt/jour | Retrait/jour | Transfert/jour | Dépôt/mois |
|--------|------------|--------------|----------------|------------|
| NONE | 0 | 0 | 0 | 0 |
| BASIC | 50 000 XOF | 25 000 XOF | 100 000 XOF | 200 000 XOF |
| VERIFIED | 500 000 XOF | 250 000 XOF | 1 000 000 XOF | 2 000 000 XOF |
| ENHANCED | Illimité | Illimité | Illimité | Illimité |

### 9.2 Équivalents EUR (approximatif)

| Niveau | Dépôt/jour | Retrait/jour | Transfert/jour |
|--------|------------|--------------|----------------|
| BASIC | ~76 EUR | ~38 EUR | ~152 EUR |
| VERIFIED | ~760 EUR | ~380 EUR | ~1520 EUR |
| ENHANCED | Illimité | Illimité | Illimité |

### 9.3 Vérification KYC

| Niveau | Vérification requise |
|--------|---------------------|
| NONE → BASIC | OTP téléphone |
| BASIC → VERIFIED | Pièce d'identité |
| VERIFIED → ENHANCED | Justificatif domicile |

---

## Annexe A : Collection Postman

Une collection Postman est disponible pour faciliter les tests :

```
back2/docs/postman/PulaPay_v2.postman_collection.json
```

Variables d'environnement recommandées :
- `baseUrl` : http://localhost:3000/api/v2
- `accessToken` : (généré après login)
- `refreshToken` : (généré après login)

---

## Annexe B : Données de Test

### Utilisateurs de test (après seed)

| Phone | Password | KYC | Wallet |
|-------|----------|-----|--------|
| +22501000001 | Test123! | BASIC | Oui |
| +22501000002 | Test123! | VERIFIED | Oui |
| +22501000003 | Test123! | NONE | Non |

### OTP de test

En environnement `sandbox`/`development`, l'OTP `123456` est toujours valide.

### Adresses de test (Polygon Amoy)

- USDC Contract : `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`
- Faucet USDC : https://faucet.circle.com/

---

*Document généré pour Pula Pay v2 — Guide de Tests*
