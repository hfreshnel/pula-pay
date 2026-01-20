import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// Middleware
import { authMiddleware } from '../middleware/auth';

// Controllers
import { AuthController } from '../controllers/AuthController';
import { WalletController } from '../controllers/WalletController';
import { WebhookController } from '../controllers/WebhookController';
import { ExchangeRateController } from '../controllers/ExchangeRateController';
import { HealthController } from '../controllers/HealthController';

// Handlers
import { CreateWalletHandler } from '../../../application/commands/CreateWalletHandler';
import { InitiateDepositHandler } from '../../../application/commands/InitiateDepositHandler';
import { InitiateWithdrawalHandler } from '../../../application/commands/InitiateWithdrawalHandler';
import { ExecuteTransferHandler } from '../../../application/commands/ExecuteTransferHandler';
import { ConfirmDepositHandler } from '../../../application/commands/ConfirmDepositHandler';
import { GetBalanceHandler } from '../../../application/queries/GetBalanceHandler';
import { GetTransactionHistoryHandler } from '../../../application/queries/GetTransactionHistoryHandler';
import { GetExchangeRateHandler } from '../../../application/queries/GetExchangeRateHandler';
import { CurrencyConversionService } from '../../../application/services/CurrencyConversionService';

// Repositories
import { PrismaUserRepository } from '../../persistence/repositories/PrismaUserRepository';
import { PrismaWalletRepository } from '../../persistence/repositories/PrismaWalletRepository';
import { PrismaTransactionRepository } from '../../persistence/repositories/PrismaTransactionRepository';
import { PrismaLedgerEntryRepository } from '../../persistence/repositories/PrismaLedgerEntryRepository';

// Adapters
import { CircleWalletAdapter } from '../../adapters/circle/CircleWalletAdapter';
import { MomoOnRampAdapter } from '../../adapters/momo/MomoOnRampAdapter';
import { CoingeckoAdapter } from '../../adapters/exchange/CoingeckoAdapter';
import { CachedExchangeRateAdapter } from '../../adapters/exchange/CachedExchangeRateAdapter';

export function createRouter(prisma: PrismaClient): Router {
  const router = Router();

  // Initialize repositories
  const userRepo = new PrismaUserRepository(prisma);
  const walletRepo = new PrismaWalletRepository(prisma);
  const txRepo = new PrismaTransactionRepository(prisma);
  const ledgerRepo = new PrismaLedgerEntryRepository(prisma);

  // Initialize adapters
  const circleAdapter = new CircleWalletAdapter();
  const momoAdapter = new MomoOnRampAdapter();
  const coingeckoAdapter = new CoingeckoAdapter();
  const exchangeRateAdapter = new CachedExchangeRateAdapter(coingeckoAdapter, prisma);

  // Initialize handlers
  const createWalletHandler = new CreateWalletHandler(userRepo, walletRepo, circleAdapter);
  const depositHandler = new InitiateDepositHandler(walletRepo, txRepo, momoAdapter, exchangeRateAdapter);
  const withdrawHandler = new InitiateWithdrawalHandler(walletRepo, txRepo, momoAdapter, exchangeRateAdapter);
  const transferHandler = new ExecuteTransferHandler( prisma, walletRepo, txRepo, ledgerRepo, circleAdapter, exchangeRateAdapter);
  const confirmDepositHandler = new ConfirmDepositHandler(prisma, txRepo, walletRepo, ledgerRepo);
  const balanceHandler = new GetBalanceHandler(userRepo, walletRepo, exchangeRateAdapter);
  const historyHandler = new GetTransactionHistoryHandler(walletRepo, txRepo);
  const rateHandler = new GetExchangeRateHandler(exchangeRateAdapter);
  const conversionService = new CurrencyConversionService(exchangeRateAdapter);

  // Initialize controllers
  const authController = new AuthController(userRepo);
  const walletController = new WalletController( createWalletHandler, depositHandler, withdrawHandler, transferHandler, balanceHandler, historyHandler);
  const webhookController = new WebhookController(confirmDepositHandler, momoAdapter);
  const rateController = new ExchangeRateController(rateHandler, conversionService);
  const healthController = new HealthController(prisma);

  // Health routes (no auth)
  router.get('/health', healthController.getHealth);
  router.get('/ready', healthController.getReady);
  router.get('/live', healthController.getLive);

  // Auth routes (public)
  router.post('/auth/register', authController.register);
  router.post('/auth/login', authController.login);
  router.post('/auth/request-otp', authController.requestOtp);
  router.post('/auth/verify-otp', authController.verifyOtp);
  router.post('/auth/refresh', authController.refreshToken);

  // Auth routes (protected)
  router.get('/auth/me', authMiddleware, authController.me);
  router.patch('/auth/me', authMiddleware, authController.updateProfile);

  // Public routes
  router.get('/exchange-rates', rateController.getRates);
  router.get('/exchange-rates/preview', rateController.getConversionPreview);

  // Webhook routes (no auth, validated internally)
  router.post('/webhooks/momo', webhookController.handleMomoWebhook);
  router.post('/webhooks/circle', webhookController.handleCircleWebhook);

  // Protected wallet routes
  router.post('/wallet', authMiddleware, walletController.createWallet);
  router.get('/wallet/balance', authMiddleware, walletController.getBalance);
  router.post('/wallet/deposit', authMiddleware, walletController.initiateDeposit);
  router.post('/wallet/withdraw', authMiddleware, walletController.initiateWithdrawal);
  router.post('/wallet/transfer', authMiddleware, walletController.transfer);
  router.get('/wallet/transactions', authMiddleware, walletController.getTransactionHistory);

  return router;
}
