import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Pula Pay API v2',
      version: '2.0.0',
      description: 'Universal African Money Account with Circle/USDC integration',
      contact: {
        name: 'Pula Pay Team',
        email: 'support@pulapay.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v2',
        description: 'Development server',
      },
      {
        url: 'https://api.pulapay.com/api/v2',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        Currency: {
          type: 'string',
          enum: ['EUR', 'XOF', 'USD'],
        },
        Blockchain: {
          type: 'string',
          enum: ['POLYGON_AMOY', 'ETH_SEPOLIA', 'ARBITRUM_SEPOLIA', 'POLYGON', 'ARBITRUM', 'ETHEREUM'],
        },
        TxType: {
          type: 'string',
          enum: ['DEPOSIT_ONRAMP', 'DEPOSIT_CRYPTO', 'WITHDRAWAL_OFFRAMP', 'WITHDRAWAL_CRYPTO', 'TRANSFER_P2P', 'REFUND', 'FEE'],
        },
        TxStatus: {
          type: 'string',
          enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'],
        },
        WalletStatus: {
          type: 'string',
          enum: ['PENDING', 'ACTIVE', 'FROZEN', 'CLOSED'],
        },
        KycLevel: {
          type: 'string',
          enum: ['NONE', 'BASIC', 'VERIFIED', 'ENHANCED'],
        },
        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['phone', 'password'],
          properties: {
            phone: { type: 'string', example: '+22990123456', minLength: 8, maxLength: 15 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 8, example: 'securePass123' },
            displayCurrency: { $ref: '#/components/schemas/Currency' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['phone', 'password'],
          properties: {
            phone: { type: 'string', example: '+22990123456' },
            password: { type: 'string', example: 'securePass123' },
          },
        },
        RequestOtpRequest: {
          type: 'object',
          required: ['phone'],
          properties: {
            phone: { type: 'string', example: '+22990123456' },
          },
        },
        VerifyOtpRequest: {
          type: 'object',
          required: ['phone', 'otp'],
          properties: {
            phone: { type: 'string', example: '+22990123456' },
            otp: { type: 'string', example: '123456', minLength: 6, maxLength: 6 },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            displayCurrency: { $ref: '#/components/schemas/Currency' },
            locale: { type: 'string', example: 'fr-FR', minLength: 2, maxLength: 10 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            kycLevel: { $ref: '#/components/schemas/KycLevel' },
            displayCurrency: { $ref: '#/components/schemas/Currency' },
            locale: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'string', example: '15m' },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'string', example: '15m' },
          },
        },
        ProfileResponse: {
          type: 'object',
          properties: {
            user: { $ref: '#/components/schemas/User' },
            limits: {
              type: 'object',
              properties: {
                dailyLimit: { type: 'number', example: 100 },
                monthlyLimit: { type: 'number', example: 3000 },
              },
            },
          },
        },
        OtpResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'OTP sent successfully' },
            expiresIn: { type: 'string', example: '10 minutes' },
          },
        },
        CreateWalletRequest: {
          type: 'object',
          properties: {
            blockchain: { $ref: '#/components/schemas/Blockchain' },
          },
        },
        CreateWalletResponse: {
          type: 'object',
          properties: {
            walletId: { type: 'string' },
            address: { type: 'string' },
            blockchain: { $ref: '#/components/schemas/Blockchain' },
            status: { $ref: '#/components/schemas/WalletStatus' },
          },
        },
        BalanceResponse: {
          type: 'object',
          properties: {
            balanceUsdc: { type: 'string', example: '100.500000' },
            displayBalance: { type: 'string', example: '65000.00' },
            displayCurrency: { $ref: '#/components/schemas/Currency' },
            walletAddress: { type: 'string' },
            walletStatus: { $ref: '#/components/schemas/WalletStatus' },
          },
        },
        DepositRequest: {
          type: 'object',
          required: ['amount', 'currency'],
          properties: {
            amount: { type: 'number', example: 50.0, minimum: 0, description: 'Fiat amount to deposit' },
            currency: { $ref: '#/components/schemas/Currency', description: 'Fiat currency (USD or EUR)' },
            country: { type: 'string', example: 'US', default: 'US', minLength: 2, maxLength: 2, description: 'ISO 3166-1 country code' },
            paymentMethod: { type: 'string', enum: ['CARD', 'ACH_BANK_ACCOUNT', 'APPLE_PAY'], default: 'CARD' },
          },
        },
        DepositResponse: {
          type: 'object',
          properties: {
            transactionId: { type: 'string' },
            providerRef: { type: 'string' },
            status: { $ref: '#/components/schemas/TxStatus' },
            amountUsdc: { type: 'string', description: 'Estimated USDC amount' },
            displayAmount: { type: 'string' },
            displayCurrency: { $ref: '#/components/schemas/Currency' },
            paymentUrl: { type: 'string', format: 'uri', description: 'Coinbase Pay widget URL - open in WebView/browser' },
            fees: {
              type: 'object',
              properties: {
                coinbaseFee: { type: 'string' },
                networkFee: { type: 'string' },
                paymentTotal: { type: 'string', description: 'Total fiat amount charged' },
              },
            },
          },
        },
        WithdrawRequest: {
          type: 'object',
          required: ['amount', 'targetCurrency'],
          properties: {
            amount: { type: 'number', example: 25.0, minimum: 0, description: 'Fiat amount to withdraw' },
            targetCurrency: { $ref: '#/components/schemas/Currency', description: 'Fiat cashout currency (USD or EUR)' },
            country: { type: 'string', example: 'US', default: 'US', minLength: 2, maxLength: 2 },
            paymentMethod: { type: 'string', enum: ['ACH_BANK_ACCOUNT', 'CARD'], default: 'ACH_BANK_ACCOUNT' },
          },
        },
        WithdrawResponse: {
          type: 'object',
          properties: {
            transactionId: { type: 'string' },
            providerRef: { type: 'string' },
            status: { $ref: '#/components/schemas/TxStatus' },
            amountUsdc: { type: 'string' },
            feeUsdc: { type: 'string' },
            displayAmount: { type: 'string' },
            displayCurrency: { $ref: '#/components/schemas/Currency' },
            paymentUrl: { type: 'string', format: 'uri', description: 'Coinbase offramp URL - open in WebView/browser' },
            fees: {
              type: 'object',
              properties: {
                coinbaseFee: { type: 'string' },
                cashoutTotal: { type: 'string', description: 'Net fiat user receives' },
              },
            },
          },
        },
        OnrampQuoteResponse: {
          type: 'object',
          properties: {
            quoteId: { type: 'string' },
            purchaseAmount: { type: 'string', description: 'USDC amount user will receive' },
            paymentSubtotal: { type: 'string' },
            coinbaseFee: { type: 'string' },
            networkFee: { type: 'string' },
            paymentTotal: { type: 'string', description: 'Total fiat user pays' },
          },
        },
        OfframpQuoteResponse: {
          type: 'object',
          properties: {
            quoteId: { type: 'string' },
            sellAmount: { type: 'string' },
            cashoutSubtotal: { type: 'string' },
            cashoutTotal: { type: 'string', description: 'Net fiat user receives' },
            coinbaseFee: { type: 'string' },
          },
        },
        TransferRequest: {
          type: 'object',
          required: ['amount', 'currency'],
          properties: {
            recipientPhone: { type: 'string', example: '+22990654321' },
            recipientAddress: { type: 'string', example: '0x742d35Cc6634C0532925a3b844Bc9e7595f...' },
            amount: { type: 'number', example: 25.0, minimum: 0 },
            currency: { $ref: '#/components/schemas/Currency' },
            description: { type: 'string', maxLength: 200 },
          },
        },
        TransferResponse: {
          type: 'object',
          properties: {
            transactionId: { type: 'string' },
            status: { $ref: '#/components/schemas/TxStatus' },
            amountUsdc: { type: 'string' },
            fee: { type: 'string' },
            recipientAddress: { type: 'string' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { $ref: '#/components/schemas/TxType' },
            status: { $ref: '#/components/schemas/TxStatus' },
            amountUsdc: { type: 'string' },
            feeUsdc: { type: 'string' },
            displayAmount: { type: 'string' },
            displayCurrency: { $ref: '#/components/schemas/Currency' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
        TransactionHistoryResponse: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Transaction' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        ExchangeRate: {
          type: 'object',
          properties: {
            currency: { $ref: '#/components/schemas/Currency' },
            rate: { type: 'string', example: '0.92' },
            inverseRate: { type: 'string', example: '1.087' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ExchangeRatesResponse: {
          type: 'object',
          properties: {
            baseCurrency: { type: 'string', example: 'USDC' },
            rates: {
              type: 'array',
              items: { $ref: '#/components/schemas/ExchangeRate' },
            },
          },
        },
        ConversionPreviewResponse: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            inputAmount: { type: 'number' },
            outputAmount: { type: 'number' },
            rate: { type: 'string' },
            fee: { type: 'string' },
            validUntil: { type: 'string', format: 'date-time' },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'unhealthy'] },
            version: { type: 'string' },
            uptime: { type: 'integer' },
            checks: {
              type: 'object',
              properties: {
                database: { type: 'string', enum: ['ok', 'error'] },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication and user management' },
      { name: 'Exchange Rates', description: 'Currency exchange rates' },
      { name: 'Wallet', description: 'Wallet management and transactions' },
      { name: 'Webhooks', description: 'Provider webhook handlers' },
    ],
  },
  apis: ['./src/infrastructure/http/routes/*.ts', './src/infrastructure/http/swagger-docs.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
