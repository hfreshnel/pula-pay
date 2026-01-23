// ============================================
// AUTH ROUTES
// ============================================

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with phone and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Phone or email already registered
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: Authenticate with phone and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /auth/request-otp:
 *   post:
 *     summary: Request OTP
 *     description: Request a one-time password for phone verification (KYC upgrade)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestOtpRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OtpResponse'
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     description: Verify OTP and upgrade KYC level to BASIC
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *     responses:
 *       200:
 *         description: OTP verified, KYC upgraded
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TokenResponse'
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile and KYC limits
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile (email, displayCurrency, locale)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ProfileResponse'
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Email already in use
 */

// ============================================
// HEALTH ROUTES
// ============================================

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Returns the overall health status of the API including database connectivity
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service is unhealthy
 */

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness check
 *     description: Kubernetes readiness probe - indicates if the service can accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         ready:
 *                           type: boolean
 */

/**
 * @swagger
 * /live:
 *   get:
 *     summary: Liveness check
 *     description: Kubernetes liveness probe - indicates if the process is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         alive:
 *                           type: boolean
 */

/**
 * @swagger
 * /exchange-rates:
 *   get:
 *     summary: Get exchange rates
 *     description: Returns current USDC exchange rates for specified currencies
 *     tags: [Exchange Rates]
 *     parameters:
 *       - in: query
 *         name: currencies
 *         schema:
 *           type: string
 *         description: Comma-separated list of currencies (default EUR,XOF,USD)
 *         example: EUR,XOF
 *     responses:
 *       200:
 *         description: Exchange rates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ExchangeRatesResponse'
 */

/**
 * @swagger
 * /exchange-rates/preview:
 *   get:
 *     summary: Preview currency conversion
 *     description: Get a preview of currency conversion with fees
 *     tags: [Exchange Rates]
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: Amount to convert
 *         example: 100
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Source currency (USDC, EUR, XOF, USD)
 *         example: EUR
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Target currency (USDC, EUR, XOF, USD)
 *         example: USDC
 *     responses:
 *       200:
 *         description: Conversion preview
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ConversionPreviewResponse'
 */

/**
 * @swagger
 * /wallet:
 *   post:
 *     summary: Create a new wallet
 *     description: Creates a new Circle programmable wallet for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWalletRequest'
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CreateWalletResponse'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       409:
 *         description: Wallet already exists for this user
 */

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     description: Returns the current balance of the authenticated user's wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: currency
 *         schema:
 *           $ref: '#/components/schemas/Currency'
 *         description: Display currency for balance conversion
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BalanceResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */

/**
 * @swagger
 * /wallet/sync-status:
 *   post:
 *     summary: Sync wallet status
 *     description: Manually sync wallet status with Circle. Useful for activating wallets stuck in PENDING state.
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet status synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         walletId:
 *                           type: string
 *                           description: Wallet ID
 *                         previousStatus:
 *                           type: string
 *                           description: Status before sync
 *                           example: PENDING
 *                         currentStatus:
 *                           type: string
 *                           description: Status after sync
 *                           example: ACTIVE
 *                         wasUpdated:
 *                           type: boolean
 *                           description: Whether the status was changed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Failed to sync with Circle
 */

/**
 * @swagger
 * /wallet/deposit:
 *   post:
 *     summary: Initiate a deposit
 *     description: Initiate a mobile money deposit to convert fiat to USDC
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepositRequest'
 *     responses:
 *       202:
 *         description: Deposit initiated - awaiting mobile money confirmation
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DepositResponse'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Initiate a withdrawal
 *     description: Initiate a withdrawal to convert USDC back to mobile money
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawRequest'
 *     responses:
 *       202:
 *         description: Withdrawal initiated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WithdrawResponse'
 *       400:
 *         description: Invalid request / Insufficient funds
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /wallet/transfer:
 *   post:
 *     summary: Transfer funds
 *     description: Transfer USDC to another user (by phone) or external wallet address
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *           examples:
 *             phoneTransfer:
 *               summary: Transfer to phone number
 *               value:
 *                 recipientPhone: "+22990654321"
 *                 amount: 25.0
 *                 currency: "EUR"
 *                 description: "Payment for services"
 *             addressTransfer:
 *               summary: Transfer to wallet address
 *               value:
 *                 recipientAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f..."
 *                 amount: 50.0
 *                 currency: "USD"
 *     responses:
 *       202:
 *         description: Transfer initiated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Invalid request / Insufficient funds
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recipient not found
 */

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Get transaction history
 *     description: Returns the transaction history for the authenticated user's wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           $ref: '#/components/schemas/TxType'
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/TxStatus'
 *         description: Filter by transaction status
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter transactions from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter transactions until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Transaction history
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TransactionHistoryResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /webhooks/momo:
 *   post:
 *     summary: MoMo webhook handler
 *     description: Receives webhook notifications from Mobile Money providers
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referenceId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [SUCCESSFUL, FAILED, PENDING]
 *               financialTransactionId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook processed
 *       401:
 *         description: Invalid webhook signature
 */

/**
 * @swagger
 * /webhooks/circle:
 *   post:
 *     summary: Circle webhook handler
 *     description: Receives webhook notifications from Circle
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscriptionId:
 *                 type: string
 *               notificationId:
 *                 type: string
 *               notificationType:
 *                 type: string
 *               notification:
 *                 type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
